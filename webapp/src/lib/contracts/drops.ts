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
    'DmVvc2lvOjphYmkvMS4yABYLYWNjb3VudF9yb3cAAgdhY2NvdW50BG5hbWUFc2VlZHMGdWludDMyCWFkZG9yYWNsZQABBm9yYWNsZQRuYW1lB2FkdmFuY2UAAAZjb21taXQAAwZvcmFjbGUEbmFtZQVlcG9jaAZ1aW50NjQGY29tbWl0C2NoZWNrc3VtMjU2CmNvbW1pdF9yb3cABAJpZAZ1aW50NjQFZXBvY2gGdWludDY0Bm9yYWNsZQRuYW1lBmNvbW1pdAtjaGVja3N1bTI1NgdkZXN0cm95AAIFb3duZXIEbmFtZQp0b19kZXN0cm95CHVpbnQ2NFtdBmVuYWJsZQABB2VuYWJsZWQEYm9vbAZlbnJvbGwAAgdhY2NvdW50BG5hbWUFZXBvY2gGdWludDY0CWVwb2NoX3JvdwAFBWVwb2NoBnVpbnQ2NAVzdGFydAp0aW1lX3BvaW50A2VuZAp0aW1lX3BvaW50BnJldmVhbAp0aW1lX3BvaW50CGNvbXBsZXRlCnRpbWVfcG9pbnQVZ2VuZXJhdGVfcmV0dXJuX3ZhbHVlAAQFc2VlZHMGdWludDMyBWVwb2NoBnVpbnQ2NARjb3N0BWFzc2V0BnJlZnVuZAVhc3NldAxnZW5lcmF0ZXJ0cm4AAARpbml0AAAKb3JhY2xlX3JvdwABBm9yYWNsZQRuYW1lDHJlbW92ZW9yYWNsZQABBm9yYWNsZQRuYW1lBnJldmVhbAADBm9yYWNsZQRuYW1lBWVwb2NoBnVpbnQ2NAZyZXZlYWwGc3RyaW5nCnJldmVhbF9yb3cABAJpZAZ1aW50NjQFZXBvY2gGdWludDY0Bm9yYWNsZQRuYW1lBnJldmVhbAZzdHJpbmcIc2VlZF9yb3cAAwRzZWVkBnVpbnQ2NAVvd25lcgRuYW1lBWVwb2NoBnVpbnQ2NAhzdGF0X3JvdwAEAmlkBnVpbnQ2NAdhY2NvdW50BG5hbWUFZXBvY2gGdWludDY0BXNlZWRzBnVpbnQzMglzdGF0ZV9yb3cAAwJpZAZ1aW50MTYFZXBvY2gGdWludDY0B2VuYWJsZWQEYm9vbAh0cmFuc2ZlcgADBGZyb20EbmFtZQJ0bwRuYW1lC3RvX3RyYW5zZmVyCHVpbnQ2NFtdBHdpcGUAAAh3aXBlc29tZQAADQAAUBGZS1MyCWFkZG9yYWNsZQAAAABAoWl2MgdhZHZhbmNlAAAAAABkJyVFBmNvbW1pdAAAAADA05uxSgdkZXN0cm95AAAAAACoeMxUBmVuYWJsZQAAAAAAxEjvVAZlbnJvbGwAMG++KpurpmIMZ2VuZXJhdGVydHJuAAAAAAAAkN10BGluaXQAoCIyl6pNpboMcmVtb3Zlb3JhY2xlAAAAAABEo7a6BnJldmVhbAAAAABXLTzNzQh0cmFuc2ZlcgAAAAAAAKCq4wR3aXBlAAAAAEpSrKrjCHdpcGVzb21lAAgAAAA4T00RMgNpNjQAAAthY2NvdW50X3JvdwAAAABnJyVFA2k2NAAACmNvbW1pdF9yb3cAAAAA4IZoVQNpNjQAAAllcG9jaF9yb3cAAAAAq4jMpQNpNjQAAApvcmFjbGVfcm93AAAAAEejtroDaTY0AAAKcmV2ZWFsX3JvdwAAAAAAnJTCA2k2NAAACHNlZWRfcm93AAAAAACVTcYDaTY0AAAJc3RhdGVfcm93AAAAAACcTcYDaTY0AAAIc3RhdF9yb3cAAAAAAgAAAEChaXYyCWVwb2NoX3JvdzBvviqbq6ZiFWdlbmVyYXRlX3JldHVybl92YWx1ZQ=='
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
    table<T extends TableNames>(name: T, scope?: NameType): Table<RowType<T>> {
        return super.table(name, scope, TableMap[name])
    }
}
export interface ActionNameParams {
    addoracle: ActionParams.addoracle
    advance: ActionParams.advance
    commit: ActionParams.commit
    destroy: ActionParams.destroy
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
    export namespace Types {}
    export interface addoracle {
        oracle: NameType
    }
    export interface advance {}
    export interface commit {
        oracle: NameType
        epoch: UInt64Type
        commit: Checksum256Type
    }
    export interface destroy {
        owner: NameType
        to_destroy: UInt64Type[]
    }
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
        to_transfer: UInt64Type[]
    }
    export interface wipe {}
    export interface wipesome {}
}
export namespace Types {
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
    @Struct.type('destroy')
    export class destroy extends Struct {
        @Struct.field(Name)
        owner!: Name
        @Struct.field(UInt64, {array: true})
        to_destroy!: UInt64[]
    }
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
        to_transfer!: UInt64[]
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
