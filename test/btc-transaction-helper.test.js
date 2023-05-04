const chai = require('chai');
const { assert, expect } = require('chai');
const BtcTransactionHelper = require('../btc-transaction-helper');
const config = require('../samples/config');
const sinon = require('sinon');
const chaiAsPromise = require('chai-as-promised');
chai.use(chaiAsPromise);

const TEST_BTC_ADDRESS = 'mxd5o5xQc6Qvo956mHGkVX9ZvAfoNNh9Ec';
const PRIVATE_KEY = 'cRDAG3moz46jcmTb4AP1jnGCzYy8kkfexQVzTMBQcswr8DKEzCz4';
const LEGACY = 'legacy';
const ADDRESS_INFORMATION = {
    address: TEST_BTC_ADDRESS,
    privateKey: PRIVATE_KEY
};

const MULTISIG_ADDRESS_INFORMATION = {
    address: '2N7pXoMCZjvbCJmo51t9WDrR7gR6k9VjZod',
    info: {
      members: [
        {
          address: 'mt3rLTFHEW9YwSoUFcQFK8FzvEZhtyxSpx',
          privateKey: 'cPXuhqdZVBpCfsvFM55hEpqTkmUi3K6GpPKREboHjhfh5MGRMmqp'
        },
        {
          address: 'mpvR1XSmGW11WBwNYDmGZVbWFMEVRoCkAb',
          privateKey: 'cTVq2Kg2PYEBTEb9ppVSwJ1P8xd8Uo5mancEX3FG9o4i727dthKu'
        }
      ],
      redeemScript: '522103ebff0e5dc444e25c72d199e3f2ba22bfef8124bb7a00ba813d691300be2d6c4521031e35f8641a77b5388e3deb31ae6321059231c3bda238405e0d3667668ff8cb8d52ae'
    }
};

const utxos = [
    {
        amount: 1000,
    },
    {
        amount: 2000,
    },
    {
        amount: 3000,
    }
];

describe('BtcTransactionHelper', () => {

    it('should import address', async () => {

        const btcTransactionHelper = new BtcTransactionHelper(config);
        const nodeClient = btcTransactionHelper.nodeClient;
        const importAddressStub = sinon.stub(nodeClient, 'execute').resolves(null);
        const result = await btcTransactionHelper.importAddress(TEST_BTC_ADDRESS, 'label');

        assert.isNull(result);
        assert.isTrue(importAddressStub.calledOnce);
        assert.isFalse(importAddressStub.calledWith(TEST_BTC_ADDRESS, 'label'));

        importAddressStub.restore();
        
    });

    it('should generate address information', async () => {

        const btcTransactionHelper = new BtcTransactionHelper(config);
        const nodeClient = btcTransactionHelper.nodeClient;
        const generateAddressInformationStub = sinon.stub(nodeClient, 'generateAddressInformation').resolves(ADDRESS_INFORMATION);
        const result = await btcTransactionHelper.generateBtcAddress(LEGACY);

        assert.equal(result, ADDRESS_INFORMATION);

        generateAddressInformationStub.restore();

    });

    it('should generate multisig address information', async () => {
            
        const btcTransactionHelper = new BtcTransactionHelper(config);
        const nodeClient = btcTransactionHelper.nodeClient;
        const generateMultisigAddressInformationStub = sinon.stub(nodeClient, 'generateMultisigAddressInformation').resolves(MULTISIG_ADDRESS_INFORMATION);
        const result = await btcTransactionHelper.generateMultisigAddress(2, 2, LEGACY);

        assert.equal(result, MULTISIG_ADDRESS_INFORMATION);

        generateMultisigAddressInformationStub.restore();
    
    });

    it('should select spendable utxos from address with 1000 satoshis change', async () => {

        const btcTransactionHelper = new BtcTransactionHelper(config);
        const getUtxosStub = sinon.stub(btcTransactionHelper, 'getUtxos').resolves(utxos);
        const result = await btcTransactionHelper.selectSpendableUTXOsFromAddress(TEST_BTC_ADDRESS, 2000);

        assert.equal(result.utxos.length, 2);
        assert.equal(result.utxos[0].amount, 1000);
        assert.equal(result.utxos[1].amount, 2000);
        assert.equal(result.change, 1000);

        getUtxosStub.restore();

    });

    it('should select spendable utxos from address with no change', async () => {

        const btcTransactionHelper = new BtcTransactionHelper(config);
        const getUtxosStub = sinon.stub(btcTransactionHelper, 'getUtxos').resolves(utxos);
        const result = await btcTransactionHelper.selectSpendableUTXOsFromAddress(TEST_BTC_ADDRESS, 1000);

        assert.equal(result.utxos.length, 1);
        assert.equal(result.utxos[0].amount, 1000);
        assert.equal(result.change, 0);

        getUtxosStub.restore();

    });

    it('should fail if account does not have enough funds', async () => {
            
            const btcTransactionHelper = new BtcTransactionHelper(config);
            const getUtxosStub = sinon.stub(btcTransactionHelper, 'getUtxos').resolves(utxos);

            await expect(btcTransactionHelper.selectSpendableUTXOsFromAddress(TEST_BTC_ADDRESS, 8000)).to.eventually.be.rejectedWith(Error, 'The sender does not have enough balance to proceed with the transfer');

            getUtxosStub.restore();
    
    });

});
