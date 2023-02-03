const BTC_MAX_DECIMAL = 8;
const BTC_IN_SATOSHIS = Math.pow(10, BTC_MAX_DECIMAL);

const btcToSatoshis = amount => Math.round(amount * BTC_IN_SATOSHIS);
const satoshisToBtc = amount => Number((amount / BTC_IN_SATOSHIS).toFixed(BTC_MAX_DECIMAL));

module.exports = {
    btcToSatoshis,
    satoshisToBtc
};
