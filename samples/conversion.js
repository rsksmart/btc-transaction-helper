const conversion = require('../index').conversion;

(async() => {

    console.log('5 BTCs to satoshis: ', conversion.btcToSatoshis(5));
    
    console.log('500,000,000 Satoshis to BTCs: ', conversion.satoshisToBtc(500_000_000));

})();
