import { type Writable, writable, derived, type Readable } from 'svelte/store';
import { dropsContract } from './wharf';

export const epochNumber: Writable<number> = writable();
export const epochEnd: Writable<Date> = writable();
export const epochEnded: Readable<boolean> = derived(epochEnd, ($epochEnd) => {
	return new Date() > $epochEnd;
});

export async function loadEpoch() {
	const state = await dropsContract.table('state').get();
	if (state) {
		epochNumber.set(Number(state.epoch));
		const epoch = await dropsContract.table('epochs').get(state.epoch);
		if (epoch) {
			epochEnd.set(new Date(epoch.end.toMilliseconds()));
		}
	}
}
