import type {Action, Checksum256Type, NameType, UInt64Type} from '@wharfkit/antelope'
import {
    ABI,
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
    'DmVvc2lvOjphYmkvMS4yABMLYWNjb3VudF9yb3cAAgdhY2NvdW50BG5hbWUFc2VlZHMGdWludDMyCWFkZG9yYWNsZQABBm9yYWNsZQRuYW1lB2FkdmFuY2UAAAZjb21taXQAAwZvcmFjbGUEbmFtZQVlcG9jaAZ1aW50NjQGY29tbWl0C2NoZWNrc3VtMjU2CmNvbW1pdF9yb3cABAJpZAZ1aW50NjQFZXBvY2gGdWludDY0Bm9yYWNsZQRuYW1lBmNvbW1pdAtjaGVja3N1bTI1NgdkZXN0cm95AAIFb3duZXIEbmFtZQp0b19kZXN0cm95CHVpbnQ2NFtdBmVuYWJsZQABB2VuYWJsZWQEYm9vbAllcG9jaF9yb3cABQVlcG9jaAZ1aW50NjQFc3RhcnQKdGltZV9wb2ludANlbmQKdGltZV9wb2ludAZyZXZlYWwKdGltZV9wb2ludAhjb21wbGV0ZQp0aW1lX3BvaW50BGluaXQAAApvcmFjbGVfcm93AAEGb3JhY2xlBG5hbWUMcmVtb3Zlb3JhY2xlAAEGb3JhY2xlBG5hbWUGcmV2ZWFsAAMGb3JhY2xlBG5hbWUFZXBvY2gGdWludDY0BnJldmVhbAZzdHJpbmcKcmV2ZWFsX3JvdwAEAmlkBnVpbnQ2NAVlcG9jaAZ1aW50NjQGb3JhY2xlBG5hbWUGcmV2ZWFsBnN0cmluZwhzZWVkX3JvdwADBHNlZWQGdWludDY0BW93bmVyBG5hbWUFZXBvY2gGdWludDY0CHN0YXRfcm93AAQCaWQGdWludDY0B2FjY291bnQEbmFtZQVlcG9jaAZ1aW50NjQFc2VlZHMGdWludDMyCXN0YXRlX3JvdwADAmlkBnVpbnQxNgVlcG9jaAZ1aW50NjQHZW5hYmxlZARib29sCHRyYW5zZmVyAAMEZnJvbQRuYW1lAnRvBG5hbWULdG9fdHJhbnNmZXIIdWludDY0W10Ed2lwZQAACHdpcGVzb21lAAALAABQEZlLUzIJYWRkb3JhY2xlAAAAAEChaXYyB2FkdmFuY2UAAAAAAGQnJUUGY29tbWl0AAAAAMDTm7FKB2Rlc3Ryb3kAAAAAAKh4zFQGZW5hYmxlAAAAAAAAkN10BGluaXQAoCIyl6pNpboMcmVtb3Zlb3JhY2xlAAAAAABEo7a6BnJldmVhbAAAAABXLTzNzQh0cmFuc2ZlcgAAAAAAAKCq4wR3aXBlAAAAAEpSrKrjCHdpcGVzb21lAAgAAAA4T00RMgNpNjQAAAthY2NvdW50X3JvdwAAAABnJyVFA2k2NAAACmNvbW1pdF9yb3cAAAAA4IZoVQNpNjQAAAllcG9jaF9yb3cAAAAAq4jMpQNpNjQAAApvcmFjbGVfcm93AAAAAEejtroDaTY0AAAKcmV2ZWFsX3JvdwAAAAAAnJTCA2k2NAAACHNlZWRfcm93AAAAAACVTcYDaTY0AAAJc3RhdGVfcm93AAAAAACcTcYDaTY0AAAIc3RhdF9yb3cAAAAAAA=='
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
