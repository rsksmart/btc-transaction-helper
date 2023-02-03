const { assert } = require('chai');

const conversion = require('../index').conversion;

describe('conversion', () => {

    it('should convert btc to satoshis', () => {

        assert.equal(conversion.btcToSatoshis(1), 100_000_000);

        assert.equal(conversion.btcToSatoshis(100), 10_000_000_000);

        assert.equal(conversion.btcToSatoshis(21_000_000), 2_100_000_000_000_000);

        assert.equal(conversion.btcToSatoshis(0.5), 50_000_000);

        assert.equal(conversion.btcToSatoshis(0.005), 500_000);

        //0.000000000000000000005 BTC should equal 0 Satoshis because the precision of BTC is 8 decimal
        assert.equal(conversion.btcToSatoshis(0.000000000000000000005), 0);

        assert.equal(conversion.btcToSatoshis(0.00000003), 3);

        assert.equal(conversion.btcToSatoshis(-5), -500_000_000);
        
    });

    it('should convert satoshis to btc', () => {

        assert.equal(conversion.satoshisToBtc(100_000_000), 1);

        assert.equal(conversion.satoshisToBtc(10_000_000_000), 100);

        assert.equal(conversion.satoshisToBtc(2_100_000_000_000_000), 21_000_000);

        assert.equal(conversion.satoshisToBtc(50_000_000), 0.5);

        assert.equal(conversion.satoshisToBtc(500_000), 0.005);

        assert.equal(conversion.satoshisToBtc(0), 0);

        assert.equal(conversion.satoshisToBtc(3), 0.00000003);

        assert.equal(conversion.satoshisToBtc(-500_000_000), -5);

    });

});
