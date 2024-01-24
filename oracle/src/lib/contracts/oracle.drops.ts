import type {Action, Checksum256Type, NameType, UInt64Type} from '@wharfkit/antelope'
import {ABI, Blob, Checksum256, Name, Struct, UInt64} from '@wharfkit/antelope'
import type {ActionOptions, ContractArgs, PartialBy, Table} from '@wharfkit/contract'
import {Contract as BaseContract} from '@wharfkit/contract'
export const abiBlob = Blob.from(
    'DmVvc2lvOjphYmkvMS4yABIJYWRkb3JhY2xlAAEGb3JhY2xlBG5hbWUHYWR2YW5jZQAADGNtcGxhc3RlcG9jaAACBWRyb3BzBnVpbnQ2NAhjb250cmFjdARuYW1lBmNvbW1pdAADBm9yYWNsZQRuYW1lBWVwb2NoBnVpbnQ2NAZjb21taXQLY2hlY2tzdW0yNTYKY29tbWl0X3JvdwAEAmlkBnVpbnQ2NAVlcG9jaAZ1aW50NjQGb3JhY2xlBG5hbWUGY29tbWl0C2NoZWNrc3VtMjU2DGNvbXB1dGVkcm9wcwACBWVwb2NoBnVpbnQ2NAVkcm9wcwZ1aW50NjQMY29tcHV0ZWVwb2NoAAEFZXBvY2gGdWludDY0CWVwb2NoX3JvdwAEBWVwb2NoBnVpbnQ2NAdvcmFjbGVzBm5hbWVbXQljb21wbGV0ZWQGdWludDY0BWRyb3BzC2NoZWNrc3VtMjU2DGZpbmlzaHJldmVhbAABBWVwb2NoBnVpbnQ2NARpbml0AAAKb3JhY2xlX3JvdwABBm9yYWNsZQRuYW1lDHJlbW92ZW9yYWNsZQABBm9yYWNsZQRuYW1lBnJldmVhbAADBm9yYWNsZQRuYW1lBWVwb2NoBnVpbnQ2NAZyZXZlYWwGc3RyaW5nCnJldmVhbF9yb3cABAJpZAZ1aW50NjQFZXBvY2gGdWludDY0Bm9yYWNsZQRuYW1lBnJldmVhbAZzdHJpbmcJc3Vic2NyaWJlAAEKc3Vic2NyaWJlcgRuYW1lDnN1YnNjcmliZXJfcm93AAEKc3Vic2NyaWJlcgRuYW1lC3Vuc3Vic2NyaWJlAAEKc3Vic2NyaWJlcgRuYW1lBHdpcGUAAA0AAFARmUtTMglhZGRvcmFjbGUAAAAAQKFpdjIHYWR2YW5jZQDQEK0qYxOrRAxjbXBsYXN0ZXBvY2gAAAAAAGQnJUUGY29tbWl0AIArvUllXSVFDGNvbXB1dGVkcm9wcwDQEK1KZV0lRQxjb21wdXRlZXBvY2gAEI3a6jbsplsMZmluaXNocmV2ZWFsAAAAAAAAkN10BGluaXQAoCIyl6pNpboMcmVtb3Zlb3JhY2xlAAAAAABEo7a6BnJldmVhbAAAAFDHXYSPxglzdWJzY3JpYmUAANRxF+Gj8dQLdW5zdWJzY3JpYmUAAAAAAACgquMEd2lwZQAFAAAAAGQnJUUDaTY0AAAKY29tbWl0X3JvdwAAAACAhmhVA2k2NAAACWVwb2NoX3JvdwAAAACoiMylA2k2NAAACm9yYWNsZV9yb3cAAAAARKO2ugNpNjQAAApyZXZlYWxfcm93AMBVx12Ej8YDaTY0AAAOc3Vic2NyaWJlcl9yb3cAAAAABAAAAEChaXYyCWVwb2NoX3Jvd9AQrSpjE6tEC2NoZWNrc3VtMjU2gCu9SWVdJUULY2hlY2tzdW0yNTbQEK1KZV0lRQtjaGVja3N1bTI1Ng=='
)
export const abi = ABI.from(abiBlob)
export class Contract extends BaseContract {
    constructor(args: PartialBy<ContractArgs, 'abi' | 'account'>) {
        super({
            client: args.client,
            abi: abi,
            account: args.account || Name.from('oracle.gm'),
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
    addoracle: ActionParams.addoracle
    advance: ActionParams.advance
    cmplastepoch: ActionParams.cmplastepoch
    commit: ActionParams.commit
    computedrops: ActionParams.computedrops
    computeepoch: ActionParams.computeepoch
    finishreveal: ActionParams.finishreveal
    init: ActionParams.init
    removeoracle: ActionParams.removeoracle
    reveal: ActionParams.reveal
    subscribe: ActionParams.subscribe
    unsubscribe: ActionParams.unsubscribe
    wipe: ActionParams.wipe
}
export namespace ActionParams {
    export namespace Type {}
    export interface addoracle {
        oracle: NameType
    }
    export interface advance {}
    export interface cmplastepoch {
        drops: UInt64Type
        contract: NameType
    }
    export interface commit {
        oracle: NameType
        epoch: UInt64Type
        commit: Checksum256Type
    }
    export interface computedrops {
        epoch: UInt64Type
        drops: UInt64Type
    }
    export interface computeepoch {
        epoch: UInt64Type
    }
    export interface finishreveal {
        epoch: UInt64Type
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
    export interface subscribe {
        subscriber: NameType
    }
    export interface unsubscribe {
        subscriber: NameType
    }
    export interface wipe {}
}
export namespace Types {
    @Struct.type('addoracle')
    export class addoracle extends Struct {
        @Struct.field(Name)
        oracle!: Name
    }
    @Struct.type('advance')
    export class advance extends Struct {}
    @Struct.type('cmplastepoch')
    export class cmplastepoch extends Struct {
        @Struct.field(UInt64)
        drops!: UInt64
        @Struct.field(Name)
        contract!: Name
    }
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
    @Struct.type('computedrops')
    export class computedrops extends Struct {
        @Struct.field(UInt64)
        epoch!: UInt64
        @Struct.field(UInt64)
        drops!: UInt64
    }
    @Struct.type('computeepoch')
    export class computeepoch extends Struct {
        @Struct.field(UInt64)
        epoch!: UInt64
    }
    @Struct.type('epoch_row')
    export class epoch_row extends Struct {
        @Struct.field(UInt64)
        epoch!: UInt64
        @Struct.field(Name, {array: true})
        oracles!: Name[]
        @Struct.field(UInt64)
        completed!: UInt64
        @Struct.field(Checksum256)
        drops!: Checksum256
    }
    @Struct.type('finishreveal')
    export class finishreveal extends Struct {
        @Struct.field(UInt64)
        epoch!: UInt64
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
    @Struct.type('subscribe')
    export class subscribe extends Struct {
        @Struct.field(Name)
        subscriber!: Name
    }
    @Struct.type('subscriber_row')
    export class subscriber_row extends Struct {
        @Struct.field(Name)
        subscriber!: Name
    }
    @Struct.type('unsubscribe')
    export class unsubscribe extends Struct {
        @Struct.field(Name)
        subscriber!: Name
    }
    @Struct.type('wipe')
    export class wipe extends Struct {}
}
export const TableMap = {
    commit: Types.commit_row,
    epoch: Types.epoch_row,
    oracle: Types.oracle_row,
    reveal: Types.reveal_row,
    subscriber: Types.subscriber_row,
}
export interface TableTypes {
    commit: Types.commit_row
    epoch: Types.epoch_row
    oracle: Types.oracle_row
    reveal: Types.reveal_row
    subscriber: Types.subscriber_row
}
export type RowType<T> = T extends keyof TableTypes ? TableTypes[T] : any
export type ActionNames = keyof ActionNameParams
export type TableNames = keyof TableTypes
export interface ActionReturnValues {
    advance: Types.epoch_row
    cmplastepoch: Checksum256
    computedrops: Checksum256
    computeepoch: Checksum256
}
export type ActionReturnNames = keyof ActionReturnValues
