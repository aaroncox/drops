import type { Action, Checksum256Type, NameType, UInt64Type } from '@wharfkit/antelope';
import { ABI, Blob, Checksum256, Name, Struct, UInt64 } from '@wharfkit/antelope';
import type { ActionOptions, ContractArgs, PartialBy, Table } from '@wharfkit/contract';
import { Contract as BaseContract } from '@wharfkit/contract';
export const abiBlob = Blob.from(
	'DmVvc2lvOjphYmkvMS4yABIJYWRkb3JhY2xlAAEGb3JhY2xlBG5hbWUHYWR2YW5jZQAADGNtcGxhc3RlcG9jaAACBHNlZWQGdWludDY0CGNvbnRyYWN0BG5hbWUGY29tbWl0AAMGb3JhY2xlBG5hbWUFZXBvY2gGdWludDY0BmNvbW1pdAtjaGVja3N1bTI1Ngpjb21taXRfcm93AAQCaWQGdWludDY0BWVwb2NoBnVpbnQ2NAZvcmFjbGUEbmFtZQZjb21taXQLY2hlY2tzdW0yNTYMY29tcHV0ZWVwb2NoAAEFZXBvY2gGdWludDY0C2NvbXB1dGVzZWVkAAIFZXBvY2gGdWludDY0BHNlZWQGdWludDY0CWVwb2NoX3JvdwAEBWVwb2NoBnVpbnQ2NAdvcmFjbGVzBm5hbWVbXQljb21wbGV0ZWQGdWludDY0BHNlZWQLY2hlY2tzdW0yNTYMZmluaXNocmV2ZWFsAAEFZXBvY2gGdWludDY0BGluaXQAAApvcmFjbGVfcm93AAEGb3JhY2xlBG5hbWUMcmVtb3Zlb3JhY2xlAAEGb3JhY2xlBG5hbWUGcmV2ZWFsAAMGb3JhY2xlBG5hbWUFZXBvY2gGdWludDY0BnJldmVhbAZzdHJpbmcKcmV2ZWFsX3JvdwAEAmlkBnVpbnQ2NAVlcG9jaAZ1aW50NjQGb3JhY2xlBG5hbWUGcmV2ZWFsBnN0cmluZwlzdWJzY3JpYmUAAQpzdWJzY3JpYmVyBG5hbWUOc3Vic2NyaWJlcl9yb3cAAQpzdWJzY3JpYmVyBG5hbWULdW5zdWJzY3JpYmUAAQpzdWJzY3JpYmVyBG5hbWUEd2lwZQAADQAAUBGZS1MyCWFkZG9yYWNsZQAAAABAoWl2MgdhZHZhbmNlANAQrSpjE6tEDGNtcGxhc3RlcG9jaAAAAAAAZCclRQZjb21taXQA0BCtSmVdJUUMY29tcHV0ZWVwb2NoAACSUlhlXSVFC2NvbXB1dGVzZWVkABCN2uo27KZbDGZpbmlzaHJldmVhbAAAAAAAAJDddARpbml0AKAiMpeqTaW6DHJlbW92ZW9yYWNsZQAAAAAARKO2ugZyZXZlYWwAAABQx12Ej8YJc3Vic2NyaWJlAADUcRfho/HUC3Vuc3Vic2NyaWJlAAAAAAAAoKrjBHdpcGUABQAAAABkJyVFA2k2NAAACmNvbW1pdF9yb3cAAAAAgIZoVQNpNjQAAAllcG9jaF9yb3cAAAAAqIjMpQNpNjQAAApvcmFjbGVfcm93AAAAAESjtroDaTY0AAAKcmV2ZWFsX3JvdwDAVcddhI/GA2k2NAAADnN1YnNjcmliZXJfcm93AAAAAAQAAABAoWl2MgllcG9jaF9yb3fQEK0qYxOrRAtjaGVja3N1bTI1NtAQrUplXSVFC2NoZWNrc3VtMjU2AJJSWGVdJUULY2hlY2tzdW0yNTY='
);
export const abi = ABI.from(abiBlob);
export class Contract extends BaseContract {
	constructor(args: PartialBy<ContractArgs, 'abi' | 'account'>) {
		super({
			client: args.client,
			abi: abi,
			account: args.account || Name.from('oracle.gm')
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
	addoracle: ActionParams.addoracle;
	advance: ActionParams.advance;
	cmplastepoch: ActionParams.cmplastepoch;
	commit: ActionParams.commit;
	computeepoch: ActionParams.computeepoch;
	computedrops: ActionParams.computedrops;
	finishreveal: ActionParams.finishreveal;
	init: ActionParams.init;
	removeoracle: ActionParams.removeoracle;
	reveal: ActionParams.reveal;
	subscribe: ActionParams.subscribe;
	unsubscribe: ActionParams.unsubscribe;
	wipe: ActionParams.wipe;
}
export namespace ActionParams {
	export namespace Type {}
	export interface addoracle {
		oracle: NameType;
	}
	export interface advance {}
	export interface cmplastepoch {
		drops: UInt64Type;
		contract: NameType;
	}
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
	export interface finishreveal {
		epoch: UInt64Type;
	}
	export interface init {}
	export interface removeoracle {
		oracle: NameType;
	}
	export interface reveal {
		oracle: NameType;
		epoch: UInt64Type;
		reveal: string;
	}
	export interface subscribe {
		subscriber: NameType;
	}
	export interface unsubscribe {
		subscriber: NameType;
	}
	export interface wipe {}
}
export namespace Types {
	@Struct.type('addoracle')
	export class addoracle extends Struct {
		@Struct.field(Name)
		oracle!: Name;
	}
	@Struct.type('advance')
	export class advance extends Struct {}
	@Struct.type('cmplastepoch')
	export class cmplastepoch extends Struct {
		@Struct.field(UInt64)
		drops!: UInt64;
		@Struct.field(Name)
		contract!: Name;
	}
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
	@Struct.type('epoch_row')
	export class epoch_row extends Struct {
		@Struct.field(UInt64)
		epoch!: UInt64;
		@Struct.field(Name, { array: true })
		oracles!: Name[];
		@Struct.field(UInt64)
		completed!: UInt64;
		@Struct.field(Checksum256)
		drops!: Checksum256;
	}
	@Struct.type('finishreveal')
	export class finishreveal extends Struct {
		@Struct.field(UInt64)
		epoch!: UInt64;
	}
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
	@Struct.type('subscribe')
	export class subscribe extends Struct {
		@Struct.field(Name)
		subscriber!: Name;
	}
	@Struct.type('subscriber_row')
	export class subscriber_row extends Struct {
		@Struct.field(Name)
		subscriber!: Name;
	}
	@Struct.type('unsubscribe')
	export class unsubscribe extends Struct {
		@Struct.field(Name)
		subscriber!: Name;
	}
	@Struct.type('wipe')
	export class wipe extends Struct {}
}
export const TableMap = {
	commit: Types.commit_row,
	epoch: Types.epoch_row,
	oracle: Types.oracle_row,
	reveal: Types.reveal_row,
	subscriber: Types.subscriber_row
};
export interface TableTypes {
	commit: Types.commit_row;
	epoch: Types.epoch_row;
	oracle: Types.oracle_row;
	reveal: Types.reveal_row;
	subscriber: Types.subscriber_row;
}
export type RowType<T> = T extends keyof TableTypes ? TableTypes[T] : any;
export type ActionNames = keyof ActionNameParams;
export type TableNames = keyof TableTypes;
export interface ActionReturnValues {
	advance: Types.epoch_row;
	cmplastepoch: Checksum256;
	computeepoch: Checksum256;
	computedrops: Checksum256;
}
export type ActionReturnNames = keyof ActionReturnValues;
