const bitcoin = require('bitcoin');
const bitcoinjs = require('bitcoinjs-lib');
const ECPairFactory = require('ecpair').default;
const ecc = require('tiny-secp256k1');

const ECPair = ECPairFactory(ecc);

const promisefy = function (client, f, args) {
    args = args || [];
    return new Promise(function (resolve, reject) {
        var callback = function (error, result) {
            if (error) {
                reject(error);
                return;
            }
            resolve(result);
        };
        var finalArgs = args.concat(callback);
        f.apply(client, finalArgs);
    });
};

const getAddressFromPublicKey = (publicKey, type, network) => {
    switch (type) {
        case 'legacy':
            return bitcoinjs.payments.p2pkh({ pubkey: publicKey, network }).address;
        case 'p2sh-segwit':
            return bitcoinjs.payments.p2sh({
                redeem: bitcoinjs.payments.p2wpkh({ pubkey: publicKey, network }),
                network
            }).address;
        case 'bech32':
            return bitcoinjs.payments.p2wpkh({ pubkey: publicKey, network }).address;
        default:
            throw new Error(`Unsupported address type: ${type}`);
    }
};

module.exports = class BtcNodeHelper {
    constructor(config) {
        this.config = config;
        this.client = new bitcoin.Client(config);
    }

    getNetwork() {
        return this.config.network || bitcoinjs.networks.regtest;
    }

    /**
     * Generates the key pair locally instead of asking the node for one.
     * Bitcoin Core 30+ removed the legacy wallet and its `dumpprivkey` RPC,
     * so descriptor wallets can no longer expose a per-address private key.
     */
    async generateAddressInformation(type) {
        type = type || 'legacy';
        const network = this.getNetwork();
        const keyPair = ECPair.makeRandom({ network });
        return {
            address: getAddressFromPublicKey(keyPair.publicKey, type, network),
            privateKey: keyPair.toWIF()
        };
    }

    async generateMultisigAddressInformation(signerSize, requiredSigners, type) {
        signerSize = signerSize || 3;
        requiredSigners = requiredSigners || 2;
        type = type || 'legacy';

        if (signerSize < requiredSigners) {
            throw new Error('Total amount of signers can not be smaller than signers amount');
        }

        const network = this.getNetwork();
        const members = [];

        // Generate the keys that will form the multisig address
        for (let i = 1; i <= signerSize; i++) {
            members.push(await this.generateAddressInformation(type));
        }

        const publicKeys = members.map(member => ECPair.fromWIF(member.privateKey, network).publicKey.toString('hex'));

        // `addmultisigaddress` was removed in Bitcoin Core 30 with the legacy wallet.
        // `createmultisig` does not require a wallet and takes public keys instead of addresses.
        const multisig = await this.execute('createmultisig', [requiredSigners, publicKeys, type]);

        return {
            address: multisig.address,
            info: {
                members,
                redeemScript: multisig.redeemScript
            }
        };
    }

    fundAddress(address, amount) {
        return promisefy(this.client, this.client.sendToAddress, [address, amount]);
    }

    getRawTransaction(txId) {
        return promisefy(this.client, this.client.getRawTransaction, [txId, false]);
    }

    async signTransaction(unsignedTransaction, previousTransactions, privateKeys) {
        let signedTxResult = await promisefy(this.client, this.client.cmd, [
            'signrawtransactionwithkey',
            unsignedTransaction,
            privateKeys,
            previousTransactions
        ]);
        if (!signedTxResult.complete) {
            console.error('failed to sign', signedTxResult.errors);
            throw new Error('failed to sign');
        }
        return signedTxResult.hex;
    }

    async sendTransaction(signedTransaction) {
        return promisefy(this.client, this.client.sendRawTransaction, [signedTransaction]);
    }

    /**
     * Mines blocks sending the rewards to a wallet address, so the node wallet
     * keeps accumulating spendable funds for `fundAddress`.
     * The `generate` RPC was removed in Bitcoin Core 0.19 in favor of `generatetoaddress`.
     */
    async mine(blocks) {
        if (!this.miningAddress) {
            this.miningAddress = await promisefy(this.client, this.client.getNewAddress, []);
        }
        return this.execute('generatetoaddress', [blocks, this.miningAddress]);
    }

    getBlock(blockHash, deserialized = true) {
        return promisefy(this.client, this.client.getBlock, [blockHash, deserialized]);
    }

    getBlockCount() {
        return promisefy(this.client, this.client.getBlockCount, []);
    }

    /**
     * Scans the UTXO set for the given address instead of using `listunspent`.
     * `listunspent` only returns UTXOs of addresses tracked by the wallet, and since
     * Bitcoin Core 30 removed `importaddress`/`dumpprivkey` the wallet can no longer
     * track the externally generated addresses this helper produces.
     * Note: `scantxoutset` only sees confirmed UTXOs, so a block needs to be mined
     * after funding an address (`fundAddress` does this by default).
     */
    async getUtxos(address) {
        const scanResult = await this.execute('scantxoutset', ['start', [`addr(${address})`]]);
        return scanResult.unspents.map(utxo => Object.assign({ address }, utxo));
    }

    execute(cmd, args = []) {
        return promisefy(this.client, this.client.cmd, [cmd].concat(args));
    }

    btcToSatoshis(btc) {
        return parseInt(btc * 1e8);
    }

    satoshisToBtc(satoshi) {
        return parseFloat(satoshi / 1e8);
    }

    parseRawTransaction(rawTransaction) {
        return promisefy(this.client, this.client.decodeRawTransaction, [rawTransaction]);
    }

    getBlockHeader(blockHash, jsonEncoded = true) {
        return this.execute('getblockheader', [blockHash, jsonEncoded]);
    }

    getTransactionsInMempool(verbose = false) {
        return this.execute('getrawmempool', [verbose]);
    }
};
