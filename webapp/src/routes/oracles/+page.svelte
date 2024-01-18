<script lang="ts">
	import { t } from '$lib/i18n';
	import { DropsContract, dropsContract } from '$lib/wharf';
	import type { Name, UInt64 } from '@wharfkit/session';
	import { onDestroy, onMount } from 'svelte';
	import { type Writable, writable, derived, type Readable } from 'svelte/store';

	let loadInterval;
	onMount(() => {
		loadData();
		loadInterval = setInterval(loadData, 5000);
	});

	onDestroy(() => {
		clearInterval(loadInterval);
	});

	function loadData() {
		loadEpochs();
		loadCommits();
		loadReveals();
		loadEpochSeeds();
	}

	const epochs: Writable<DropsContract.Types.epoch_row[]> = writable();
	async function loadEpochs() {
		const rows = await dropsContract.table('epochs').all();
		if (rows.length == 0) {
			epochs.set([]);
			return;
		}
		epochs.set(rows);
	}

	const epochseeds: Writable<DropsContract.Types.epochseed_row[]> = writable();
	async function loadEpochSeeds() {
		const rows = await dropsContract.table('epochseed').all();
		if (rows.length == 0) {
			epochseeds.set([]);
			return;
		}
		epochseeds.set(rows);
	}

	const commits: Writable<DropsContract.Types.commit_row[]> = writable();
	async function loadCommits() {
		const rows = await dropsContract.table('commits').all();
		if (rows.length == 0) {
			commits.set([]);
			return;
		}
		commits.set(rows);
	}

	const reveals: Writable<DropsContract.Types.reveal_row[]> = writable();
	async function loadReveals() {
		const rows = await dropsContract.table('reveals').all();
		if (rows.length == 0) {
			reveals.set([]);
			return;
		}
		reveals.set(rows);
	}

	interface OracleState {
		oracle: Name;
		commit: string;
		reveal: string;
	}

	interface EpochState {
		epoch: UInt64;
		oracles: OracleState[];
		seed?: string;
	}

	const allOracles: Writable<Name[]> = writable();

	const revealSchedule: Readable<EpochState[]> = derived(
		[epochs, commits, reveals, epochseeds],
		([$epochs, $commits, $reveals, $epochseeds]) => {
			if ($epochs && $commits && $reveals && $epochseeds) {
				const oraclesFound = new Set<Name>();
				allOracles.set([]);
				const schedule = $epochs
					.map((e) => {
						const oracles: OracleState[] = [];
						e.oracles.forEach((o) => {
							const commit = $commits.find((c) => c.oracle.equals(o) && c.epoch.equals(e.epoch));
							const reveal = $reveals.find((r) => r.oracle.equals(o) && r.epoch.equals(e.epoch));
							oraclesFound.add(String(o));
							oracles.push({
								oracle: o,
								commit: commit ? String(commit.commit) : '',
								reveal: reveal ? reveal.reveal : ''
							});
						});
						// Sort by name
						oracles.sort((a, b) => String(a.oracle).localeCompare(b.oracle.value));
						// Find the epochseed for completed epochs
						const epochseed = $epochseeds.find((s) => s.epoch.equals(e.epoch));
						return {
							epoch: e.epoch,
							oracles,
							seed: epochseed ? String(epochseed.seed) : ''
						};
					})
					.sort((a, b) => Number(b.epoch) - Number(a.epoch));

				// Update the array of all oracles participating
				const oracleNames = Array.from(oraclesFound);
				console.log(oracleNames);
				allOracles.set(oracleNames);

				return schedule;
			}
			return [];
		}
	);
</script>

<div class="p-8 space-y-4">
	<div class="h2">Oracles</div>
	<p>
		Oracles are responsible for seeding random data using a commit/reveal strategy in order to seed
		the final epoch values.
	</p>
	{#if $epochs && $epochs.length && $allOracles}
		<div class="table-container">
			<table class="table">
				<thead>
					<tr>
						<th class="text-center">
							Epoch
							<div class="text-xs text-slate-400">Number</div>
						</th>
						<th class="text-center">
							Seed
							<div class="text-xs text-slate-400">From Oracles</div>
						</th>
						{#each $allOracles as oracle}
							<th class="text-center lowercase">
								<span class="text-xs">{oracle}</span>
								<div class="text-xs text-slate-400">Oracle</div>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each $revealSchedule as epoch}
						<tr>
							<td class="text-center">{epoch.epoch}</td>
							<td class="text-center">
								<pre class="text-xs">{epoch.seed}</pre>
							</td>
							{#each $allOracles as oracle}
								{@const record = epoch.oracles.find((o) => o.oracle.equals(oracle))}
								<td class="text-center">
									{#if record}
										{#if record.reveal}
											<span class="text-green-500">Revealed</span>
										{:else if record.commit}
											<span class="text-yellow-500">Committed</span>
										{:else}
											<span class="text-red-500">Waiting...</span>
										{/if}
									{:else}
										<span class="text-slate-500">n/a</span>
									{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style lang="postcss">
</style>
