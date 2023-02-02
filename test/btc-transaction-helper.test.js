const { assert } = require('chai');
const BtcTransactionHelper = require('../index').BtcTransactionHelper;
const network = require('../index').networks.regtest;
const bitcoinJsLib = require('bitcoinjs-lib')

const config = {
    host: 'localhost',
    port: 18332,
    user: 'rsk',
    pass: 'rsk',
    timeout: 30000,
    network: network
};

describe('btc-transaction-helper', () => {

    // This is an integration test. bitcoind should be running before running this test.
    it('should import address, receive and show funds', async () => {

        const { address } = bitcoinJsLib.payments.p2pkh({ pubkey: bitcoinJsLib.ECPair.makeRandom().publicKey, network });

        const btcTransactionHelper = new BtcTransactionHelper(config);

        const AMOUNT = 5;

        await btcTransactionHelper.nodeClient.fundAddress(address, AMOUNT);

        await btcTransactionHelper.nodeClient.mine(1);

        const balance1 = await btcTransactionHelper.getAddressBalance(address);

        assert.equal(balance1, 0, 'Unimported address balance should be 0');

        await btcTransactionHelper.importAddress(address, 'fed1');

        const balance2 = await btcTransactionHelper.getAddressBalance(address);

        assert.equal(balance2, AMOUNT, `Imported address balance should be ${AMOUNT}`);

    });

});
