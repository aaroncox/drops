import type { Action, Checksum256Type, NameType, UInt64Type } from '@wharfkit/antelope';
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
	UInt64
} from '@wharfkit/antelope';
import type { ActionOptions, ContractArgs, PartialBy, Table } from '@wharfkit/contract';
import { Contract as BaseContract } from '@wharfkit/contract';
export const abiBlob = Blob.from(
	'DmVvc2lvOjphYmkvMS4yAB4MYXBpX3Jlc3BvbnNlAAEDZm9vBnVpbnQ2NAdjYWxsYXBpAAALYWNjb3VudF9yb3cAAgdhY2NvdW50BG5hbWUFc2VlZHMGdWludDMyCWFkZG9yYWNsZQABBm9yYWNsZQRuYW1lB2FkdmFuY2UAAAZjb21taXQAAwZvcmFjbGUEbmFtZQVlcG9jaAZ1aW50NjQGY29tbWl0C2NoZWNrc3VtMjU2CmNvbW1pdF9yb3cABAJpZAZ1aW50NjQFZXBvY2gGdWludDY0Bm9yYWNsZQRuYW1lBmNvbW1pdAtjaGVja3N1bTI1Ngxjb21wdXRlZXBvY2gAAQVlcG9jaAZ1aW50NjQLY29tcHV0ZXNlZWQAAgVlcG9jaAZ1aW50NjQEc2VlZAZ1aW50NjQHZGVzdHJveQADBW93bmVyBG5hbWUIc2VlZF9pZHMIdWludDY0W10EbWVtbwZzdHJpbmcUZGVzdHJveV9yZXR1cm5fdmFsdWUAAghyYW1fc29sZAZ1aW50NjQIcmVkZWVtZWQFYXNzZXQKZGVzdHJveWFsbAAABmVuYWJsZQABB2VuYWJsZWQEYm9vbAZlbnJvbGwAAgdhY2NvdW50BG5hbWUFZXBvY2gGdWludDY0CWVwb2NoX3JvdwAFBWVwb2NoBnVpbnQ2NAVzdGFydAp0aW1lX3BvaW50A2VuZAp0aW1lX3BvaW50B29yYWNsZXMGbmFtZVtdCWNvbXBsZXRlZAZ1aW50NjQNZXBvY2hzZWVkX3JvdwACBWVwb2NoBnVpbnQ2NARzZWVkC2NoZWNrc3VtMjU2DGZpbmlzaHJldmVhbAABBWVwb2NoBnVpbnQ2NBVnZW5lcmF0ZV9yZXR1cm5fdmFsdWUABgVzZWVkcwZ1aW50MzIFZXBvY2gGdWludDY0BGNvc3QFYXNzZXQGcmVmdW5kBWFzc2V0C3RvdGFsX3NlZWRzBnVpbnQ2NAtlcG9jaF9zZWVkcwZ1aW50NjQMZ2VuZXJhdGVydHJuAAAEaW5pdAAACm9yYWNsZV9yb3cAAQZvcmFjbGUEbmFtZQxyZW1vdmVvcmFjbGUAAQZvcmFjbGUEbmFtZQZyZXZlYWwAAwZvcmFjbGUEbmFtZQVlcG9jaAZ1aW50NjQGcmV2ZWFsBnN0cmluZwpyZXZlYWxfcm93AAQCaWQGdWludDY0BWVwb2NoBnVpbnQ2NAZvcmFjbGUEbmFtZQZyZXZlYWwGc3RyaW5nCHNlZWRfcm93AAMEc2VlZAZ1aW50NjQFb3duZXIEbmFtZQVlcG9jaAZ1aW50NjQIc3RhdF9yb3cABAJpZAZ1aW50NjQHYWNjb3VudARuYW1lBWVwb2NoBnVpbnQ2NAVzZWVkcwZ1aW50MzIJc3RhdGVfcm93AAMCaWQGdWludDE2BWVwb2NoBnVpbnQ2NAdlbmFibGVkBGJvb2wIdHJhbnNmZXIABARmcm9tBG5hbWUCdG8EbmFtZQhzZWVkX2lkcwh1aW50NjRbXQRtZW1vBnN0cmluZwR3aXBlAAAId2lwZXNvbWUAABIAAADAVROjQQdjYWxsYXBpAAAAUBGZS1MyCWFkZG9yYWNsZQAAAABAoWl2MgdhZHZhbmNlAAAAAABkJyVFBmNvbW1pdADQEK1KZV0lRQxjb21wdXRlZXBvY2gAAJJSWGVdJUULY29tcHV0ZXNlZWQAAAAAwNObsUoHZGVzdHJveQAAQIzG05uxSgpkZXN0cm95YWxsAAAAAACoeMxUBmVuYWJsZQAAAAAAxEjvVAZlbnJvbGwAEI3a6jbsplsMZmluaXNocmV2ZWFsADBvviqbq6ZiDGdlbmVyYXRlcnRybgAAAAAAAJDddARpbml0AKAiMpeqTaW6DHJlbW92ZW9yYWNsZQAAAAAARKO2ugZyZXZlYWwAAAAAVy08zc0IdHJhbnNmZXIAAAAAAACgquMEd2lwZQAAAABKUqyq4wh3aXBlc29tZQAJAAAAOE9NETIDaTY0AAALYWNjb3VudF9yb3cAAAAAZyclRQNpNjQAAApjb21taXRfcm93AAAAAOCGaFUDaTY0AAAJZXBvY2hfcm93AABISuGGaFUDaTY0AAANZXBvY2hzZWVkX3JvdwAAAACriMylA2k2NAAACm9yYWNsZV9yb3cAAAAAR6O2ugNpNjQAAApyZXZlYWxfcm93AAAAAACclMIDaTY0AAAIc2VlZF9yb3cAAAAAAJVNxgNpNjQAAAlzdGF0ZV9yb3cAAAAAAJxNxgNpNjQAAAhzdGF0X3JvdwAAAAAGAAAAwFUTo0EMYXBpX3Jlc3BvbnNlAAAAQKFpdjIJZXBvY2hfcm930BCtSmVdJUULY2hlY2tzdW0yNTYAklJYZV0lRQtjaGVja3N1bTI1NgAAAMDTm7FKFGRlc3Ryb3lfcmV0dXJuX3ZhbHVlMG++KpurpmIVZ2VuZXJhdGVfcmV0dXJuX3ZhbHVl'
);
export const abi = ABI.from(abiBlob);
export class Contract extends BaseContract {
	constructor(args: PartialBy<ContractArgs, 'abi' | 'account'>) {
		super({
			client: args.client,
			abi: abi,
			account: args.account || Name.from('testing.gm')
		});
	}
	action<T extends ActionNames>(
		name: T,
		data: ActionNameParams[T],
		options?: ActionOptions
	): Action {
		return super.action(name, data, options);
	}
	readonly<T extends ActionReturnNames>(
		name: T,
		data?: ActionNameParams[T]
	): ActionReturnValues[T] {
		return super.readonly(name, data) as unknown as ActionReturnValues[T];
	}
	table<T extends TableNames>(name: T, scope?: NameType): Table<RowType<T>> {
		return super.table(name, scope, TableMap[name]);
	}
}
export interface ActionNameParams {
	callapi: ActionParams.callapi;
	addoracle: ActionParams.addoracle;
	advance: ActionParams.advance;
	commit: ActionParams.commit;
	computeepoch: ActionParams.computeepoch;
	computedrops: ActionParams.computedrops;
	destroy: ActionParams.destroy;
	destroyall: ActionParams.destroyall;
	enable: ActionParams.enable;
	enroll: ActionParams.enroll;
	finishreveal: ActionParams.finishreveal;
	generatertrn: ActionParams.generatertrn;
	init: ActionParams.init;
	removeoracle: ActionParams.removeoracle;
	reveal: ActionParams.reveal;
	transfer: ActionParams.transfer;
	wipe: ActionParams.wipe;
	wipesome: ActionParams.wipesome;
}
export namespace ActionParams {
	export namespace Type {}
	export interface callapi {}
	export interface addoracle {
		oracle: NameType;
	}
	export interface advance {}
	export interface commit {
		oracle: NameType;
		epoch: UInt64Type;
		commit: Checksum256Type;
	}
	export interface computeepoch {
		epoch: UInt64Type;
	}
	export interface computedrops {
		epoch: UInt64Type;
		drops: UInt64Type;
	}
	export interface destroy {
		owner: NameType;
		drops_ids: UInt64Type[];
		memo: string;
	}
	export interface destroyall {}
	export interface enable {
		enabled: boolean;
	}
	export interface enroll {
		account: NameType;
		epoch: UInt64Type;
	}
	export interface finishreveal {
		epoch: UInt64Type;
	}
	export interface generatertrn {}
	export interface init {}
	export interface removeoracle {
		oracle: NameType;
	}
	export interface reveal {
		oracle: NameType;
		epoch: UInt64Type;
		reveal: string;
	}
	export interface transfer {
		from: NameType;
		to: NameType;
		drops_ids: UInt64Type[];
		memo: string;
	}
	export interface wipe {}
	export interface wipesome {}
}
export namespace Types {
	@Struct.type('api_response')
	export class api_response extends Struct {
		@Struct.field(UInt64)
		foo!: UInt64;
	}
	@Struct.type('callapi')
	export class callapi extends Struct {}
	@Struct.type('account_row')
	export class account_row extends Struct {
		@Struct.field(Name)
		account!: Name;
		@Struct.field(UInt32)
		drops!: UInt32;
	}
	@Struct.type('addoracle')
	export class addoracle extends Struct {
		@Struct.field(Name)
		oracle!: Name;
	}
	@Struct.type('advance')
	export class advance extends Struct {}
	@Struct.type('commit')
	export class commit extends Struct {
		@Struct.field(Name)
		oracle!: Name;
		@Struct.field(UInt64)
		epoch!: UInt64;
		@Struct.field(Checksum256)
		commit!: Checksum256;
	}
	@Struct.type('commit_row')
	export class commit_row extends Struct {
		@Struct.field(UInt64)
		id!: UInt64;
		@Struct.field(UInt64)
		epoch!: UInt64;
		@Struct.field(Name)
		oracle!: Name;
		@Struct.field(Checksum256)
		commit!: Checksum256;
	}
	@Struct.type('computeepoch')
	export class computeepoch extends Struct {
		@Struct.field(UInt64)
		epoch!: UInt64;
	}
	@Struct.type('computedrops')
	export class computedrops extends Struct {
		@Struct.field(UInt64)
		epoch!: UInt64;
		@Struct.field(UInt64)
		drops!: UInt64;
	}
	@Struct.type('destroy')
	export class destroy extends Struct {
		@Struct.field(Name)
		owner!: Name;
		@Struct.field(UInt64, { array: true })
		drops_ids!: UInt64[];
		@Struct.field('string')
		memo!: string;
	}
	@Struct.type('destroy_return_value')
	export class destroy_return_value extends Struct {
		@Struct.field(UInt64)
		ram_sold!: UInt64;
		@Struct.field(Asset)
		redeemed!: Asset;
	}
	@Struct.type('destroyall')
	export class destroyall extends Struct {}
	@Struct.type('enable')
	export class enable extends Struct {
		@Struct.field('bool')
		enabled!: boolean;
	}
	@Struct.type('enroll')
	export class enroll extends Struct {
		@Struct.field(Name)
		account!: Name;
		@Struct.field(UInt64)
		epoch!: UInt64;
	}
	@Struct.type('epoch_row')
	export class epoch_row extends Struct {
		@Struct.field(UInt64)
		epoch!: UInt64;
		@Struct.field(TimePoint)
		start!: TimePoint;
		@Struct.field(TimePoint)
		end!: TimePoint;
		@Struct.field(Name, { array: true })
		oracles!: Name[];
		@Struct.field(UInt64)
		completed!: UInt64;
	}
	@Struct.type('epochdrop_row')
	export class epochdrop_row extends Struct {
		@Struct.field(UInt64)
		epoch!: UInt64;
		@Struct.field(Checksum256)
		drops!: Checksum256;
	}
	@Struct.type('finishreveal')
	export class finishreveal extends Struct {
		@Struct.field(UInt64)
		epoch!: UInt64;
	}
	@Struct.type('generate_return_value')
	export class generate_return_value extends Struct {
		@Struct.field(UInt32)
		drops!: UInt32;
		@Struct.field(UInt64)
		epoch!: UInt64;
		@Struct.field(Asset)
		cost!: Asset;
		@Struct.field(Asset)
		refund!: Asset;
		@Struct.field(UInt64)
		total_drops!: UInt64;
		@Struct.field(UInt64)
		epoch_drops!: UInt64;
	}
	@Struct.type('generatertrn')
	export class generatertrn extends Struct {}
	@Struct.type('init')
	export class init extends Struct {}
	@Struct.type('oracle_row')
	export class oracle_row extends Struct {
		@Struct.field(Name)
		oracle!: Name;
	}
	@Struct.type('removeoracle')
	export class removeoracle extends Struct {
		@Struct.field(Name)
		oracle!: Name;
	}
	@Struct.type('reveal')
	export class reveal extends Struct {
		@Struct.field(Name)
		oracle!: Name;
		@Struct.field(UInt64)
		epoch!: UInt64;
		@Struct.field('string')
		reveal!: string;
	}
	@Struct.type('reveal_row')
	export class reveal_row extends Struct {
		@Struct.field(UInt64)
		id!: UInt64;
		@Struct.field(UInt64)
		epoch!: UInt64;
		@Struct.field(Name)
		oracle!: Name;
		@Struct.field('string')
		reveal!: string;
	}
	@Struct.type('drop_row')
	export class drop_row extends Struct {
		@Struct.field(UInt64)
		drops!: UInt64;
		@Struct.field(Name)
		owner!: Name;
		@Struct.field(UInt64)
		epoch!: UInt64;
	}
	@Struct.type('stat_row')
	export class stat_row extends Struct {
		@Struct.field(UInt64)
		id!: UInt64;
		@Struct.field(Name)
		account!: Name;
		@Struct.field(UInt64)
		epoch!: UInt64;
		@Struct.field(UInt32)
		drops!: UInt32;
	}
	@Struct.type('state_row')
	export class state_row extends Struct {
		@Struct.field(UInt16)
		id!: UInt16;
		@Struct.field(UInt64)
		epoch!: UInt64;
		@Struct.field('bool')
		enabled!: boolean;
	}
	@Struct.type('transfer')
	export class transfer extends Struct {
		@Struct.field(Name)
		from!: Name;
		@Struct.field(Name)
		to!: Name;
		@Struct.field(UInt64, { array: true })
		drops_ids!: UInt64[];
		@Struct.field('string')
		memo!: string;
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
	epochdrops: Types.epochdrop_row,
	oracles: Types.oracle_row,
	reveals: Types.reveal_row,
	drops: Types.drop_row,
	state: Types.state_row,
	stats: Types.stat_row
};
export interface TableTypes {
	accounts: Types.account_row;
	commits: Types.commit_row;
	epochs: Types.epoch_row;
	epochdrops: Types.epochdrop_row;
	oracles: Types.oracle_row;
	reveals: Types.reveal_row;
	drops: Types.drop_row;
	state: Types.state_row;
	stats: Types.stat_row;
}
export type RowType<T> = T extends keyof TableTypes ? TableTypes[T] : any;
export type ActionNames = keyof ActionNameParams;
export type TableNames = keyof TableTypes;
export interface ActionReturnValues {
	callapi: Types.api_response;
	advance: Types.epoch_row;
	computeepoch: Checksum256;
	computedrops: Checksum256;
	destroy: Types.destroy_return_value;
	generatertrn: Types.generate_return_value;
}
export type ActionReturnNames = keyof ActionReturnValues;
