const BtcTransactionHelper = require('../index').BtcTransactionHelper;
const config = require('./config');
const util = require('util');

(async() => {

    const btcTransactionHelper = new BtcTransactionHelper(config);
    
    console.log('Executing some random rpc commands');

    const blockHash = (await btcTransactionHelper.nodeClient.mine(1))[0];
    console.log('hash', blockHash);

    const blockHeight = await btcTransactionHelper.nodeClient.getBlockCount();
    console.log('height', blockHeight);

    const block = await btcTransactionHelper.nodeClient.getBlock(blockHash, false);
    console.log('raw block', block);

    const walletInfo = await btcTransactionHelper.nodeClient.execute('getwalletinfo');
    console.log('walletInfo', walletInfo);

    const rawTransaction = "01000000000101fba1b9ea3572f1de7f63c189c36b64efdc239e8a5dfd500a98aeedb8f0d63ca401000000171600141e93aee23f2124952b8d2f3ebd4315cf819c83abffffffff0180f0fa020000000017a9140ef57d5efdba032566454c3c01635f9f583980a2870247304402204da52ce34b8f0d62e7a18766fc4e47d58346e57d5afa32b686265718f46c630102201bf3ccf02aaa2e95997a8e8191087a8032748ab0bcd3043a3def592d6bf2013b0121023797ce0ac88058176f1802b3f6a3eef0fa489fe49323990726d43bf666c365b900000000";
    const btcTransaction = await btcTransactionHelper.parseRawTransaction(rawTransaction);
    const prettyJsonResult = util.inspect(btcTransaction, {depth: null, colors: true});
    console.log('Parsed btc transaction', prettyJsonResult);

})();
