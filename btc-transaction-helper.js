"use strict";
const BtcHelperException = require('./btc-transaction-helper-error');
const bitcoin = require('peglib').bitcoin;

const DEFAULT_BTC_CONFIG = {
    host: 'localhost',
    port: '18332',
    user: undefined,
    password: undefined,
    network: 'testnet',
    txFee: 0.001
};

class BtcTransactionHelper{
    constructor(btcConfig){
        this.btcConfig = Object.assign({}, DEFAULT_BTC_CONFIG, btcConfig);
        this.createBtcClient();
    }

    createBtcClient(){
        try {
            this.btcClient = bitcoin.getClient(this.btcConfig.host + ':' + this.btcConfig.port, this.btcConfig.user, this.btcConfig.password, bitcoin.networks[this.btcConfig.network]);
        } 
        catch (err) {
            throw new BtcHelperException('Error creating BTC client', err);
        }
    }

    async generateBtcAddress(type){
        try {
            type = type || 'legacy';
            const btcAddress = await this.btcClient.generateNewAddress();
            const btcPrivateKey = await this.btcClient.getPrivateKey(btcAddress);
            
            return {
                btcAddress: btcAddress,
                btcPrivateKey: btcPrivateKey
            }
        }
        catch (err) {
            throw new BtcHelperException('Error creating BTC address', err);
        }
    }

    async generateMultisigAddress(signerSize, requiredSigners){
        try {
            return await this.btcClient.generateMultisigAddress(signerSize, requiredSigners);
        }
        catch (err) {
            throw new BtcHelperException('Error creating multisig BTC address', err);
        }
    }

    async lock(senderAddress, receiverAddress, amountToLockInBtc){
        try {
            const INITIAL_BTC_BALANCE = bitcoin.btcToSatoshis(amountToLockInBtc + this.btcConfig.txFee);
            const BTC_TO_LOCK = bitcoin.btcToSatoshis(amountToLockInBtc);

            const fundTxId = await this.btcClient.sendToAddress(senderAddress, INITIAL_BTC_BALANCE);
            const fundTx = await this.btcClient.getTransaction(fundTxId);

            const txData = {};
            txData[receiverAddress] = BTC_TO_LOCK;
            let txhash = await this.btcClient.sendFromTo(senderAddress, txData, 999, 0, fundTx);

            return txhash;
        }
        catch(err) {
            throw new BtcHelperException('Error during lock process', err);
        }
    }

    async lockMultisig(senderAddress, receiverAddress, amountToLockInBtc){
        try {
            const INITIAL_BTC_BALANCE = bitcoin.btcToSatoshis(amountToLockInBtc + this.btcConfig.txFee);
            const BTC_TO_LOCK = bitcoin.btcToSatoshis(amountToLockInBtc);

            const addresses = senderAddress;
        
            const fundTxId = await this.btcClient.sendToAddress(senderAddress.btc, INITIAL_BTC_BALANCE);
            const fundTx = await this.btcClient.getTransaction(fundTxId);

            const txData = {};
            txData[receiverAddress] = BTC_TO_LOCK;
            await this.btcClient.sendFromMultisigTo(addresses, txData, 999, 0, fundTx);
        }
        catch(err) {
            throw new BtcHelperException('Error during lock process', err);
        }
    }
}

module.exports = BtcTransactionHelper;
