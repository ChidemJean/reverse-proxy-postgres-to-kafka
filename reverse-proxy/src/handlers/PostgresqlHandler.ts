import { getEnumKeyByEnumValue } from "../utils/enum";

export enum PostgresqlResponseTypes {
    Authentication = 0x52,
    BackendKeyData = 0x4B,
    RowDescription = 0x54,
    DataRow = 0x44,
    CommandComplete = 0x43,
    Complete = 0x31,
    Error = 0x45,
    ReadyForQuery = 0x5A,
    Notice = 0x4E,
}

export class PostgresqlHandler {

    constructor() {}

    checkResponseHeader(data: Buffer) {
        return getEnumKeyByEnumValue(PostgresqlResponseTypes, data[0]);
    } 

    interceptResponse(data: Buffer) {
        const textData = data.toString('utf-8', 20).replace(/@/g, ' ').replace(/[^A-Za-z0-9 _$%]/g, '').replace(/12nC/g, ' ').replace(/D\$|D%/g, '\n').trim();
        console.log(data[0], this.checkResponseHeader(data));
        console.log(textData);
        return /ZI/.test(textData) && (/INSERT/.test(textData) || /UPDATE/.test(textData));
    }

}