const BtcTransactionHelper = require('../index').BtcTransactionHelper;
const config = require('./config');

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

})();
