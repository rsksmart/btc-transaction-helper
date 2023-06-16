const chai = require('chai');
const { assert, expect } = require('chai');
const BtcTransactionHelper = require('../btc-transaction-helper');
const config = require('../samples/config');
const sinon = require('sinon');
const chaiAsPromise = require('chai-as-promised');
const bitcoin = require('bitcoinjs-lib');
const conversion = require('../conversion');

chai.use(chaiAsPromise);

const TEST_BTC_ADDRESS = 'mxd5o5xQc6Qvo956mHGkVX9ZvAfoNNh9Ec';
const PRIVATE_KEY = 'cRDAG3moz46jcmTb4AP1jnGCzYy8kkfexQVzTMBQcswr8DKEzCz4';
const LEGACY = 'legacy';
const ADDRESS_INFORMATION = {
    address: TEST_BTC_ADDRESS,
    privateKey: PRIVATE_KEY
};

const SAMPLE_BTC_TRANSACTIONS = require("./sample-btc-transactions.json");

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
        const executeImportAddressStub = sinon.stub(nodeClient, 'execute').resolves(null);
        const result = await btcTransactionHelper.importAddress(TEST_BTC_ADDRESS, 'label');

        assert.isNull(result);
        assert.isTrue(executeImportAddressStub.calledOnce);
        assert.isTrue(executeImportAddressStub.calledWith('importaddress', [TEST_BTC_ADDRESS, 'label']));

        executeImportAddressStub.restore();
        
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

    it('should return utxos', async () => {
            
        const btcTransactionHelper = new BtcTransactionHelper(config);
        const nodeClient = btcTransactionHelper.nodeClient;
        const getUtxosStub = sinon.stub(nodeClient, 'getUtxos').resolves(utxos);
        const result = await btcTransactionHelper.getUtxos(TEST_BTC_ADDRESS);

        assert.equal(result, utxos);

        getUtxosStub.restore();
    
    });

    it('should transferBtc', async () => {
                
        const btcTransactionHelper = new BtcTransactionHelper(config);

        const recipientAddress = 'mxAyE9QUS2PoKAsNv7h9bx2aBkvoVA68A4';
        const amountInBtc = 2000;
        const recipientsTransactionInformation = [{recipientAddress, amountInBtc}];

        const utxos = [
            {
                amount: 3000,
                txid: '74f7e8c0263be8b23b3deffbaf9ee74239076a0de57c695aef4669e22bee0d01',
                vout: 0,
                scriptPubKey: '76a91481a2a37f24c2d7af1382cfe3f5bfa570705efc3288ac',
            }
        ];

        const txHex = `0100000001010dee2be26946ef5a697ce50d6a073942e79eaffbef3d3bb2e83b26c0e8f7740000000000ffffffff0200d0ed902e0000001976a914b6b298fc195725922d93f27cd01f7f382627de3b88ac60617548170000001976a914bba2e52eae9579b7605d9988d2ebe5bc306251ad88ac00000000`;
        const signedTxHex = `0100000001010dee2be26946ef5a697ce50d6a073942e79eaffbef3d3bb2e83b26c0e8f774000000006a4730440220433a46156385a556ea42e47aff98f1497040bbcd0f6206d3dfe9dbc9933a8806022026a25a95f330c05cc8f8b4d070b54b99101b6b5367e5a29b468c8c4a387138fb0121027eae337ba08d93410ad95778e3dbe10bfaaefa26448683809f16429072103c7effffffff0100e1f505000000001976a914b6b298fc195725922d93f27cd01f7f382627de3b88ac00000000`;
        const txHash = `0550fcfa26839e7b5defdef60cf19e1b3b25324c6998ac66a9a2ddc72b8f34e8`;

        const getUtxosStub = sinon.stub(btcTransactionHelper, 'getUtxos').resolves(utxos);
        const signRawTransactionStub = sinon.stub(btcTransactionHelper.nodeClient, 'signTransaction').resolves(signedTxHex);
        const sendRawTransactionStub = sinon.stub(btcTransactionHelper.nodeClient, 'sendTransaction').resolves(txHash);

        const result = await btcTransactionHelper.transferBtc(ADDRESS_INFORMATION, recipientsTransactionInformation);

        assert.equal(result, txHash);

        assert.isTrue(getUtxosStub.calledWith(ADDRESS_INFORMATION.address));
        assert.isTrue(signRawTransactionStub.calledWith(txHex, [], [ADDRESS_INFORMATION.privateKey]));
        assert.isTrue(sendRawTransactionStub.calledWith(signedTxHex));

        getUtxosStub.restore();
        signRawTransactionStub.restore();
        sendRawTransactionStub.restore();
        
    });

    it('should transferBtc, multisig', async () => {
                
        const btcTransactionHelper = new BtcTransactionHelper(config);

        const recipientAddress = 'mxAyE9QUS2PoKAsNv7h9bx2aBkvoVA68A4';
        const amountInBtc = 2000;
        const recipientsTransactionInformation = [{recipientAddress, amountInBtc}];
        const redeemScript = '5221039fac837f0c8a3f93fd63a9574677ca86bb60427149ac8c104d0f7da0be0555132103c35665b6940450ec15219634c4a85e8432bf4d89d2de265274b7b70e83d5982a52ae';

        const senderAddressInformation = {
            address: '2MtEkevhQZpdFH4DGHjWm68HYD8hPZgaTeH',
            info: {
              members: [
                {
                  address: 'mzP29BbArPnUuAdr1uFX3ZwbDUiNEkW5HH',
                  privateKey: 'cVGMwpMZEatVCTAz5hr4h56fvSHb2EqnxzHGCmxqXbASkBmGtZLX'
                },
                {
                  address: 'mzYTf3HKxbNWFUodyMqGGc5Az7fsACQoCb',
                  privateKey: 'cRESFZCZZ7tEJPBoKBG53WU5xALnxpDN38s9jDVtkiYdKRuSehcx'
                }
              ],
              redeemScript
            }
        };

        const utxos = [
            {
                amount: 3000,
                txid: 'dcec9f208a62edb700819331aab376c17620e4afad0cda4db2277c5313d3f12d',
                vout: 0,
                scriptPubKey: 'a914f66ff70094b55bdd8e07c21ef4ae4e9860a8f52887',
            }
        ];

        const prevTxs = [
            {
              txid: 'cb8992d27e91e3bef226635c546b8bb423a8eb67d6f8cf56f1246511a37e5e2d',
              vout: 0,
              scriptPubKey: 'a914f66ff70094b55bdd8e07c21ef4ae4e9860a8f52887',
              redeemScript,
              amount: 3000
            }
        ];

        const txHex = `01000000012df1d313537c27b24dda0cadafe42076c176b3aa31938100b7ed628a209fecdc0000000000ffffffff0200d0ed902e0000001976a914b6b298fc195725922d93f27cd01f7f382627de3b88ac606175481700000017a9140ae14f0852fe5c0ddc8b6d288569cc8178d8ad7c8700000000`;
        const signedTxHex = `0100000001804f88711ab22b810318171f43c3bdddc82e4f0e8665ebca7f39986437d023fe00000000d90047304402206c2cf8beda14c077cf56ddc54abfca06ad80315b4b1c7428c1ad922a32a66f9b02200e73c158932f2ac1abe7c347e774fdc8ee2dadc9cd6d5df2ecad6cadd588afc801473044022069769d01863`;
        const txHash = `d6f493316fb648f63c626b10179dbc908090fc2262866f00eee402e99bd82bbb`;

        const getUtxosStub = sinon.stub(btcTransactionHelper, 'getUtxos').resolves(utxos);
        const signRawTransactionStub = sinon.stub(btcTransactionHelper.nodeClient, 'signTransaction').resolves(signedTxHex);
        const sendRawTransactionStub = sinon.stub(btcTransactionHelper.nodeClient, 'sendTransaction').resolves(txHash);

        const result = await btcTransactionHelper.transferBtc(senderAddressInformation, recipientsTransactionInformation);

        assert.equal(result, txHash);

        assert.isTrue(getUtxosStub.calledWith(senderAddressInformation.address));
        assert.isTrue(signRawTransactionStub.calledWith(txHex, prevTxs, [senderAddressInformation.info.members[0].privateKey, senderAddressInformation.info.members[1].privateKey]));
        assert.isTrue(sendRawTransactionStub.calledWith(signedTxHex));

        getUtxosStub.restore();
        signRawTransactionStub.restore();
        sendRawTransactionStub.restore();
        
    });

    it('should transferBtc, with paymentData', async () => {
                
        const btcTransactionHelper = new BtcTransactionHelper(config);

        const recipientAddress = 'mxAyE9QUS2PoKAsNv7h9bx2aBkvoVA68A4';
        const amountInBtc = 2000;
        const recipientsTransactionInformation = [{recipientAddress, amountInBtc}];
        const paymentData = [Buffer.from('52534b5401d2a3d9f938e13cd947ec05abc7fe734df8dd8260', 'hex')];

        const utxos = [
            {
                amount: 3000,
                txid: '74f7e8c0263be8b23b3deffbaf9ee74239076a0de57c695aef4669e22bee0d01',
                vout: 0,
                scriptPubKey: '76a91481a2a37f24c2d7af1382cfe3f5bfa570705efc3288ac',
            }
        ];

        const txHex = `0100000001010dee2be26946ef5a697ce50d6a073942e79eaffbef3d3bb2e83b26c0e8f7740000000000ffffffff0300d0ed902e0000001976a914b6b298fc195725922d93f27cd01f7f382627de3b88ac60617548170000001976a914bba2e52eae9579b7605d9988d2ebe5bc306251ad88ac00000000000000001b6a1952534b5401d2a3d9f938e13cd947ec05abc7fe734df8dd826000000000`;
        const signedTxHex = `0100000001010dee2be26946ef5a697ce50d6a073942e79eaffbef3d3bb2e83b26c0e8f774000000006a4730440220433a46156385a556ea42e47aff98f1497040bbcd0f6206d3dfe9dbc9933a8806022026a25a95f330c05cc8f8b4d070b54b99101b6b5367e5a29b468c8c4a387138fb0121027eae337ba08d93410ad95778e3dbe10bfaaefa26448683809f16429072103c7`;
        const txHash = `0550fcfa26839e7b5defdef60cf19e1b3b25324c6998ac66a9a2ddc72b8f34e8`;

        const getUtxosStub = sinon.stub(btcTransactionHelper, 'getUtxos').resolves(utxos);
        const signRawTransactionStub = sinon.stub(btcTransactionHelper.nodeClient, 'signTransaction').resolves(signedTxHex);
        const sendRawTransactionStub = sinon.stub(btcTransactionHelper.nodeClient, 'sendTransaction').resolves(txHash);

        const result = await btcTransactionHelper.transferBtc(ADDRESS_INFORMATION, recipientsTransactionInformation, paymentData);

        assert.equal(result, txHash);

        assert.isTrue(getUtxosStub.calledWith(ADDRESS_INFORMATION.address));
        assert.isTrue(signRawTransactionStub.calledWith(txHex, [], [ADDRESS_INFORMATION.privateKey]));
        assert.isTrue(sendRawTransactionStub.calledWith(signedTxHex));

        assert.isTrue(signRawTransactionStub.args[0][0].includes(paymentData[0].toString('hex')))

        getUtxosStub.restore();
        signRawTransactionStub.restore();
        sendRawTransactionStub.restore();
        
    });

    it('should get address balance', async () => {
                    
        const btcTransactionHelper = new BtcTransactionHelper(config);

        const getUtxosStub = sinon.stub(btcTransactionHelper, 'getUtxos').resolves(utxos);

        const result = await btcTransactionHelper.getAddressBalance(TEST_BTC_ADDRESS);

        assert.equal(result, 6000);

        assert.isTrue(getUtxosStub.calledWith(TEST_BTC_ADDRESS));

        getUtxosStub.restore();
            
    });

    it('should get transaction', async () => {
                            
        const amountInBtc = 2000;
        const txHash = `0550fcfa26839e7b5defdef60cf19e1b3b25324c6998ac66a9a2ddc72b8f34e8`;

        const utxos = [
            {
                amount: 1000,
                txid: 'a20b03132ec6c1603c79af9a521ae7b287ed61dea39b8eeb61b603f3b0034a3e',
                vout: 0,
                scriptPubKey: 'a914831bf759c1c7424ba8a849e285ff0a6e4f160b3487',
            },
        ];

        const btcTransactionHelper = new BtcTransactionHelper(config);

        const tx = new bitcoin.Transaction();

        tx.addInput(Buffer.from(utxos[0].txid, 'hex').reverse(), utxos[0].vout);

        tx.addOutput(
            bitcoin.address.toOutputScript(ADDRESS_INFORMATION.address, config.network),
            conversion.btcToSatoshis(amountInBtc)
        );

        const getTransactionStub = sinon.stub(btcTransactionHelper.nodeClient, 'getRawTransaction').resolves(tx.toHex());

        const result = await btcTransactionHelper.getTransaction(txHash);

        assert.deepEqual(result, tx);

        assert.isTrue(getTransactionStub.calledWith(txHash));

        getTransactionStub.restore();
                    
    });

    it('should fund address with default mining', async () => {
                                            
        const btcTransactionHelper = new BtcTransactionHelper(config);
        const txHash = `0550fcfa26839e7b5defdef60cf19e1b3b25324c6998ac66a9a2ddc72b8f34e8`;

        const fundAddressStub = sinon.stub(btcTransactionHelper.nodeClient, 'fundAddress').resolves(txHash);
        const mineStub = sinon.stub(btcTransactionHelper, 'mine').resolves();

        const result = await btcTransactionHelper.fundAddress(TEST_BTC_ADDRESS, 2000);

        assert.equal(result, txHash);

        assert.isTrue(fundAddressStub.calledWith(TEST_BTC_ADDRESS, '2000.00000000'));

        assert.isTrue(mineStub.calledOnce);

        fundAddressStub.restore();
                                    
    });

    it('should fund address with explicit mining', async () => {
                                            
        const btcTransactionHelper = new BtcTransactionHelper(config);
        const txHash = `0550fcfa26839e7b5defdef60cf19e1b3b25324c6998ac66a9a2ddc72b8f34e8`;

        const fundAddressStub = sinon.stub(btcTransactionHelper.nodeClient, 'fundAddress').resolves(txHash);
        const mineStub = sinon.stub(btcTransactionHelper, 'mine').resolves();

        const result = await btcTransactionHelper.fundAddress(TEST_BTC_ADDRESS, 2000, true);

        assert.equal(result, txHash);

        assert.isTrue(fundAddressStub.calledWith(TEST_BTC_ADDRESS, '2000.00000000'));

        assert.isTrue(mineStub.calledOnce);

        fundAddressStub.restore();
                                    
    });

    it('should fund address without mining', async () => {
                                            
        const btcTransactionHelper = new BtcTransactionHelper(config);
        const txHash = `0550fcfa26839e7b5defdef60cf19e1b3b25324c6998ac66a9a2ddc72b8f34e8`;

        const fundAddressStub = sinon.stub(btcTransactionHelper.nodeClient, 'fundAddress').resolves(txHash);
        const mineStub = sinon.stub(btcTransactionHelper, 'mine').resolves();

        const result = await btcTransactionHelper.fundAddress(TEST_BTC_ADDRESS, 2000, false);

        assert.equal(result, txHash);

        assert.isTrue(fundAddressStub.calledWith(TEST_BTC_ADDRESS, '2000.00000000'));

        assert.isTrue(mineStub.notCalled);

        fundAddressStub.restore();
                                    
    });

    it('should mine', async () => {
                                                    
        const btcTransactionHelper = new BtcTransactionHelper(config);
        const txHash = `0550fcfa26839e7b5defdef60cf19e1b3b25324c6998ac66a9a2ddc72b8f34e8`;

        const mineStub = sinon.stub(btcTransactionHelper.nodeClient, 'mine').resolves(txHash);

        const result = await btcTransactionHelper.mine(1);

        assert.equal(result, txHash);

        assert.isTrue(mineStub.calledWith(1));

        mineStub.restore();
                                            
    });

    it('should decode base 58 address', async () => {
                                                    
        const btcTransactionHelper = new BtcTransactionHelper(config);

        const result = btcTransactionHelper.decodeBase58Address(TEST_BTC_ADDRESS);

        assert.equal(result, '6fbba2e52eae9579b7605d9988d2ebe5bc306251ad');
    
    });

    it('should parse btc raw transaction', async () => {
        for (let i = 0; i < SAMPLE_BTC_TRANSACTIONS.length; i++) {
            // Arrange
            const btcTransaction = SAMPLE_BTC_TRANSACTIONS[i];
            const btcTransactionHelper = new BtcTransactionHelper(config);
            const parsedBtcTransactionStub = sinon.stub(btcTransactionHelper, 'parseRawTransaction').resolves(btcTransaction.decodedTx);
            // Act
            const result = await btcTransactionHelper.parseRawTransaction(btcTransaction.rawTx);
            // Assert
            assert.isTrue(parsedBtcTransactionStub.calledWith(btcTransaction.rawTx));
            assert.equal(result.txid, btcTransaction.decodedTx.txid);
            assert.equal(result.hash, btcTransaction.decodedTx.hash);
            assert.equal(JSON.stringify(result), JSON.stringify(btcTransaction.decodedTx));

            parsedBtcTransactionStub.restore();
        }
    });

    it('should failed parsing malformed btc raw transaction', async () => {
        // Arrange
        const btcTransactionHelper = new BtcTransactionHelper(config);
        const decodeError = new Error("Error: TX decode failed");
        decodeError.code = -22;
        sinon.stub(btcTransactionHelper, 'parseRawTransaction').throws(decodeError);

        try {
            await btcTransactionHelper.parseRawTransaction("MALFORMED BTC TRANSACTION")
        } catch (err) {
            assert.strictEqual(err.code, decodeError.code);
            assert.strictEqual(err.message, decodeError.message);
        }
    });

});
