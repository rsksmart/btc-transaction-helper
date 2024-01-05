export { TxOutput, Transaction, Network } from "bitcoinjs-lib";

export interface AddressInformation {
    address: string;
    privateKey: string;
}

export interface MultisigInformation {
    members: AddressInformation[];
    redeemScript: string;
}

export interface MultisigAddressInformation {
    address: string;
    info: MultisigInformation;
}

export interface SpendableUtxosInformation {
    utxos: TxOutput[];
    change: number;
}

export interface RecipientTransferInformation {
    recipientAddress: string;
    amountInBtc: number;
}

export interface BlockHeader {
        hash: string,
        confirmations: number,
        height: number,
        version: number,
        versionHex: string,
        merkleroot: string,
        time: number,
        mediantime: number,
        nonce: number,
        bits: string,
        difficulty: number,
        chainwork: string,
        nTx: number,
        previousblockhash: string,
        nextblockhash: string
}

enum AddressType {
    legacy = 'legacy',
    p2shSegwit = 'p2sh-segwit',
    p2shSegwit = 'p2sh-segwit',
}

export interface MempoolTransaction {
    fees: {
        base: number,
        modified: number,
        ancestor: number,
        descendant: number
    },
    size: number,
    fee: number,
    modifiedfee: number,
    time: number,
    height: number,
    descendantcount: number,
    descendantsize: number,
    descendantfees: number,
    ancestorcount: number,
    ancestorsize: number,
    ancestorfees: number,
    wtxid: string,
    depends: [],
    spentby: [],
    'bip125-replaceable': boolean
}

export interface MempoolTransactions {
    [txId: string]: MempoolTransaction
}

type BtcTransactionHelperConfig = {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    network?: string;
    timeout?: number;
    txFee?: number;
}

export class BtcTransactionHelper {
    constructor(config: BtcTransactionHelperConfig);
    generateBtcAddress(type: AddressType): Promise<AddressInformation>;
    generateMultisigAddress(signerSize: number, requiredSigners: number, type: AddressType): Promise<MultisigAddressInformation>;
    selectSpendableUTXOsFromAddress(address: string, amountInBtc: number): Promise<SpendableUtxosInformation>;
    getUtxos(address: string): Promise<TxOutput>;
    transferBtc(senderAddressInformation: AddressInformation, recipientsTransactionInformation: RecipientTransferInformation, paymentData: Buffer[]): Promise<string>;
    getAddressBalance(address: string): Promise<number>;
    getOutputAddress(outputScript: Buffer): string;
    getTransaction(txHash: string): Promise<Transaction>;
    importAddress(address: string, label: string): Promise<null>;
    fundAddress(address: string, amountInBtc: number, mineBlock?: boolean = true): Promise<string>;
    mine(blocks: number = 1): Promise<string[]>;
    getFee(): number;
    decodeBase58Address(address: string): string;
    getLatestBlockNumber(): Promise<number>;
    getBlockHeader(blockHash: string, jsonEncoded: boolean = true): Promise<BlockHeader | string>;
    getTransactionsInMempool(verbose: boolean = false): Promise<string[] | MempoolTransactions>;
}

export class BtcTransactionHelperException {
    stack: string;
    constructor(message: string, error: Error);
}

export const btcToSatoshis = (amount: number) => number;
export const satoshisToBtc = (amount: amount) => number;
