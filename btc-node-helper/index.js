const bitcoin = require('bitcoin');

const promisefy = function(client, f, args) {
    args = args || [];
    return new Promise(function(resolve, reject) {
        var callback = function(error, result) {
            if (error) {
                reject(error);
                return;
            }
            resolve(result);
        }
        var finalArgs = args.concat(callback);
        f.apply(client, finalArgs);
    });
};

module.exports = class BtcNodeHelper {
    constructor(config) {
        this.client = new bitcoin.Client(config);
    }

    async generateAddressInformation(type) {
        let address = await promisefy(this.client, this.client.getNewAddress, [null, type]);
        let privateKey = await promisefy(this.client, this.client.dumpPrivKey, [address]);
        return {
            address,
            privateKey
        };
    }

    async generateMultisigAddressInformation(signerSize, requiredSigners, type) {
        signerSize = signerSize || 3;
        requiredSigners = requiredSigners || 2;
        type = type || 'legacy';
        var addresses = [];
    
        if (signerSize < requiredSigners) {
            throw new Error("Total amount of signers can not be smaller than signers amount");
        }
    
        // Generate addresses that will form the multisig addresses
        for (let i = 1; i <= signerSize; i++) {
            addresses.push(await this.generateAddressInformation(type));
        }
    
        // Create multisg object
        let multisig = await promisefy(
            this.client, 
            this.client.addMultiSigAddress, [requiredSigners, addresses.map(a => a.address), null, type]
        );
        
        return {
            address: multisig.address, 
            info: {
                members: addresses,
                redeemScript: multisig.redeemScript
            }
        };
    }
    
    fundAddress(address, amount) {
        return promisefy(this.client, this.client.sendToAddress, [address, amount]);
    }
    
    getRawTransaction(txId) {
        return promisefy(this.client, this.client.getRawTransaction, [txId, false]);
    }

    async signTransaction(unsignedTransaction, previousTransactions, privateKeys) {
        let signedTxResult = await promisefy(
            this.client, 
            this.client.cmd, 
            ['signrawtransactionwithkey', unsignedTransaction, privateKeys, previousTransactions]
        );
        if (!signedTxResult.complete) {
            console.error('failed to sign', signedTxResult.errors);
            throw new Error('failed to sign');
        }
        return signedTxResult.hex;
    }
    
    async sendTransaction(signedTransaction) {
        return promisefy(this.client, this.client.sendRawTransaction, [signedTransaction]);
    }
    
    mine(blocks) {
        return promisefy(this.client, this.client.generate, [blocks]);
    };
    
    getBlock(blockHash) {
        return promisefy(this.client, this.client.getBlock, [blockHash]);
    }

    btcToSatoshis(btc) {
        return parseInt(btc * 1e8);
    }

    satoshisToBtc(satoshi) {
        return parseInt(satoshi / 1e8);
    }
};
