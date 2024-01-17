import type {Action, Checksum256Type, NameType, UInt64Type} from '@wharfkit/antelope'
import {
    ABI,
    Asset,
    Blob,
    Checksum256,
    Name,
    Struct,
    TimePoint,
    UInt16,
    UInt32,
    UInt64,
} from '@wharfkit/antelope'
import type {ActionOptions, ContractArgs, PartialBy, Table} from '@wharfkit/contract'
import {Contract as BaseContract} from '@wharfkit/contract'
export const abiBlob = Blob.from(
    'DmVvc2lvOjphYmkvMS4yABsMYXBpX3Jlc3BvbnNlAAEDZm9vBnVpbnQ2NAdjYWxsYXBpAAALYWNjb3VudF9yb3cAAgdhY2NvdW50BG5hbWUFc2VlZHMGdWludDMyCWFkZG9yYWNsZQABBm9yYWNsZQRuYW1lB2FkdmFuY2UAAAZjb21taXQAAwZvcmFjbGUEbmFtZQVlcG9jaAZ1aW50NjQGY29tbWl0C2NoZWNrc3VtMjU2CmNvbW1pdF9yb3cABAJpZAZ1aW50NjQFZXBvY2gGdWludDY0Bm9yYWNsZQRuYW1lBmNvbW1pdAtjaGVja3N1bTI1Ngdjb21wdXRlAAIFZXBvY2gGdWludDY0BHNlZWQGdWludDY0B2Rlc3Ryb3kAAwVvd25lcgRuYW1lCHNlZWRfaWRzCHVpbnQ2NFtdBG1lbW8Gc3RyaW5nFGRlc3Ryb3lfcmV0dXJuX3ZhbHVlAAIIcmFtX3NvbGQGdWludDY0CHJlZGVlbWVkBWFzc2V0CmRlc3Ryb3lhbGwAAAZlbmFibGUAAQdlbmFibGVkBGJvb2wGZW5yb2xsAAIHYWNjb3VudARuYW1lBWVwb2NoBnVpbnQ2NAllcG9jaF9yb3cABQVlcG9jaAZ1aW50NjQFc3RhcnQKdGltZV9wb2ludANlbmQKdGltZV9wb2ludAZyZXZlYWwKdGltZV9wb2ludAhjb21wbGV0ZQp0aW1lX3BvaW50FWdlbmVyYXRlX3JldHVybl92YWx1ZQAGBXNlZWRzBnVpbnQzMgVlcG9jaAZ1aW50NjQEY29zdAVhc3NldAZyZWZ1bmQFYXNzZXQLdG90YWxfc2VlZHMGdWludDY0C2Vwb2NoX3NlZWRzBnVpbnQ2NAxnZW5lcmF0ZXJ0cm4AAARpbml0AAAKb3JhY2xlX3JvdwABBm9yYWNsZQRuYW1lDHJlbW92ZW9yYWNsZQABBm9yYWNsZQRuYW1lBnJldmVhbAADBm9yYWNsZQRuYW1lBWVwb2NoBnVpbnQ2NAZyZXZlYWwGc3RyaW5nCnJldmVhbF9yb3cABAJpZAZ1aW50NjQFZXBvY2gGdWludDY0Bm9yYWNsZQRuYW1lBnJldmVhbAZzdHJpbmcIc2VlZF9yb3cAAwRzZWVkBnVpbnQ2NAVvd25lcgRuYW1lBWVwb2NoBnVpbnQ2NAhzdGF0X3JvdwAEAmlkBnVpbnQ2NAdhY2NvdW50BG5hbWUFZXBvY2gGdWludDY0BXNlZWRzBnVpbnQzMglzdGF0ZV9yb3cAAwJpZAZ1aW50MTYFZXBvY2gGdWludDY0B2VuYWJsZWQEYm9vbAh0cmFuc2ZlcgAEBGZyb20EbmFtZQJ0bwRuYW1lCHNlZWRfaWRzCHVpbnQ2NFtdBG1lbW8Gc3RyaW5nBHdpcGUAAAh3aXBlc29tZQAAEAAAAMBVE6NBB2NhbGxhcGkAAABQEZlLUzIJYWRkb3JhY2xlAAAAAEChaXYyB2FkdmFuY2UAAAAAAGQnJUUGY29tbWl0AAAAAEBlXSVFB2NvbXB1dGUAAAAAwNObsUoHZGVzdHJveQAAQIzG05uxSgpkZXN0cm95YWxsAAAAAACoeMxUBmVuYWJsZQAAAAAAxEjvVAZlbnJvbGwAMG++KpurpmIMZ2VuZXJhdGVydHJuAAAAAAAAkN10BGluaXQAoCIyl6pNpboMcmVtb3Zlb3JhY2xlAAAAAABEo7a6BnJldmVhbAAAAABXLTzNzQh0cmFuc2ZlcgAAAAAAAKCq4wR3aXBlAAAAAEpSrKrjCHdpcGVzb21lAAgAAAA4T00RMgNpNjQAAAthY2NvdW50X3JvdwAAAABnJyVFA2k2NAAACmNvbW1pdF9yb3cAAAAA4IZoVQNpNjQAAAllcG9jaF9yb3cAAAAAq4jMpQNpNjQAAApvcmFjbGVfcm93AAAAAEejtroDaTY0AAAKcmV2ZWFsX3JvdwAAAAAAnJTCA2k2NAAACHNlZWRfcm93AAAAAACVTcYDaTY0AAAJc3RhdGVfcm93AAAAAACcTcYDaTY0AAAIc3RhdF9yb3cAAAAABQAAAMBVE6NBDGFwaV9yZXNwb25zZQAAAEChaXYyCWVwb2NoX3JvdwAAAEBlXSVFC2NoZWNrc3VtMjU2AAAAwNObsUoUZGVzdHJveV9yZXR1cm5fdmFsdWUwb74qm6umYhVnZW5lcmF0ZV9yZXR1cm5fdmFsdWU='
)
export const abi = ABI.from(abiBlob)
export class Contract extends BaseContract {
    constructor(args: PartialBy<ContractArgs, 'abi' | 'account'>) {
        super({
            client: args.client,
            abi: abi,
            account: args.account || Name.from('testing.gm'),
        })
    }
    action<T extends ActionNames>(
        name: T,
        data: ActionNameParams[T],
        options?: ActionOptions
    ): Action {
        return super.action(name, data, options)
    }
    readonly<T extends ActionReturnNames>(
        name: T,
        data?: ActionNameParams[T]
    ): ActionReturnValues[T] {
        return super.readonly(name, data) as unknown as ActionReturnValues[T]
    }
    table<T extends TableNames>(name: T, scope?: NameType): Table<RowType<T>> {
        return super.table(name, scope, TableMap[name])
    }
}
export interface ActionNameParams {
    callapi: ActionParams.callapi
    addoracle: ActionParams.addoracle
    advance: ActionParams.advance
    commit: ActionParams.commit
    compute: ActionParams.compute
    destroy: ActionParams.destroy
    destroyall: ActionParams.destroyall
    enable: ActionParams.enable
    enroll: ActionParams.enroll
    generatertrn: ActionParams.generatertrn
    init: ActionParams.init
    removeoracle: ActionParams.removeoracle
    reveal: ActionParams.reveal
    transfer: ActionParams.transfer
    wipe: ActionParams.wipe
    wipesome: ActionParams.wipesome
}
export namespace ActionParams {
    export namespace Type {}
    export interface callapi {}
    export interface addoracle {
        oracle: NameType
    }
    export interface advance {}
    export interface commit {
        oracle: NameType
        epoch: UInt64Type
        commit: Checksum256Type
    }
    export interface compute {
        epoch: UInt64Type
        seed: UInt64Type
    }
    export interface destroy {
        owner: NameType
        seed_ids: UInt64Type[]
        memo: string
    }
    export interface destroyall {}
    export interface enable {
        enabled: boolean
    }
    export interface enroll {
        account: NameType
        epoch: UInt64Type
    }
    export interface generatertrn {}
    export interface init {}
    export interface removeoracle {
        oracle: NameType
    }
    export interface reveal {
        oracle: NameType
        epoch: UInt64Type
        reveal: string
    }
    export interface transfer {
        from: NameType
        to: NameType
        seed_ids: UInt64Type[]
        memo: string
    }
    export interface wipe {}
    export interface wipesome {}
}
export namespace Types {
    @Struct.type('api_response')
    export class api_response extends Struct {
        @Struct.field(UInt64)
        foo!: UInt64
    }
    @Struct.type('callapi')
    export class callapi extends Struct {}
    @Struct.type('account_row')
    export class account_row extends Struct {
        @Struct.field(Name)
        account!: Name
        @Struct.field(UInt32)
        seeds!: UInt32
    }
    @Struct.type('addoracle')
    export class addoracle extends Struct {
        @Struct.field(Name)
        oracle!: Name
    }
    @Struct.type('advance')
    export class advance extends Struct {}
    @Struct.type('commit')
    export class commit extends Struct {
        @Struct.field(Name)
        oracle!: Name
        @Struct.field(UInt64)
        epoch!: UInt64
        @Struct.field(Checksum256)
        commit!: Checksum256
    }
    @Struct.type('commit_row')
    export class commit_row extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        epoch!: UInt64
        @Struct.field(Name)
        oracle!: Name
        @Struct.field(Checksum256)
        commit!: Checksum256
    }
    @Struct.type('compute')
    export class compute extends Struct {
        @Struct.field(UInt64)
        epoch!: UInt64
        @Struct.field(UInt64)
        seed!: UInt64
    }
    @Struct.type('destroy')
    export class destroy extends Struct {
        @Struct.field(Name)
        owner!: Name
        @Struct.field(UInt64, {array: true})
        seed_ids!: UInt64[]
        @Struct.field('string')
        memo!: string
    }
    @Struct.type('destroy_return_value')
    export class destroy_return_value extends Struct {
        @Struct.field(UInt64)
        ram_sold!: UInt64
        @Struct.field(Asset)
        redeemed!: Asset
    }
    @Struct.type('destroyall')
    export class destroyall extends Struct {}
    @Struct.type('enable')
    export class enable extends Struct {
        @Struct.field('bool')
        enabled!: boolean
    }
    @Struct.type('enroll')
    export class enroll extends Struct {
        @Struct.field(Name)
        account!: Name
        @Struct.field(UInt64)
        epoch!: UInt64
    }
    @Struct.type('epoch_row')
    export class epoch_row extends Struct {
        @Struct.field(UInt64)
        epoch!: UInt64
        @Struct.field(TimePoint)
        start!: TimePoint
        @Struct.field(TimePoint)
        end!: TimePoint
        @Struct.field(TimePoint)
        reveal!: TimePoint
        @Struct.field(TimePoint)
        complete!: TimePoint
    }
    @Struct.type('generate_return_value')
    export class generate_return_value extends Struct {
        @Struct.field(UInt32)
        seeds!: UInt32
        @Struct.field(UInt64)
        epoch!: UInt64
        @Struct.field(Asset)
        cost!: Asset
        @Struct.field(Asset)
        refund!: Asset
        @Struct.field(UInt64)
        total_seeds!: UInt64
        @Struct.field(UInt64)
        epoch_seeds!: UInt64
    }
    @Struct.type('generatertrn')
    export class generatertrn extends Struct {}
    @Struct.type('init')
    export class init extends Struct {}
    @Struct.type('oracle_row')
    export class oracle_row extends Struct {
        @Struct.field(Name)
        oracle!: Name
    }
    @Struct.type('removeoracle')
    export class removeoracle extends Struct {
        @Struct.field(Name)
        oracle!: Name
    }
    @Struct.type('reveal')
    export class reveal extends Struct {
        @Struct.field(Name)
        oracle!: Name
        @Struct.field(UInt64)
        epoch!: UInt64
        @Struct.field('string')
        reveal!: string
    }
    @Struct.type('reveal_row')
    export class reveal_row extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        epoch!: UInt64
        @Struct.field(Name)
        oracle!: Name
        @Struct.field('string')
        reveal!: string
    }
    @Struct.type('seed_row')
    export class seed_row extends Struct {
        @Struct.field(UInt64)
        seed!: UInt64
        @Struct.field(Name)
        owner!: Name
        @Struct.field(UInt64)
        epoch!: UInt64
    }
    @Struct.type('stat_row')
    export class stat_row extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(Name)
        account!: Name
        @Struct.field(UInt64)
        epoch!: UInt64
        @Struct.field(UInt32)
        seeds!: UInt32
    }
    @Struct.type('state_row')
    export class state_row extends Struct {
        @Struct.field(UInt16)
        id!: UInt16
        @Struct.field(UInt64)
        epoch!: UInt64
        @Struct.field('bool')
        enabled!: boolean
    }
    @Struct.type('transfer')
    export class transfer extends Struct {
        @Struct.field(Name)
        from!: Name
        @Struct.field(Name)
        to!: Name
        @Struct.field(UInt64, {array: true})
        seed_ids!: UInt64[]
        @Struct.field('string')
        memo!: string
    }
    @Struct.type('wipe')
    export class wipe extends Struct {}
    @Struct.type('wipesome')
    export class wipesome extends Struct {}
}
export const TableMap = {
    accounts: Types.account_row,
    commits: Types.commit_row,
    epochs: Types.epoch_row,
    oracles: Types.oracle_row,
    reveals: Types.reveal_row,
    seeds: Types.seed_row,
    state: Types.state_row,
    stats: Types.stat_row,
}
export interface TableTypes {
    accounts: Types.account_row
    commits: Types.commit_row
    epochs: Types.epoch_row
    oracles: Types.oracle_row
    reveals: Types.reveal_row
    seeds: Types.seed_row
    state: Types.state_row
    stats: Types.stat_row
}
export type RowType<T> = T extends keyof TableTypes ? TableTypes[T] : any
export type ActionNames = keyof ActionNameParams
export type TableNames = keyof TableTypes
export interface ActionReturnValues {
    callapi: Types.api_response
    advance: Types.epoch_row
    compute: Checksum256
    destroy: Types.destroy_return_value
    generatertrn: Types.generate_return_value
}
export type ActionReturnNames = keyof ActionReturnValues
