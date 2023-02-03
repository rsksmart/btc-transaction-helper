const BTC_IN_SATOSHIS = Math.pow(10, 8);
const BTC_MAX_DECIMAL = 8;

const btcToString = amount => amount.toFixed(BTC_MAX_DECIMAL);
const btcToSatoshis = amount => Math.round(amount * BTC_IN_SATOSHIS);
const satoshisToBtc = amount => Number(btcToString(amount / BTC_IN_SATOSHIS));

module.exports = {
    btcToString,
    btcToSatoshis,
    satoshisToBtc
};
