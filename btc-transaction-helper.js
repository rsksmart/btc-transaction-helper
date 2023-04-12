'use strict';
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

    /**
     * 
     * @param {AddressType} type 
     * @returns {AddressInformation}
     */
    generateBtcAddress(type) {
        try {
            type = type || 'legacy';
            return this.nodeClient.generateAddressInformation(type);
        }
        catch (err) {
            throw new BtcHelperException('Error creating BTC address', err);
        }
    }

    /**
     * 
     * @param {number} signerSize 
     * @param {number} requiredSigners 
     * @param {AddressType} type 
     * @returns {MultisigAddressInformation}
     */
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
     * @returns {SpendableUtxosInformation}
     */
    async selectSpendableUTXOsFromAddress(address, amountInBtc) {

        const utxos = await this.getUtxos(address);

        const selected = [];
        let accumulated = 0;

        for(let i = 0; i < utxos.length && accumulated < amountInBtc; i++) {
            selected.push(utxos[i]);
            accumulated += utxos[i].amount;
        }

        // At this point `accumulated` should be greater than `amountInBtc`. If not, throw error.
        if(accumulated < amountInBtc) {
            throw Error('The sender does not have enough balance to proceed with the transfer');
        }

        // Necessary to avoid floating point operation issues
        const change = satoshisToBtc(btcToSatoshis(accumulated) - btcToSatoshis(amountInBtc));

        return {
            utxos: selected,
            change: change,
        };

    };

    /**
     * 
     * @param {string} address 
     * @returns {TxOutput[]} utxos
     */
    async getUtxos(address) {
        return await this.nodeClient.getUtxos(address);
    }

    /**
     * Transfers the btc amounts to the recipients specified in the `recipientsTransactionInformation`.
     * Gets the spendable utxos of the `senderAddressInformation` up to the sum of the `amountInBtc`s specified in the `recipientsTransactionInformation`.
     * @param {{address: string, privateKey: string, info?: any }} senderAddressInformation 
     * @param {Array<{recipientAddress: string, amountInBtc: number}>} recipientsTransactionInformation 
     * @param {Buffer[]} paymentData 
     * @returns {string} btcTxHash
     */
    async transferBtc(senderAddressInformation, recipientsTransactionInformation, paymentData) {
        try {

            const totalAmountInBtc = recipientsTransactionInformation.reduce((sum, output) => {
                return sum + output.amountInBtc;
            }, 0);

            const fromAddress = senderAddressInformation.address;
            const utxosInfo = await this.selectSpendableUTXOsFromAddress(fromAddress, totalAmountInBtc);
            
            const tx = new bitcoin.Transaction();

            utxosInfo.utxos.forEach(uxto => {
                tx.addInput(Buffer.from(uxto.txid, 'hex').reverse(), uxto.vout);
            });

            // Adding the transfer recipientsTransactionInformation outputs
            recipientsTransactionInformation.forEach(output => {
                tx.addOutput(
                    bitcoin.address.toOutputScript(output.recipientAddress, this.btcConfig.network),
                    this.nodeClient.btcToSatoshis(output.amountInBtc)
                );
            });

            const actualChange = utxosInfo.change - this.btcConfig.txFee;

            // Adding the change output
            if(actualChange > 0) {
                tx.addOutput(
                    bitcoin.address.toOutputScript(fromAddress, this.btcConfig.network),
                    this.nodeClient.btcToSatoshis(actualChange)
                );
            }

            if (paymentData) {
                paymentData.forEach(data => {
                    const dataScript = bitcoin.payments.embed({ data: [data] });
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

    /**
     * 
     * @param {string} address 
     * @returns {number}
     */
    async getAddressBalance(address) {
        let utxos = await this.nodeClient.getUtxos(address);
        return utxos.reduce((sum, utxo) => sum + utxo.amount, 0);
    }

    /**
     * 
     * @param {Buffer} outputScript 
     * @returns {string}
     */
    getOutputAddress(outputScript) {
        try {
            return bitcoin.address.fromOutputScript(outputScript, this.btcConfig.network);
        }
        catch(err) { // Outputs with OP_RETURN do not have an address
            return null;
        }
    }

    /**
     * 
     * @param {string} txHash 
     * @returns {Transaction}
     */
    async getTransaction(txHash) {
        let rawTx = await this.nodeClient.getRawTransaction(txHash)
        return bitcoin.Transaction.fromHex(rawTx);
    }

    /**
     * 
     * @param {string} address 
     * @param {string} label 
     * @returns {null}
     */
    async importAddress(address, label) {
        return await this.nodeClient.execute('importaddress', [address, label]);
    }

    /**
     * 
     * @param {string} address to be funded
     * @param {number} amountInBtc in btc to be send to the address
     * @param {boolean} mineBlock if true, a block will be mined after the transaction is sent. Defaults to true.
     * @returns {string} btcTxHash
     */
    async fundAddress(address, amountInBtc, mineBlock = true) {
        const fundAmount = Number(amountInBtc).toFixed(8);
        const btcTxHash = await this.nodeClient.fundAddress(
            address,
            fundAmount
        );
        if(mineBlock) {
            await this.mine();
        }
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

    getFee() {
        return this.btcConfig.txFee;
    }

}

module.exports = BtcTransactionHelper;
