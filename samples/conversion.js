const utils = require('../index').utils;

(async() => {

    console.log('5 BTCs to satoshis: ', utils.btcToSatoshis(5));
    
    console.log('500,000,000 Satoshis to BTCs: ', utils.satoshisToBtc(500_000_000));

})();
