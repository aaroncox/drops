import type {Action, NameType, UInt32Type, UInt64Type} from '@wharfkit/antelope'
import {ABI, Asset, Blob, Name, Struct, TimePoint, UInt16, UInt32, UInt64} from '@wharfkit/antelope'
import type {ActionOptions, ContractArgs, PartialBy, Table} from '@wharfkit/contract'
import {Contract as BaseContract} from '@wharfkit/contract'
export const abiBlob = Blob.from(
    'DmVvc2lvOjphYmkvMS4yABELYWNjb3VudF9yb3cAAgdhY2NvdW50BG5hbWUFc2VlZHMGdWludDMyB2FkdmFuY2UAAAdkZXN0cm95AAMFb3duZXIEbmFtZQhzZWVkX2lkcwh1aW50NjRbXQRtZW1vBnN0cmluZxRkZXN0cm95X3JldHVybl92YWx1ZQACCHJhbV9zb2xkBnVpbnQ2NAhyZWRlZW1lZAVhc3NldApkZXN0cm95YWxsAAAGZW5hYmxlAAEHZW5hYmxlZARib29sCWVwb2NoX3JvdwADBWVwb2NoBnVpbnQ2NAVzdGFydAp0aW1lX3BvaW50A2VuZAp0aW1lX3BvaW50FWdlbmVyYXRlX3JldHVybl92YWx1ZQAGBXNlZWRzBnVpbnQzMgVlcG9jaAZ1aW50NjQEY29zdAVhc3NldAZyZWZ1bmQFYXNzZXQLdG90YWxfc2VlZHMGdWludDY0C2Vwb2NoX3NlZWRzBnVpbnQ2NAxnZW5lcmF0ZXJ0cm4AAARpbml0AAAEbWludAADBW93bmVyBG5hbWUGYW1vdW50BnVpbnQzMgRkYXRhBnN0cmluZwhzZWVkX3JvdwAEBHNlZWQGdWludDY0BWVwb2NoBnVpbnQ2NAVvd25lcgRuYW1lCXNvdWxib3VuZARib29sCHN0YXRfcm93AAQCaWQGdWludDY0B2FjY291bnQEbmFtZQVlcG9jaAZ1aW50NjQFc2VlZHMGdWludDMyCXN0YXRlX3JvdwADAmlkBnVpbnQxNgVlcG9jaAZ1aW50NjQHZW5hYmxlZARib29sCHRyYW5zZmVyAAQEZnJvbQRuYW1lAnRvBG5hbWUIc2VlZF9pZHMIdWludDY0W10EbWVtbwZzdHJpbmcEd2lwZQAACHdpcGVzb21lAAAKAAAAQKFpdjIHYWR2YW5jZQAAAADA05uxSgdkZXN0cm95AABAjMbTm7FKCmRlc3Ryb3lhbGwAAAAAAKh4zFQGZW5hYmxlADBvviqbq6ZiDGdlbmVyYXRlcnRybgAAAAAAAJDddARpbml0AAAAAAAAkKeTBG1pbnQAAAAAVy08zc0IdHJhbnNmZXIAAAAAAACgquMEd2lwZQAAAABKUqyq4wh3aXBlc29tZQAFAAAAIE9NETIDaTY0AAALYWNjb3VudF9yb3cAAAAAgIZoVQNpNjQAAAllcG9jaF9yb3cAAAAAAJCUwgNpNjQAAAhzZWVkX3JvdwAAAAAAkE3GA2k2NAAACHN0YXRfcm93AAAAAACVTcYDaTY0AAAJc3RhdGVfcm93AAAAAAQAAABAoWl2MgllcG9jaF9yb3cAAADA05uxShRkZXN0cm95X3JldHVybl92YWx1ZTBvviqbq6ZiFWdlbmVyYXRlX3JldHVybl92YWx1ZQAAAAAAkKeTFWdlbmVyYXRlX3JldHVybl92YWx1ZQ=='
)
export const abi = ABI.from(abiBlob)
export class Contract extends BaseContract {
    constructor(args: PartialBy<ContractArgs, 'abi' | 'account'>) {
        super({
            client: args.client,
            abi: abi,
            account: args.account || Name.from('seed.gm'),
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
    advance: ActionParams.advance
    destroy: ActionParams.destroy
    destroyall: ActionParams.destroyall
    enable: ActionParams.enable
    generatertrn: ActionParams.generatertrn
    init: ActionParams.init
    mint: ActionParams.mint
    transfer: ActionParams.transfer
    wipe: ActionParams.wipe
    wipesome: ActionParams.wipesome
}
export namespace ActionParams {
    export namespace Type {}
    export interface advance {}
    export interface destroy {
        owner: NameType
        seed_ids: UInt64Type[]
        memo: string
    }
    export interface destroyall {}
    export interface enable {
        enabled: boolean
    }
    export interface generatertrn {}
    export interface init {}
    export interface mint {
        owner: NameType
        amount: UInt32Type
        data: string
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
    @Struct.type('account_row')
    export class account_row extends Struct {
        @Struct.field(Name)
        account!: Name
        @Struct.field(UInt32)
        seeds!: UInt32
    }
    @Struct.type('advance')
    export class advance extends Struct {}
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
    @Struct.type('epoch_row')
    export class epoch_row extends Struct {
        @Struct.field(UInt64)
        epoch!: UInt64
        @Struct.field(TimePoint)
        start!: TimePoint
        @Struct.field(TimePoint)
        end!: TimePoint
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
    @Struct.type('mint')
    export class mint extends Struct {
        @Struct.field(Name)
        owner!: Name
        @Struct.field(UInt32)
        amount!: UInt32
        @Struct.field('string')
        data!: string
    }
    @Struct.type('seed_row')
    export class seed_row extends Struct {
        @Struct.field(UInt64)
        seed!: UInt64
        @Struct.field(UInt64)
        epoch!: UInt64
        @Struct.field(Name)
        owner!: Name
        @Struct.field('bool')
        soulbound!: boolean
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
    account: Types.account_row,
    epoch: Types.epoch_row,
    seed: Types.seed_row,
    stat: Types.stat_row,
    state: Types.state_row,
}
export interface TableTypes {
    account: Types.account_row
    epoch: Types.epoch_row
    seed: Types.seed_row
    stat: Types.stat_row
    state: Types.state_row
}
export type RowType<T> = T extends keyof TableTypes ? TableTypes[T] : any
export type ActionNames = keyof ActionNameParams
export type TableNames = keyof TableTypes
export interface ActionReturnValues {
    advance: Types.epoch_row
    destroy: Types.destroy_return_value
    generatertrn: Types.generate_return_value
    mint: Types.generate_return_value
}
export type ActionReturnNames = keyof ActionReturnValues
