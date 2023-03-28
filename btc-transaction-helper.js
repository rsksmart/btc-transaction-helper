"use strict";
const BtcHelperException = require('./btc-transaction-helper-error');
const BtcNodeHelper = require('./btc-node-helper/index');
const bitcoin = require('bitcoinjs-lib');
const { btcToSatoshis, satoshisToBtc } = require('./conversion');

const DEFAULT_BTC_CONFIG = {
    host: 'localhost',
    port: '18332',
    user: undefined,
    pass: undefined,
    network: bitcoin.networks.regtest,
    timeout: 30000,
    txFee: 0.001
};

class BtcTransactionHelper{
    constructor(btcConfig) {
        this.btcConfig = Object.assign({}, DEFAULT_BTC_CONFIG, btcConfig);
        this.createNodeClient();
    }

    createNodeClient() {
        try {
            this.nodeClient = new BtcNodeHelper(this.btcConfig);
        } 
        catch (err) {
            throw new BtcHelperException('Error creating BTC client', err);
        }
    }

    generateBtcAddress(type) {
        try {
            type = type || 'legacy';
            return this.nodeClient.generateAddressInformation(type);
        }
        catch (err) {
            throw new BtcHelperException('Error creating BTC address', err);
        }
    }

    generateMultisigAddress(signerSize, requiredSigners, type) {
        try {
            return this.nodeClient.generateMultisigAddressInformation(signerSize, requiredSigners, type);
        }
        catch (err) {
            throw new BtcHelperException('Error creating multisig BTC address', err);
        }
    }

    /**
     * 
     * @param {string} address 
     * @param {number} amountInBtc
     * @returns 
     */
    async selectSpendableUTXOsFromAddress(address, amountInBtc) {

        const utxos = await this.getUtxosWithBalanceInSatoshis(address);

        const selected = [];
        let accumulated = 0;

        for(let i = 0; i < utxos.length && accumulated < amountInBtc; i++) {
            selected.push(utxos[i]);
            accumulated += utxos[i].amount;
        }

        // Necessary to avoid floating point operation issues
        const change = satoshisToBtc(btcToSatoshis(accumulated) - btcToSatoshis(amountInBtc));

        return {
            utxos: selected,
            change: change,
        };

    };

    async getUtxosWithBalanceInSatoshis(address) {
        return await this.getUtxos(address);
    }

    async getUtxos(address) {
        return await this.nodeClient.getUtxos(address);
    }

    /**
     * Transfers the btc amounts to the recipients specified in the `outputs`.
     * Gets the spendable utxos of the `senderAddressInformation` up to the sum of the `amountInBtc`s specified in the `outputs`.
     * @param {{address: string, privateKey: string, info?: any }} senderAddressInformation 
     * @param {Array<{recipientAddress: string, amountInBtc: number}>} outputs 
     * @param {Array<any>} data 
     * @returns {string} btcTxHash
     */
    async transferBtc(senderAddressInformation, outputs, data) {
        try {

            const totalAmountInBtc = outputs.reduce((sum, output) => {
                return sum + output.amountInBtc;
            }, 0);

            const fromAddress = senderAddressInformation.address;
            const utxosInfo = await this.selectSpendableUTXOsFromAddress(fromAddress, totalAmountInBtc);
            
            const tx = new bitcoin.Transaction();

            utxosInfo.utxos.forEach(uxto => {
                tx.addInput(Buffer.from(uxto.txid, 'hex').reverse(), uxto.vout);
            });

            // Adding the transfer outputs
            outputs.forEach(output => {
                tx.addOutput(
                    bitcoin.address.toOutputScript(output.recipientAddress, this.btcConfig.network),
                    this.nodeClient.btcToSatoshis(output.amountInBtc)
                );
            });

            const actualChange = utxosInfo.change - this.btcConfig.txFee;

            // Adding the change output
            if(utxosInfo.change > 0) {
                tx.addOutput(
                    bitcoin.address.toOutputScript(fromAddress, this.btcConfig.network),
                    this.nodeClient.btcToSatoshis(actualChange)
                );
            }

            if (data) {
                data.forEach((dataElement) => {
                    const dataScript = bitcoin.payments.embed({ data: [dataElement] });
                    tx.addOutput(dataScript.output, 0); // OP_RETURN always with 0 value unless you want to burn coins
                });
            }
            
            const prevTxs = [];
            let privateKeys = [senderAddressInformation.privateKey];

            if (senderAddressInformation.info) {
                utxosInfo.utxos.forEach(uxto => {
                    prevTxs.push({
                        txid: tx.getId(),
                        vout: uxto.vout,
                        scriptPubKey: uxto.scriptPubKey.toString('hex'),
                        redeemScript: senderAddressInformation.info.redeemScript,
                        amount: uxto.amount
                    });
                });
                
                privateKeys = senderAddressInformation.info.members.map(a => a.privateKey);
            }

            const signedTx = await this.nodeClient.signTransaction(tx.toHex(), prevTxs, privateKeys);
            return this.nodeClient.sendTransaction(signedTx);
        }
        catch(err) {
            throw new BtcHelperException('Error during transfer process', err);
        }
    }

    async getAddressBalance(address) {
        let utxos = await this.nodeClient.getUtxos(address);
        return utxos.reduce((sum, utxo) => sum + utxo.amount, 0);
    }

    getOutputAddress(outputScript) {
        try {
            return bitcoin.address.fromOutputScript(outputScript, this.btcConfig.network);
        }
        catch(err) { // Outputs with OP_RETURN do not have an address
            return null;
        }
    }

    async getTransaction(txHash) {
        let rawTx = await this.nodeClient.getRawTransaction(txHash)
        return bitcoin.Transaction.fromHex(rawTx);
    }

    async importAddress(address, label) {
        return await this.nodeClient.execute('importaddress', [address, label]);
    }

    /**
     * 
     * @param {string} address to be funded
     * @param {number} amount in btc to be send to the address
     * @returns {string} btcTxHash
     */
    async fundAddress(address, amountInBtc) {
        const fundAmount = Number(amountInBtc + this.btcConfig.txFee).toFixed(8);
        const btcTxHash = await this.nodeClient.fundAddress(
            address,
            fundAmount
        );
        return btcTxHash;
    }

    /**
     * 
     * @param {number} blocks to mine. Defaults to 1.
     * @returns {string} btcTxHash
     */
    async mine(blocks = 1) {
        return await this.nodeClient.mine(blocks);
    }

}

module.exports = BtcTransactionHelper;
