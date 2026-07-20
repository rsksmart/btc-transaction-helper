const BtcTransactionHelper = require('../index').BtcTransactionHelper;
const network = require('../index').networks.regtest;
const bitcoinJsLib = require('bitcoinjs-lib');
const config = require('./config');

// Since Bitcoin Core 30 removed the `importaddress` RPC, `importAddress` is a deprecated no-op.
// It is no longer needed: `getAddressBalance`/`getUtxos` scan the UTXO set directly,
// so any address balance is visible without the node wallet tracking it.
(async() => {

    const { address } = bitcoinJsLib.payments.p2pkh({ pubkey: bitcoinJsLib.ECPair.makeRandom().publicKey, network });

    const btcTransactionHelper = new BtcTransactionHelper(config);

    const AMOUNT = 5;

    await btcTransactionHelper.nodeClient.fundAddress(address, AMOUNT);

    await btcTransactionHelper.nodeClient.mine(1);

    const balance = await btcTransactionHelper.getAddressBalance(address);

    console.log(`Address balance should show as ${AMOUNT} without importing the address: `, balance);

})();
