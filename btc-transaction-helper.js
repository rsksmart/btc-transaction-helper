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
        this.createBtcClient();
    }

    createBtcClient() {
        try {
            this.btcClient = new BtcNodeHelper(this.btcConfig);
        } 
        catch (err) {
            throw new BtcHelperException('Error creating BTC client', err);
        }
    }

    generateBtcAddress(type) {
        try {
            type = type || 'legacy';
            return this.btcClient.generateAddressInformation(type);
        }
        catch (err) {
            throw new BtcHelperException('Error creating BTC address', err);
        }
    }

    generateMultisigAddress(signerSize, requiredSigners, type) {
        try {
            return this.btcClient.generateMultisigAddressInformation(signerSize, requiredSigners, type);
        }
        catch (err) {
            throw new BtcHelperException('Error creating multisig BTC address', err);
        }
    }

    async transferBtc(senderAddressInformation, receiverAddress, amountInBtc, data) {
        try {
            const fundTxId = await this.btcClient.fundAddress(
                senderAddressInformation.address,
                amountInBtc + this.btcConfig.txFee
            );
            let fundingTx = bitcoin.Transaction.fromHex(await this.btcClient.getRawTransaction(fundTxId));

            let outputIndex = -1;
            for (let i = 0; i < fundingTx.outs.length; i++) {
                let outputAddress = bitcoin.address.fromOutputScript(fundingTx.outs[i].script, this.btcConfig.network);
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
                this.btcClient.btcToSatoshis(amountInBtc)
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

            let signedTx = await this.btcClient.signTransaction(tx.toHex(), prevTxs, privateKeys);
            return this.btcClient.sendTransaction(signedTx);
        }
        catch(err) {
            throw new BtcHelperException('Error during transfer process', err);
        }
    }

    async getAddressBalance(address) {
        let utxos = await this.btcClient.getUtxos(address);
        return utxos.reduce((sum, utxo) => sum + utxo.amount, 0);
    }
}

module.exports = BtcTransactionHelper;
