const { assert, expect } = require('chai');
const chai = require('chai');
const chaiAsPromise = require('chai-as-promised');
const sinon = require('sinon');
const bitcoinjs = require('bitcoinjs-lib');
const BtcNodeHelper = require('../btc-node-helper/index');
const config = require('../samples/config');

chai.use(chaiAsPromise);

const NETWORK = bitcoinjs.networks.regtest;

describe('BtcNodeHelper', () => {

    it('should generate a legacy address with its private key locally', async () => {

        const nodeHelper = new BtcNodeHelper(config);
        const result = await nodeHelper.generateAddressInformation('legacy');

        const keyPair = bitcoinjs.ECPair.fromWIF(result.privateKey, NETWORK);
        const expectedAddress = bitcoinjs.payments.p2pkh({ pubkey: keyPair.publicKey, network: NETWORK }).address;

        assert.equal(result.address, expectedAddress);

    });

    it('should generate a legacy address by default', async () => {

        const nodeHelper = new BtcNodeHelper(config);
        const result = await nodeHelper.generateAddressInformation();

        const keyPair = bitcoinjs.ECPair.fromWIF(result.privateKey, NETWORK);
        const expectedAddress = bitcoinjs.payments.p2pkh({ pubkey: keyPair.publicKey, network: NETWORK }).address;

        assert.equal(result.address, expectedAddress);

    });

    it('should generate a p2sh-segwit address with its private key locally', async () => {

        const nodeHelper = new BtcNodeHelper(config);
        const result = await nodeHelper.generateAddressInformation('p2sh-segwit');

        const keyPair = bitcoinjs.ECPair.fromWIF(result.privateKey, NETWORK);
        const expectedAddress = bitcoinjs.payments.p2sh({
            redeem: bitcoinjs.payments.p2wpkh({ pubkey: keyPair.publicKey, network: NETWORK }),
            network: NETWORK
        }).address;

        assert.equal(result.address, expectedAddress);

    });

    it('should generate a bech32 address with its private key locally', async () => {

        const nodeHelper = new BtcNodeHelper(config);
        const result = await nodeHelper.generateAddressInformation('bech32');

        const keyPair = bitcoinjs.ECPair.fromWIF(result.privateKey, NETWORK);
        const expectedAddress = bitcoinjs.payments.p2wpkh({ pubkey: keyPair.publicKey, network: NETWORK }).address;

        assert.equal(result.address, expectedAddress);

    });

    it('should fail to generate an address of an unsupported type', async () => {

        const nodeHelper = new BtcNodeHelper(config);

        await expect(nodeHelper.generateAddressInformation('taproot')).to.eventually.be.rejectedWith(Error, 'Unsupported address type: taproot');

    });

    it('should generate multisig address information using createmultisig', async () => {

        const nodeHelper = new BtcNodeHelper(config);
        const multisigResult = {
            address: '2N7pXoMCZjvbCJmo51t9WDrR7gR6k9VjZod',
            redeemScript: '522103ebff0e5dc444e25c72d199e3f2ba22bfef8124bb7a00ba813d691300be2d6c4521031e35f8641a77b5388e3deb31ae6321059231c3bda238405e0d3667668ff8cb8d52ae'
        };
        const executeStub = sinon.stub(nodeHelper, 'execute').resolves(multisigResult);

        const result = await nodeHelper.generateMultisigAddressInformation(3, 2, 'legacy');

        assert.equal(result.address, multisigResult.address);
        assert.equal(result.info.redeemScript, multisigResult.redeemScript);
        assert.lengthOf(result.info.members, 3);

        assert.isTrue(executeStub.calledOnce);
        const [command, args] = executeStub.args[0];
        assert.equal(command, 'createmultisig');
        assert.equal(args[0], 2);
        assert.equal(args[2], 'legacy');

        // The public keys sent to the node have to correspond to the members private keys, in order
        const expectedPublicKeys = result.info.members.map(member =>
            bitcoinjs.ECPair.fromWIF(member.privateKey, NETWORK).publicKey.toString('hex')
        );
        assert.deepEqual(args[1], expectedPublicKeys);

        executeStub.restore();

    });

    it('should fail to generate multisig address information when signer size is smaller than required signers', async () => {

        const nodeHelper = new BtcNodeHelper(config);

        await expect(nodeHelper.generateMultisigAddressInformation(2, 3)).to.eventually.be.rejectedWith(Error, 'Total amount of signers can not be smaller than signers amount');

    });

    it('should mine using generatetoaddress with a wallet address', async () => {

        const nodeHelper = new BtcNodeHelper(config);
        const rewardAddress = 'mxd5o5xQc6Qvo956mHGkVX9ZvAfoNNh9Ec';
        const blockHashes = ['0550fcfa26839e7b5defdef60cf19e1b3b25324c6998ac66a9a2ddc72b8f34e8'];

        const getNewAddressStub = sinon.stub(nodeHelper.client, 'getNewAddress').callsFake(callback => callback(null, rewardAddress));
        const executeStub = sinon.stub(nodeHelper, 'execute').resolves(blockHashes);

        const result = await nodeHelper.mine(1);

        assert.equal(result, blockHashes);
        assert.isTrue(executeStub.calledWith('generatetoaddress', [1, rewardAddress]));

        // The reward address is cached, mining again should not request a new address
        await nodeHelper.mine(2);
        assert.isTrue(getNewAddressStub.calledOnce);
        assert.isTrue(executeStub.calledWith('generatetoaddress', [2, rewardAddress]));

        getNewAddressStub.restore();
        executeStub.restore();

    });

    it('should get utxos scanning the utxo set', async () => {

        const nodeHelper = new BtcNodeHelper(config);
        const address = 'mxd5o5xQc6Qvo956mHGkVX9ZvAfoNNh9Ec';
        const unspents = [
            {
                txid: '74f7e8c0263be8b23b3deffbaf9ee74239076a0de57c695aef4669e22bee0d01',
                vout: 0,
                scriptPubKey: '76a91481a2a37f24c2d7af1382cfe3f5bfa570705efc3288ac',
                desc: `addr(${address})#checksum`,
                amount: 1.5,
                height: 100
            }
        ];
        const executeStub = sinon.stub(nodeHelper, 'execute').resolves({
            success: true,
            unspents,
            total_amount: 1.5
        });

        const result = await nodeHelper.getUtxos(address);

        assert.isTrue(executeStub.calledWith('scantxoutset', ['start', [`addr(${address})`]]));
        assert.lengthOf(result, 1);
        assert.equal(result[0].txid, unspents[0].txid);
        assert.equal(result[0].vout, unspents[0].vout);
        assert.equal(result[0].scriptPubKey, unspents[0].scriptPubKey);
        assert.equal(result[0].amount, unspents[0].amount);
        assert.equal(result[0].address, address);

        executeStub.restore();

    });

});
