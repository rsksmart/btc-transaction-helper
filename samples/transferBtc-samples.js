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
})();
