![Build and Test](https://github.com/rsksmart/btc-transaction-helper/actions/workflows/build-test.yml/badge.svg)
[![CodeQL](https://github.com/rsksmart/btc-transaction-helper/workflows/CodeQL/badge.svg)](https://github.com/rsksmart/btc-transaction-helper/actions?query=workflow%3ACodeQL)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/rsksmart/btc-transaction-helper/badge)](https://scorecard.dev/viewer/?uri=github.com/rsksmart/btc-transaction-helper)

# btc-transaction-helper

Utility library to generate BTC addresses (legacy, segwit and multisig) and its BTC private key and execute transfers.

## Breaking changes in 5.x

Version 5.x upgrades `bitcoinjs-lib` to 7.x and `ecpair` to 3.x. Requires Node.js >= 18. This changes the shape of some values returned to consumers:

- Byte values (e.g. `Transaction.outs[].script`, `Transaction.ins[].hash`, the `outputScript` param of `getOutputAddress`) are now `Uint8Array` instead of `Buffer`. A `Buffer` is still accepted anywhere a `Uint8Array` is expected, since `Buffer` is a subclass of it, but values returned from `bitcoinjs-lib` (e.g. from `getTransaction`) are plain `Uint8Array` and no longer have `Buffer`-only methods like `.toString('hex')` — wrap them with `Buffer.from(value)` first if you need those.
- Transaction output values (`Transaction.Output.value`) are now `bigint` instead of `number`.

## Bitcoin Core compatibility

Version 4.x and later are compatible with modern Bitcoin Core releases (tested against Bitcoin Core 31), which removed the legacy wallet and several RPCs this library used to rely on:

- Key pairs are now generated locally with `bitcoinjs-lib` instead of `getnewaddress` + `dumpprivkey` (`dumpprivkey` was removed in Bitcoin Core 30 along with the legacy wallet).
- Multisig addresses are created with the wallet-less `createmultisig` RPC instead of the removed `addmultisigaddress`. `transferBtc` can sign transfers from `legacy`, `p2sh-segwit`, and `bech32` multisig senders alike.
- `getUtxos` (and therefore `getAddressBalance`, `transferBtc`, etc.) scans the UTXO set with `scantxoutset` instead of `listunspent`, so it works for any address without the node wallet tracking it. Note that only confirmed UTXOs are visible, so mine a block after funding an address (`fundAddress` does this by default).
- `importAddress` was removed (`importaddress` was removed in Bitcoin Core 30 and is no longer necessary — `getUtxos`/`getAddressBalance` see any address without it).
- Mining uses `generatetoaddress` (the `generate` RPC was removed in Bitcoin Core 0.19), sending rewards to a node wallet address so the wallet keeps funds for `fundAddress`.

### Node requirements

The connected node must have exactly one wallet loaded (descriptor wallet, private keys enabled), since wallet RPCs are sent to the root RPC endpoint. Create it once with:

> bitcoin-cli createwallet main

or, equivalently, with `btcTransactionHelper.createWallet('main')`.

On regtest, set `-fallbackfee=0.0001` (or add `fallbackfee=0.0001` to `bitcoin.conf`) so `sendtoaddress`/`fundAddress` can estimate fees.

`getTransaction`/`getRawTransaction` of already-confirmed transactions requires the node to run with `-txindex=1` (this is a long-standing Bitcoin Core restriction, not specific to these versions).

## Running samples

> node samples/rpc-commands.js

> node samples/transferBtc-samples.js

> node samples/conversion.js

**Note:** These samples (except for 'conversion') require a running bitcoin instance to connect to. Update `samples/config.js` with the proper configuration.
