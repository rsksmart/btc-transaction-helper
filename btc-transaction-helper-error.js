module.exports = class BtcTransactionHelperError extends Error {
    constructor(message, err) {
        super(message);
        this.stack += '\n Internal ' + err.stack;
    }
}
