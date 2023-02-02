const BtcTransactionHelper = require('../index').BtcTransactionHelper;
const network = require('../index').networks.regtest;
const bitcoinJsLib = require('bitcoinjs-lib');
const config = require('./config');

(async() => {
    
    const { address } = bitcoinJsLib.payments.p2pkh({ pubkey: bitcoinJsLib.ECPair.makeRandom().publicKey, network });

    const btcTransactionHelper = new BtcTransactionHelper(config);

    const AMOUNT = 5;

    await btcTransactionHelper.nodeClient.fundAddress(address, AMOUNT);

    await btcTransactionHelper.nodeClient.mine(1);

    const beforeImportAddressBalance = await btcTransactionHelper.getAddressBalance(address);

    console.log('Unimported address balance should show as 0: ', beforeImportAddressBalance);

    await btcTransactionHelper.importAddress(address, 'fed1');

    const afterImportAddressBalance = await btcTransactionHelper.getAddressBalance(address);

    console.log(`Imported address balance should show as ${AMOUNT} now: `, afterImportAddressBalance);

})();
