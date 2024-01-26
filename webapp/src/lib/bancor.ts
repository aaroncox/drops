import type { Asset, Int64 } from '@wharfkit/session';
import { systemContract } from './wharf';

export function get_bancor_input(out_reserve: Asset, inp_reserve: Asset, out: number): Int64 {
	const ob = out_reserve.units;
	const ib = inp_reserve.units;
	return ib.multiplying(out).dividing(ob.subtracting(out));
}

export function get_bancor_output(inp_reserve: Asset, out_reserve: Asset, inp: number): Int64 {
	const ib = inp_reserve.units;
	const ob = out_reserve.units;
	return ob.multiplying(inp).dividing(ib.adding(inp));
}

export async function getRamPrice(): Promise<number | undefined> {
	const results = await systemContract.table('rammarket').get();
	if (results) {
		const { base, quote } = results;
		const bytes = 10000;
		const cost = get_bancor_input(base.balance, quote.balance, bytes);
		const cost_plus_fee = Number(cost) / 0.995;
		return cost_plus_fee / 10000;
	}
}

export async function getRamPriceMinusFee(): Promise<number | undefined> {
	const results = await systemContract.table('rammarket').get();
	if (results) {
		const { base, quote } = results;
		const bytes = 10000;
		const cost = get_bancor_input(base.balance, quote.balance, bytes);
		const cost_plus_fee = Number(cost) * 0.995;
		return cost_plus_fee / 10000;
	}
}
