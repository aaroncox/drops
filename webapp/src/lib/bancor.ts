import type { Asset, Int64 } from '@wharfkit/session';

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
