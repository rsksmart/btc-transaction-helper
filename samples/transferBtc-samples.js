const BtcTransactionHelper = require('../index').BtcTransactionHelper;
const config = require('./config');

const printP2PKHTransferHash = async () => {

    console.log('- P2PKH');
    const transferAmountInBtc = 1;

    const btcTransactionHelper = new BtcTransactionHelper(config);
    const sender = await btcTransactionHelper.generateBtcAddress('legacy');
    const recipient = await btcTransactionHelper.generateBtcAddress('legacy');

    await btcTransactionHelper.fundAddress(sender.address, transferAmountInBtc);
    await btcTransactionHelper.mine(1);

    const outputs = [{recipientAddress: recipient.address, amountInBtc: transferAmountInBtc}];

    const txHash = await btcTransactionHelper.transferBtc(sender, outputs);
    console.log('txHash: ', txHash);

    await btcTransactionHelper.mine(1);

    const recipientBalance = await btcTransactionHelper.getAddressBalance(recipient.address);
    console.log('recipientBalance: ', recipientBalance); // 1

};

const printP2PKHTransferHashWithDecimalAmountInBtc = async () => {

    console.log('- P2PKH');
    const transferAmountInBtc = 0.0531;

    const btcTransactionHelper = new BtcTransactionHelper(config);
    const sender = await btcTransactionHelper.generateBtcAddress('legacy');
    const recipient = await btcTransactionHelper.generateBtcAddress('legacy');

    await btcTransactionHelper.fundAddress(sender.address, transferAmountInBtc);
    await btcTransactionHelper.mine(1);

    const outputs = [{recipientAddress: recipient.address, amountInBtc: transferAmountInBtc}];

    const txHash = await btcTransactionHelper.transferBtc(sender, outputs);
    console.log('txHash: ', txHash);

    await btcTransactionHelper.mine(1);

    const recipientBalance = await btcTransactionHelper.getAddressBalance(recipient.address);
    console.log('recipientBalance: ', recipientBalance); // 0.0531

};

const printP2SHP2WPKHTransferHash = async () => {

    console.log('- P2SH-P2WPKH');
    const transferAmountInBtc = 2;

    const btcTransactionHelper = new BtcTransactionHelper(config);
    const sender = await btcTransactionHelper.generateBtcAddress('p2sh-segwit');
    const recipient = await btcTransactionHelper.generateBtcAddress('p2sh-segwit');

    await btcTransactionHelper.fundAddress(sender.address, transferAmountInBtc);
    await btcTransactionHelper.mine(1);

    const outputs = [{recipientAddress: recipient.address, amountInBtc: transferAmountInBtc}];

    const txHash = await btcTransactionHelper.transferBtc(sender, outputs);
    console.log('txHash: ', txHash);

    await btcTransactionHelper.mine(1);

    const recipientBalance = await btcTransactionHelper.getAddressBalance(recipient.address);
    console.log('recipientBalance: ', recipientBalance); // 2

};

const printP2SHMULTISIGTransferHash = async () => {

    console.log('- P2SH-MULTISIG');
    const transferAmountInBtc = 3;

    const btcTransactionHelper = new BtcTransactionHelper(config);
    const sender = await btcTransactionHelper.generateMultisigAddress(3, 2, 'legacy');
    const recipient = await btcTransactionHelper.generateBtcAddress('legacy');

    await btcTransactionHelper.fundAddress(sender.address, transferAmountInBtc);
    await btcTransactionHelper.mine(1);

    const outputs = [{recipientAddress: recipient.address, amountInBtc: transferAmountInBtc}];

    const txHash = await btcTransactionHelper.transferBtc(sender, outputs);
    console.log('txHash: ', txHash);

    await btcTransactionHelper.mine(1);

    const recipientBalance = await btcTransactionHelper.getAddressBalance(recipient.address);
    console.log('recipientBalance: ', recipientBalance); // 3
};

const printP2SHP2WSHTransferHash = async () => {

    console.log('- P2SH-P2WSH');
    const transferAmountInBtc = 4;

    const btcTransactionHelper = new BtcTransactionHelper(config);
    const sender = await btcTransactionHelper.generateMultisigAddress(3, 2, 'p2sh-segwit');
    const recipient = await btcTransactionHelper.generateBtcAddress('legacy');

    await btcTransactionHelper.fundAddress(sender.address, transferAmountInBtc);
    await btcTransactionHelper.mine(1);

    const outputs = [{recipientAddress: recipient.address, amountInBtc: transferAmountInBtc}];

    const txHash = await btcTransactionHelper.transferBtc(sender, outputs);
    console.log('txHash: ', txHash);

    await btcTransactionHelper.mine(1);

    const recipientBalance = await btcTransactionHelper.getAddressBalance(recipient.address);
    console.log('recipientBalance: ', recipientBalance); // 4

};

