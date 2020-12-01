const BtcTransactionHelper = require('../index').BtcTransactionHelper;
const network = require('../index').networks.regtest;

(async() => {
    let config = {
        host: 'localhost',
        port: 18332,
        user: 'rsk',
        pass: 'rsk',
        timeout: 30000,
        network: network
    };
    let btcTransactionHelper = new BtcTransactionHelper(config);
    
    console.log('Executing some random rpc commands');

    let blockHash = (await btcTransactionHelper.nodeClient.mine(1))[0];
    console.log('hash', blockHash);

    let blockHeight = await btcTransactionHelper.nodeClient.getBlockCount();
    console.log('height', blockHeight);

    let block = await btcTransactionHelper.nodeClient.getBlock(blockHash, false);
    console.log('raw block', block);

    let walletInfo = await btcTransactionHelper.nodeClient.execute('getwalletinfo');
    console.log('walletInfo', walletInfo);
})();
