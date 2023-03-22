"use strict";
const BtcHelperException = require('./btc-transaction-helper-error');
const BtcNodeHelper = require('./btc-node-helper/index');
const bitcoin = require('bitcoinjs-lib');

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

    async transferBtc(senderAddressInformation, receiverAddress, amountInBtc, data) {
        try {
            let fundAmount = Number(amountInBtc + this.btcConfig.txFee).toFixed(8);
            const fundTxId = await this.nodeClient.fundAddress(
                senderAddressInformation.address,
                fundAmount
            );
            let fundingTx = await this.getTransaction(fundTxId);

            let outputIndex = -1;
            for (let i = 0; i < fundingTx.outs.length; i++) {
                let outputAddress = this.getOutputAddress(fundingTx.outs[i].script);
                if (outputAddress == senderAddressInformation.address) {
                    outputIndex = i;
                }
            }
            if (outputIndex == -1) {
                throw new Error('funding transaction does not contain the funded adress');
            }
            let tx = new bitcoin.Transaction();
            tx.addInput(Buffer.from(fundingTx.getId(), 'hex').reverse(), outputIndex);
            tx.addOutput(
                bitcoin.address.toOutputScript(receiverAddress, this.btcConfig.network),
                this.nodeClient.btcToSatoshis(amountInBtc)
            );

            if (data) {
                data.forEach((dataElement) => {
                    const dataScript = bitcoin.payments.embed({ data: [dataElement] });
                    tx.addOutput(dataScript.output, 0); // OP_RETURN always with 0 value unless you want to burn coins
                });
            }
            
            let prevTxs = [];
            let privateKeys = [senderAddressInformation.privateKey];
            if (senderAddressInformation.info) {
                prevTxs.push({
                    txid: tx.getId(),
                    vout: outputIndex,
                    scriptPubKey: fundingTx.outs[outputIndex].script.toString('hex'),
                    redeemScript: senderAddressInformation.info.redeemScript,
                    amount: amountInBtc
                });
                privateKeys = senderAddressInformation.info.members.map(a => a.privateKey);
            }

            let signedTx = await this.nodeClient.signTransaction(tx.toHex(), prevTxs, privateKeys);
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