const printP2PKHWithDataTransferHash = async () => {

    console.log('- P2PKH with data');
    const transferAmountInBtc = 5;

    const btcTransactionHelper = new BtcTransactionHelper(config);
    const sender = await btcTransactionHelper.generateBtcAddress('legacy');
    const recipient = await btcTransactionHelper.generateBtcAddress('legacy');
    const data = [];
    data[0] = Buffer.from('52534b54010e537aad84447a2c2a7590d5f2665ef5cf9b667a014f4c767a2d308eebb3f0f1247f9163c896e0b7d2', 'hex');
    data[1] = Buffer.from('52534b540172c57eaedb70e707b608b1d51a38d91318685426', 'hex');

    await btcTransactionHelper.fundAddress(sender.address, transferAmountInBtc);
    await btcTransactionHelper.mine(1);

    const outputs = [{recipientAddress: recipient.address, amountInBtc: transferAmountInBtc}];

    const txHash = await btcTransactionHelper.transferBtc(sender, outputs, data);
    console.log('txHash: ', txHash);

    await btcTransactionHelper.mine(1);

    const recipientBalance = await btcTransactionHelper.getAddressBalance(recipient.address);
    console.log('recipientBalance: ', recipientBalance); // 5

};

const printP2PKHTransferHashMultipleOutputs = async () => {

    console.log('- P2PKH multiple outputs');
    const transferAmountInBtcToRecipient1 = 3;
    const transferAmountInBtcToRecipient2 = 5;

    const btcTransactionHelper = new BtcTransactionHelper(config);
    const sender = await btcTransactionHelper.generateBtcAddress('legacy');
    const recipient1 = await btcTransactionHelper.generateBtcAddress('legacy');
    const recipient2 = await btcTransactionHelper.generateBtcAddress('legacy');

    await btcTransactionHelper.fundAddress(sender.address, transferAmountInBtcToRecipient1 + transferAmountInBtcToRecipient2);
    await btcTransactionHelper.mine(1);

    const outputs = [
        {recipientAddress: recipient1.address, amountInBtc: transferAmountInBtcToRecipient1},
        {recipientAddress: recipient2.address, amountInBtc: transferAmountInBtcToRecipient2}
    ];

    const txHash = await btcTransactionHelper.transferBtc(sender, outputs);
    console.log('txHash: ', txHash);

    await btcTransactionHelper.mine(1);

    const recipient1Balance = await btcTransactionHelper.getAddressBalance(recipient1.address);
    console.log('recipient1Balance: ', recipient1Balance); // 3

    const recipient2Balance = await btcTransactionHelper.getAddressBalance(recipient2.address);
    console.log('recipient2Balance: ', recipient2Balance); // 5

};

const printP2PKHTransferHashMultipleOutputsToSameRecipient = async () => {

    console.log('- P2PKH multiple outputs');
    const transferAmountInBtcToRecipient1 = 3;
    const transferAmountInBtcToRecipient2 = 5;

    const btcTransactionHelper = new BtcTransactionHelper(config);
    const sender = await btcTransactionHelper.generateBtcAddress('legacy');
    const recipient = await btcTransactionHelper.generateBtcAddress('legacy');

    await btcTransactionHelper.fundAddress(sender.address, transferAmountInBtcToRecipient1 + transferAmountInBtcToRecipient2);
    await btcTransactionHelper.mine(1);

    const outputs = [
        {recipientAddress: recipient.address, amountInBtc: transferAmountInBtcToRecipient1},
        {recipientAddress: recipient.address, amountInBtc: transferAmountInBtcToRecipient2}
    ];

    const txHash = await btcTransactionHelper.transferBtc(sender, outputs);
    console.log('txHash: ', txHash);

    await btcTransactionHelper.mine(1);

    const recipient1Balance = await btcTransactionHelper.getAddressBalance(recipient.address);
    console.log('recipient1Balance: ', recipient1Balance); // 8

};

