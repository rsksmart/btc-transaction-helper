export { TxOutput, Transaction } from "bitcoinjs-lib";

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
export default interface BtcTransactionHelper {
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
    getBlockHeader(blockHash: string, jsonEncoded: boolen = true): BlockHeader;
}
