class BtcTransactionHelperError extends Error {
    constructor(message, err) {
        super(message);
        this.stack += '\n Internal ' + err.stack;
    }
}

module.exports = BtcTransactionHelperError;
