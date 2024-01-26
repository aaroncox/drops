import { type Writable, writable, derived, type Readable, readable, get } from 'svelte/store';
import { oracleContract, dropsContract } from './wharf';
import type { Checksum256, UInt64 } from '@wharfkit/session';

export const epochNumber: Writable<UInt64> = writable();
export const epochEnd: Writable<Date> = writable();
export const epochEnded: Readable<boolean> = derived(epochEnd, ($epochEnd) => {
	return new Date() > $epochEnd;
});
export const epochWaitingAdvance: Writable<boolean> = writable(true);

export const epochRemaining = readable(epochEnd, function start(set) {
	const interval = setInterval(() => {
		let r = Math.round((get(epochEnd) - new Date()) / 1000);
		r = Math.max(r, 0);
		if (r <= 0) {
			epochWaitingAdvance.set(true);
			lastEpochRevealed.set(false);
			lastEpochDrop.set(undefined);
			loadEpoch();
		}
		set(r);
	}, 1000);

	return function stop() {
		clearInterval(interval);
	};
});

export const epochRemainingHours: Readable<number | undefined> = derived(
	epochRemaining,
	($epochRemaining) => {
		if ($epochRemaining !== undefined) {
			return Math.floor($epochRemaining / 3600);
		}
	}
);

export const epochRemainingMinutes: Readable<number | undefined> = derived(
	[epochRemaining, epochRemainingHours],
	([$epochRemaining, $epochRemainingHours]) => {
		if ($epochRemaining !== undefined) {
			return Math.floor(($epochRemaining - $epochRemainingHours * 3600) / 60);
		}
	}
);

export const epochRemainingSeconds: Readable<number | undefined> = derived(
	[epochRemaining, epochRemainingHours, epochRemainingMinutes],
	([$epochRemaining, $epochRemainingHours, $epochRemainingMinutes]) => {
		if ($epochRemaining !== undefined) {
			return $epochRemaining - $epochRemainingHours * 3600 - $epochRemainingMinutes * 60;
		}
	}
);

export function formatClockValue(value: number) {
	if (isNaN(value)) {
		return '--';
	}
	if (value < 10) {
		return `0${value}`;
	}
	return value.toString();
}

export async function loadEpoch() {
	const state = await dropsContract.table('state').get();
	if (state && !state.epoch.equals(get(epochNumber))) {
		epochNumber.set(state.epoch);
		const epoch = await dropsContract.table('epoch').get(state.epoch);
		if (epoch) {
			epochEnd.set(new Date(epoch.end.toMilliseconds()));
			epochWaitingAdvance.set(false);
		}
	}
}

export const lastEpoch: Readable<UInt64 | undefined> = derived(epochNumber, ($epochNumber) => {
	if ($epochNumber) {
		return $epochNumber.subtracting(1);
	}
});

export const lastEpochRevealed: Writable<boolean> = writable(false);

lastEpochRevealed.subscribe((revealed: boolean) => {
	if (!revealed) {
		const interval = setInterval(() => {
			if (!get(epochWaitingAdvance)) {
				oracleContract
					.table('epoch')
					.get(get(lastEpoch))
					.then((epoch) => {
						if (epoch?.completed.equals(1)) {
							lastEpochDrop.set(epoch.drops);
							lastEpochRevealed.set(true);
							clearInterval(interval);
						} else {
							lastEpochRevealed.set(false);
						}
					});
			}
		}, 1000);
	}
});

export const lastEpochRevealer = readable(lastEpochRevealed, function start(set) {
	const interval = setInterval(() => {
		if (!lastEpochRevealed) {
			oracleContract
				.table('epoch')
				.get(get(lastEpoch))
				.then((epoch) => {
					if (epoch?.completed.equals(1)) {
						lastEpochDrop.set(epoch.drops);
						set(true);
					} else {
						set(false);
					}
				});
		}
	}, 1000);

	return function stop() {
		clearInterval(interval);
	};
});

export const lastEpochDrop: Writable<Checksum256 | undefined> = writable();
