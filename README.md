![Github CI/CD](https://github.com/rsksmart/btc-transaction-helper/actions/workflows/workflow.yml/badge.svg)

# btc-transaction-helper

Utility library to generate BTC addresses (legacy, segwit and multisig) and its BTC private key and execute transfers.

## Bitcoin Core compatibility

Version 4.x is compatible with modern Bitcoin Core releases (tested against Bitcoin Core 31), which removed the legacy wallet and several RPCs this library used to rely on:

- Key pairs are now generated locally with `bitcoinjs-lib` instead of `getnewaddress` + `dumpprivkey` (`dumpprivkey` was removed in Bitcoin Core 30 along with the legacy wallet).
- Multisig addresses are created with the wallet-less `createmultisig` RPC instead of the removed `addmultisigaddress`.
- `getUtxos` (and therefore `getAddressBalance`, `transferBtc`, etc.) scans the UTXO set with `scantxoutset` instead of `listunspent`, so it works for any address without the node wallet tracking it. Note that only confirmed UTXOs are visible, so mine a block after funding an address (`fundAddress` does this by default).
- `importAddress` is now a deprecated no-op (`importaddress` was removed in Bitcoin Core 30). It is no longer necessary.
- Mining uses `generatetoaddress` (the `generate` RPC was removed in Bitcoin Core 0.19), sending rewards to a node wallet address so the wallet keeps funds for `fundAddress`.

### Node requirements

The connected node must have exactly one wallet loaded (descriptor wallet, private keys enabled), since wallet RPCs are sent to the root RPC endpoint. Create it once with:

> bitcoin-cli createwallet main

On regtest, set `-fallbackfee=0.0001` (or add `fallbackfee=0.0001` to `bitcoin.conf`) so `sendtoaddress`/`fundAddress` can estimate fees.

`getTransaction`/`getRawTransaction` of already-confirmed transactions requires the node to run with `-txindex=1` (this is a long-standing Bitcoin Core restriction, not specific to these versions).

## Running samples

> node samples/rpc-commands.js

> node samples/transferBtc-samples.js

> node samples/import-address.js

> node samples/conversion.js
 
**Note:** These samples (except for 'conversion') require a running bitcoin instance to connect to. Update `samples/config.js` with the proper configuration.
