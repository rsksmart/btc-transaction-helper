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
    let sender;
    let recipient;
    let data = [];
    
    console.log('- P2PKH');
    sender = await btcTransactionHelper.generateBtcAddress('legacy');
    recipient = await btcTransactionHelper.generateBtcAddress('legacy');

    console.log(await btcTransactionHelper.transferBtc(sender, recipient.address, 1));

    console.log('- P2SH-P2WPKH');
    sender = await btcTransactionHelper.generateBtcAddress('p2sh-segwit');
    recipient = await btcTransactionHelper.generateBtcAddress('p2sh-segwit');

    console.log(await btcTransactionHelper.transferBtc(sender, recipient.address, 1));

    console.log('- P2SH-MULTISIG');
    sender = await btcTransactionHelper.generateMultisigAddress(3, 2, 'legacy');
    recipient = await btcTransactionHelper.generateBtcAddress('legacy');

    console.log(await btcTransactionHelper.transferBtc(sender, recipient.address, 1));

    console.log('- P2SH-P2WSH');
    sender = await btcTransactionHelper.generateMultisigAddress(3, 2, 'p2sh-segwit');
    recipient = await btcTransactionHelper.generateBtcAddress('legacy');

    console.log(await btcTransactionHelper.transferBtc(sender, recipient.address, 1));

    console.log('- P2PKH with data');
    sender = await btcTransactionHelper.generateBtcAddress('legacy');
    recipient = await btcTransactionHelper.generateBtcAddress('legacy');
    data[0] = Buffer.from('52534b54010e537aad84447a2c2a7590d5f2665ef5cf9b667a014f4c767a2d308eebb3f0f1247f9163c896e0b7d2', 'hex');
    data[1] = Buffer.from('52534b540172c57eaedb70e707b608b1d51a38d91318685426', 'hex');

    console.log(await btcTransactionHelper.transferBtc(sender, recipient.address, 1, data));
})();
