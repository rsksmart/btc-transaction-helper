const network = require('../index').networks.regtest;

const config = {
    host: 'localhost',
    port: 18332,
    user: 'rsk',
    pass: 'rsk',
    timeout: 30000,
    network: network
};

module.exports = config;
