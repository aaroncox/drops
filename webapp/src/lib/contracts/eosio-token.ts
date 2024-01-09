import type {Action, AssetType, NameType} from '@wharfkit/antelope'
import {ABI, Asset, Blob, Name, Struct} from '@wharfkit/antelope'
import type {ActionOptions, ContractArgs, PartialBy, Table} from '@wharfkit/contract'
import {Contract as BaseContract} from '@wharfkit/contract'
export const abiBlob = Blob.from(
    'DmVvc2lvOjphYmkvMS4yAAgHYWNjb3VudAABB2JhbGFuY2UFYXNzZXQFY2xvc2UAAgVvd25lcgRuYW1lBnN5bWJvbAZzeW1ib2wGY3JlYXRlAAIGaXNzdWVyBG5hbWUObWF4aW11bV9zdXBwbHkFYXNzZXQOY3VycmVuY3lfc3RhdHMAAwZzdXBwbHkFYXNzZXQKbWF4X3N1cHBseQVhc3NldAZpc3N1ZXIEbmFtZQVpc3N1ZQADAnRvBG5hbWUIcXVhbnRpdHkFYXNzZXQEbWVtbwZzdHJpbmcEb3BlbgADBW93bmVyBG5hbWUGc3ltYm9sBnN5bWJvbAlyYW1fcGF5ZXIEbmFtZQZyZXRpcmUAAghxdWFudGl0eQVhc3NldARtZW1vBnN0cmluZwh0cmFuc2ZlcgAEBGZyb20EbmFtZQJ0bwRuYW1lCHF1YW50aXR5BWFzc2V0BG1lbW8Gc3RyaW5nBgAAAAAAhWlEBWNsb3Nl+QMtLS0Kc3BlY192ZXJzaW9uOiAiMC4yLjAiCnRpdGxlOiBDbG9zZSBUb2tlbiBCYWxhbmNlCnN1bW1hcnk6ICdDbG9zZSB7e25vd3JhcCBvd25lcn194oCZcyB6ZXJvIHF1YW50aXR5IGJhbGFuY2UnCmljb246IGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9lb3NuZXR3b3JrZm91bmRhdGlvbi9lb3Mtc3lzdGVtLWNvbnRyYWN0cy9tYWluL2NvbnRyYWN0cy9pY29ucy90b2tlbi5wbmcjMjA3ZmY2OGIwNDA2ZWFhNTY2MThiMDhiZGE4MWQ2YTA5NTQ1NDNmMzZhZGMzMjhhYjMwNjVmMzFhNWM1ZDY1NAotLS0KCnt7b3duZXJ9fSBhZ3JlZXMgdG8gY2xvc2UgdGhlaXIgemVybyBxdWFudGl0eSBiYWxhbmNlIGZvciB0aGUge3tzeW1ib2xfdG9fc3ltYm9sX2NvZGUgc3ltYm9sfX0gdG9rZW4uCgpSQU0gd2lsbCBiZSByZWZ1bmRlZCB0byB0aGUgUkFNIHBheWVyIG9mIHRoZSB7e3N5bWJvbF90b19zeW1ib2xfY29kZSBzeW1ib2x9fSB0b2tlbiBiYWxhbmNlIGZvciB7e293bmVyfX0uAAAAAKhs1EUGY3JlYXRlmgUtLS0Kc3BlY192ZXJzaW9uOiAiMC4yLjAiCnRpdGxlOiBDcmVhdGUgTmV3IFRva2VuCnN1bW1hcnk6ICdDcmVhdGUgYSBuZXcgdG9rZW4nCmljb246IGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9lb3NuZXR3b3JrZm91bmRhdGlvbi9lb3Mtc3lzdGVtLWNvbnRyYWN0cy9tYWluL2NvbnRyYWN0cy9pY29ucy90b2tlbi5wbmcjMjA3ZmY2OGIwNDA2ZWFhNTY2MThiMDhiZGE4MWQ2YTA5NTQ1NDNmMzZhZGMzMjhhYjMwNjVmMzFhNWM1ZDY1NAotLS0KCnt7JGFjdGlvbi5hY2NvdW50fX0gYWdyZWVzIHRvIGNyZWF0ZSBhIG5ldyB0b2tlbiB3aXRoIHN5bWJvbCB7e2Fzc2V0X3RvX3N5bWJvbF9jb2RlIG1heGltdW1fc3VwcGx5fX0gdG8gYmUgbWFuYWdlZCBieSB7e2lzc3Vlcn19LgoKVGhpcyBhY3Rpb24gd2lsbCBub3QgcmVzdWx0IGFueSBhbnkgdG9rZW5zIGJlaW5nIGlzc3VlZCBpbnRvIGNpcmN1bGF0aW9uLgoKe3tpc3N1ZXJ9fSB3aWxsIGJlIGFsbG93ZWQgdG8gaXNzdWUgdG9rZW5zIGludG8gY2lyY3VsYXRpb24sIHVwIHRvIGEgbWF4aW11bSBzdXBwbHkgb2Yge3ttYXhpbXVtX3N1cHBseX19LgoKUkFNIHdpbGwgZGVkdWN0ZWQgZnJvbSB7eyRhY3Rpb24uYWNjb3VudH194oCZcyByZXNvdXJjZXMgdG8gY3JlYXRlIHRoZSBuZWNlc3NhcnkgcmVjb3Jkcy4AAAAAAKUxdgVpc3N1Ze4HLS0tCnNwZWNfdmVyc2lvbjogIjAuMi4wIgp0aXRsZTogSXNzdWUgVG9rZW5zIGludG8gQ2lyY3VsYXRpb24Kc3VtbWFyeTogJ0lzc3VlIHt7bm93cmFwIHF1YW50aXR5fX0gaW50byBjaXJjdWxhdGlvbiBhbmQgdHJhbnNmZXIgaW50byB7e25vd3JhcCB0b3194oCZcyBhY2NvdW50JwppY29uOiBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZW9zbmV0d29ya2ZvdW5kYXRpb24vZW9zLXN5c3RlbS1jb250cmFjdHMvbWFpbi9jb250cmFjdHMvaWNvbnMvdG9rZW4ucG5nIzIwN2ZmNjhiMDQwNmVhYTU2NjE4YjA4YmRhODFkNmEwOTU0NTQzZjM2YWRjMzI4YWIzMDY1ZjMxYTVjNWQ2NTQKLS0tCgpUaGUgdG9rZW4gbWFuYWdlciBhZ3JlZXMgdG8gaXNzdWUge3txdWFudGl0eX19IGludG8gY2lyY3VsYXRpb24sIGFuZCB0cmFuc2ZlciBpdCBpbnRvIHt7dG99feKAmXMgYWNjb3VudC4KCnt7I2lmIG1lbW99fVRoZXJlIGlzIGEgbWVtbyBhdHRhY2hlZCB0byB0aGUgdHJhbnNmZXIgc3RhdGluZzoKe3ttZW1vfX0Ke3svaWZ9fQoKSWYge3t0b319IGRvZXMgbm90IGhhdmUgYSBiYWxhbmNlIGZvciB7e2Fzc2V0X3RvX3N5bWJvbF9jb2RlIHF1YW50aXR5fX0sIG9yIHRoZSB0b2tlbiBtYW5hZ2VyIGRvZXMgbm90IGhhdmUgYSBiYWxhbmNlIGZvciB7e2Fzc2V0X3RvX3N5bWJvbF9jb2RlIHF1YW50aXR5fX0sIHRoZSB0b2tlbiBtYW5hZ2VyIHdpbGwgYmUgZGVzaWduYXRlZCBhcyB0aGUgUkFNIHBheWVyIG9mIHRoZSB7e2Fzc2V0X3RvX3N5bWJvbF9jb2RlIHF1YW50aXR5fX0gdG9rZW4gYmFsYW5jZSBmb3Ige3t0b319LiBBcyBhIHJlc3VsdCwgUkFNIHdpbGwgYmUgZGVkdWN0ZWQgZnJvbSB0aGUgdG9rZW4gbWFuYWdlcuKAmXMgcmVzb3VyY2VzIHRvIGNyZWF0ZSB0aGUgbmVjZXNzYXJ5IHJlY29yZHMuCgpUaGlzIGFjdGlvbiBkb2VzIG5vdCBhbGxvdyB0aGUgdG90YWwgcXVhbnRpdHkgdG8gZXhjZWVkIHRoZSBtYXggYWxsb3dlZCBzdXBwbHkgb2YgdGhlIHRva2VuLgAAAAAAMFWlBG9wZW7GBS0tLQpzcGVjX3ZlcnNpb246ICIwLjIuMCIKdGl0bGU6IE9wZW4gVG9rZW4gQmFsYW5jZQpzdW1tYXJ5OiAnT3BlbiBhIHplcm8gcXVhbnRpdHkgYmFsYW5jZSBmb3Ige3tub3dyYXAgb3duZXJ9fScKaWNvbjogaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2Vvc25ldHdvcmtmb3VuZGF0aW9uL2Vvcy1zeXN0ZW0tY29udHJhY3RzL21haW4vY29udHJhY3RzL2ljb25zL3Rva2VuLnBuZyMyMDdmZjY4YjA0MDZlYWE1NjYxOGIwOGJkYTgxZDZhMDk1NDU0M2YzNmFkYzMyOGFiMzA2NWYzMWE1YzVkNjU0Ci0tLQoKe3tyYW1fcGF5ZXJ9fSBhZ3JlZXMgdG8gZXN0YWJsaXNoIGEgemVybyBxdWFudGl0eSBiYWxhbmNlIGZvciB7e293bmVyfX0gZm9yIHRoZSB7e3N5bWJvbF90b19zeW1ib2xfY29kZSBzeW1ib2x9fSB0b2tlbi4KCklmIHt7b3duZXJ9fSBkb2VzIG5vdCBoYXZlIGEgYmFsYW5jZSBmb3Ige3tzeW1ib2xfdG9fc3ltYm9sX2NvZGUgc3ltYm9sfX0sIHt7cmFtX3BheWVyfX0gd2lsbCBiZSBkZXNpZ25hdGVkIGFzIHRoZSBSQU0gcGF5ZXIgb2YgdGhlIHt7c3ltYm9sX3RvX3N5bWJvbF9jb2RlIHN5bWJvbH19IHRva2VuIGJhbGFuY2UgZm9yIHt7b3duZXJ9fS4gQXMgYSByZXN1bHQsIFJBTSB3aWxsIGJlIGRlZHVjdGVkIGZyb20ge3tyYW1fcGF5ZXJ9feKAmXMgcmVzb3VyY2VzIHRvIGNyZWF0ZSB0aGUgbmVjZXNzYXJ5IHJlY29yZHMuAAAAAKjrsroGcmV0aXJl3AMtLS0Kc3BlY192ZXJzaW9uOiAiMC4yLjAiCnRpdGxlOiBSZW1vdmUgVG9rZW5zIGZyb20gQ2lyY3VsYXRpb24Kc3VtbWFyeTogJ1JlbW92ZSB7e25vd3JhcCBxdWFudGl0eX19IGZyb20gY2lyY3VsYXRpb24nCmljb246IGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9lb3NuZXR3b3JrZm91bmRhdGlvbi9lb3Mtc3lzdGVtLWNvbnRyYWN0cy9tYWluL2NvbnRyYWN0cy9pY29ucy90b2tlbi5wbmcjMjA3ZmY2OGIwNDA2ZWFhNTY2MThiMDhiZGE4MWQ2YTA5NTQ1NDNmMzZhZGMzMjhhYjMwNjVmMzFhNWM1ZDY1NAotLS0KClRoZSB0b2tlbiBtYW5hZ2VyIGFncmVlcyB0byByZW1vdmUge3txdWFudGl0eX19IGZyb20gY2lyY3VsYXRpb24sIHRha2VuIGZyb20gdGhlaXIgb3duIGFjY291bnQuCgp7eyNpZiBtZW1vfX0gVGhlcmUgaXMgYSBtZW1vIGF0dGFjaGVkIHRvIHRoZSBhY3Rpb24gc3RhdGluZzoKe3ttZW1vfX0Ke3svaWZ9fQAAAFctPM3NCHRyYW5zZmVytgctLS0Kc3BlY192ZXJzaW9uOiAiMC4yLjAiCnRpdGxlOiBUcmFuc2ZlciBUb2tlbnMKc3VtbWFyeTogJ1NlbmQge3tub3dyYXAgcXVhbnRpdHl9fSBmcm9tIHt7bm93cmFwIGZyb219fSB0byB7e25vd3JhcCB0b319JwppY29uOiBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vZW9zbmV0d29ya2ZvdW5kYXRpb24vZW9zLXN5c3RlbS1jb250cmFjdHMvbWFpbi9jb250cmFjdHMvaWNvbnMvdHJhbnNmZXIucG5nIzVkZmFkMGRmNzI3NzJlZTFjY2MxNTVlNjcwYzFkMTI0ZjVjNTEyMmYxZDUwMjc1NjVkZjM4YjQxODA0MmQxZGQKLS0tCgp7e2Zyb219fSBhZ3JlZXMgdG8gc2VuZCB7e3F1YW50aXR5fX0gdG8ge3t0b319LgoKe3sjaWYgbWVtb319VGhlcmUgaXMgYSBtZW1vIGF0dGFjaGVkIHRvIHRoZSB0cmFuc2ZlciBzdGF0aW5nOgp7e21lbW99fQp7ey9pZn19CgpJZiB7e2Zyb219fSBpcyBub3QgYWxyZWFkeSB0aGUgUkFNIHBheWVyIG9mIHRoZWlyIHt7YXNzZXRfdG9fc3ltYm9sX2NvZGUgcXVhbnRpdHl9fSB0b2tlbiBiYWxhbmNlLCB7e2Zyb219fSB3aWxsIGJlIGRlc2lnbmF0ZWQgYXMgc3VjaC4gQXMgYSByZXN1bHQsIFJBTSB3aWxsIGJlIGRlZHVjdGVkIGZyb20ge3tmcm9tfX3igJlzIHJlc291cmNlcyB0byByZWZ1bmQgdGhlIG9yaWdpbmFsIFJBTSBwYXllci4KCklmIHt7dG99fSBkb2VzIG5vdCBoYXZlIGEgYmFsYW5jZSBmb3Ige3thc3NldF90b19zeW1ib2xfY29kZSBxdWFudGl0eX19LCB7e2Zyb219fSB3aWxsIGJlIGRlc2lnbmF0ZWQgYXMgdGhlIFJBTSBwYXllciBvZiB0aGUge3thc3NldF90b19zeW1ib2xfY29kZSBxdWFudGl0eX19IHRva2VuIGJhbGFuY2UgZm9yIHt7dG99fS4gQXMgYSByZXN1bHQsIFJBTSB3aWxsIGJlIGRlZHVjdGVkIGZyb20ge3tmcm9tfX3igJlzIHJlc291cmNlcyB0byBjcmVhdGUgdGhlIG5lY2Vzc2FyeSByZWNvcmRzLgIAAAA4T00RMgNpNjQAAAdhY2NvdW50AAAAAACQTcYDaTY0AAAOY3VycmVuY3lfc3RhdHMAAAAAAA=='
)
export const abi = ABI.from(abiBlob)
export class Contract extends BaseContract {
    constructor(args: PartialBy<ContractArgs, 'abi' | 'account'>) {
        super({
            client: args.client,
            abi: abi,
            account: args.account || Name.from('eosio.token'),
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
    close: ActionParams.close
    create: ActionParams.create
    issue: ActionParams.issue
    open: ActionParams.open
    retire: ActionParams.retire
    transfer: ActionParams.transfer
}
export namespace ActionParams {
    export namespace Types {}
    export interface close {
        owner: NameType
        symbol: Asset.SymbolType
    }
    export interface create {
        issuer: NameType
        maximum_supply: AssetType
    }
    export interface issue {
        to: NameType
        quantity: AssetType
        memo: string
    }
    export interface open {
        owner: NameType
        symbol: Asset.SymbolType
        ram_payer: NameType
    }
    export interface retire {
        quantity: AssetType
        memo: string
    }
    export interface transfer {
        from: NameType
        to: NameType
        quantity: AssetType
        memo: string
    }
}
export namespace Types {
    @Struct.type('account')
    export class account extends Struct {
        @Struct.field(Asset)
        balance!: Asset
    }
    @Struct.type('close')
    export class close extends Struct {
        @Struct.field(Name)
        owner!: Name
        @Struct.field(Asset.Symbol)
        symbol!: Asset.Symbol
    }
    @Struct.type('create')
    export class create extends Struct {
        @Struct.field(Name)
        issuer!: Name
        @Struct.field(Asset)
        maximum_supply!: Asset
    }
    @Struct.type('currency_stats')
    export class currency_stats extends Struct {
        @Struct.field(Asset)
        supply!: Asset
        @Struct.field(Asset)
        max_supply!: Asset
        @Struct.field(Name)
        issuer!: Name
    }
    @Struct.type('issue')
    export class issue extends Struct {
        @Struct.field(Name)
        to!: Name
        @Struct.field(Asset)
        quantity!: Asset
        @Struct.field('string')
        memo!: string
    }
    @Struct.type('open')
    export class open extends Struct {
        @Struct.field(Name)
        owner!: Name
        @Struct.field(Asset.Symbol)
        symbol!: Asset.Symbol
        @Struct.field(Name)
        ram_payer!: Name
    }
    @Struct.type('retire')
    export class retire extends Struct {
        @Struct.field(Asset)
        quantity!: Asset
        @Struct.field('string')
        memo!: string
    }
    @Struct.type('transfer')
    export class transfer extends Struct {
        @Struct.field(Name)
        from!: Name
        @Struct.field(Name)
        to!: Name
        @Struct.field(Asset)
        quantity!: Asset
        @Struct.field('string')
        memo!: string
    }
}
export const TableMap = {
    accounts: Types.account,
    stat: Types.currency_stats,
}
export interface TableTypes {
    accounts: Types.account
    stat: Types.currency_stats
}
export type RowType<T> = T extends keyof TableTypes ? TableTypes[T] : any
export type ActionNames = keyof ActionNameParams
export type TableNames = keyof TableTypes