const printP2PKHTransferHashThrowsAnErrorWhenSenderHasInsufficientBalance = async () => {

    console.log('- P2PKH');
    const fundAmountInBtc = 1;
    const transferAmountInBtc = 2;

    const btcTransactionHelper = new BtcTransactionHelper(config);
    const sender = await btcTransactionHelper.generateBtcAddress('legacy');
    const recipient = await btcTransactionHelper.generateBtcAddress('legacy');

    await btcTransactionHelper.fundAddress(sender.address, fundAmountInBtc);
    await btcTransactionHelper.mine(1);

    const outputs = [{recipientAddress: recipient.address, amountInBtc: transferAmountInBtc}];

    try {
        await btcTransactionHelper.transferBtc(sender, outputs);
    } catch(err) {
        console.log('Has not enough balance error message: ', err.stack.toString().includes('The sender does not have enough balance to proceed with the transfer'));
    }

};

const printP2PKHTransferHashWith0Change = async () => {

    console.log('- P2PKH');
    const transferAmountInBtc = 1;

    const btcTransactionHelper = new BtcTransactionHelper(config);
    const sender = await btcTransactionHelper.generateBtcAddress('legacy');
    const recipient = await btcTransactionHelper.generateBtcAddress('legacy');

    await btcTransactionHelper.fundAddress(sender.address, transferAmountInBtc);
    await btcTransactionHelper.mine(1);

    const outputs = [{recipientAddress: recipient.address, amountInBtc: transferAmountInBtc}];

    const txHash = await btcTransactionHelper.transferBtc(sender, outputs);
    console.log('txHash: ', txHash);

    await btcTransactionHelper.mine(1);

    const recipientBalance = await btcTransactionHelper.getAddressBalance(recipient.address);
    console.log('recipientBalance: ', recipientBalance); // 1

    const senderBalance = await btcTransactionHelper.getAddressBalance(sender.address);
    console.log('senderBalance: ', senderBalance); // 0

};

const printP2PKHTransferHashWithChange = async () => {

    console.log('- P2PKH');
    const fundAmountInBtc = 3;
    const transferAmountInBtc = 1;

    const btcTransactionHelper = new BtcTransactionHelper(config);
    const sender = await btcTransactionHelper.generateBtcAddress('legacy');
    const recipient = await btcTransactionHelper.generateBtcAddress('legacy');

    await btcTransactionHelper.fundAddress(sender.address, fundAmountInBtc);
    await btcTransactionHelper.mine(1);

    const outputs = [{recipientAddress: recipient.address, amountInBtc: transferAmountInBtc}];

    const txHash = await btcTransactionHelper.transferBtc(sender, outputs);
    console.log('txHash: ', txHash);

    await btcTransactionHelper.mine(1);

    const recipientBalance = await btcTransactionHelper.getAddressBalance(recipient.address);
    console.log('recipientBalance: ', recipientBalance); // 1

    const senderBalance = await btcTransactionHelper.getAddressBalance(sender.address);
    console.log('senderBalance: ', senderBalance); // 2

};

const printP2PKHTransferHashWithNotEnoughForFees = async () => {

    console.log('- P2PKH');
    const transferAmountInBtc = 1;

    const btcTransactionHelper = new BtcTransactionHelper(config);
    const sender = await btcTransactionHelper.generateBtcAddress('legacy');
    const recipient = await btcTransactionHelper.generateBtcAddress('legacy');

    await btcTransactionHelper.fundAddress(sender.address, transferAmountInBtc, false);
    await btcTransactionHelper.mine(1);

    const outputs = [{recipientAddress: recipient.address, amountInBtc: transferAmountInBtc}];

    try {
        await btcTransactionHelper.transferBtc(sender, outputs);
    } catch(err) {
        console.log('Has min relay fee not met error message: ', err.stack.toString().includes('min relay fee not met'));
    }

};

(async() => {
    await printP2PKHTransferHash();
    await printP2PKHTransferHashWithDecimalAmountInBtc();
    await printP2SHP2WPKHTransferHash();
    await printP2SHMULTISIGTransferHash();
    await printP2SHP2WSHTransferHash();
    await printP2PKHWithDataTransferHash();
    await printP2PKHTransferHashMultipleOutputs();
    await printP2PKHTransferHashMultipleOutputsToSameRecipient();
    await printP2PKHTransferHashThrowsAnErrorWhenSenderHasInsufficientBalance();
    await printP2PKHTransferHashWith0Change();
    await printP2PKHTransferHashWithChange();
    await printP2PKHTransferHashWithNotEnoughForFees();
})();
