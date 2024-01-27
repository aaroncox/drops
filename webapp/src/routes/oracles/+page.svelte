<script lang="ts">
	import { t } from '$lib/i18n';
	import { OracleContract, oracleContract } from '$lib/wharf';
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
	}

	const epochs: Writable<OracleContract.Types.epoch_row[]> = writable();
	async function loadEpochs() {
		const rows = await oracleContract.table('epoch').all();
		if (rows.length == 0) {
			epochs.set([]);
			return;
		}
		epochs.set(rows);
	}

	const commits: Writable<OracleContract.Types.commit_row[]> = writable();
	async function loadCommits() {
		const rows = await oracleContract.table('commit').all();
		if (rows.length == 0) {
			commits.set([]);
			return;
		}
		commits.set(rows);
	}

	const reveals: Writable<OracleContract.Types.reveal_row[]> = writable();
	async function loadReveals() {
		const rows = await oracleContract.table('reveal').all();
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
		drops?: string;
	}

	const allOracles: Writable<Name[]> = writable();

	const revealSchedule: Readable<EpochState[]> = derived(
		[epochs, commits, reveals],
		([$epochs, $commits, $reveals]) => {
			if ($epochs && $commits && $reveals) {
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
						// Find the epochdrops for completed epochs
						return {
							epoch: e.epoch,
							oracles,
							drops: e.drops ? String(e.drops) : ''
						};
					})
					.sort((a, b) => Number(b.epoch) - Number(a.epoch));

				// Update the array of all oracles participating
				const oracleNames = Array.from(oraclesFound);
				allOracles.set(oracleNames);

				return schedule;
			}
			return [];
		}
	);
</script>

<div class="p-8 space-y-4">
	<div class="h2">{$t('common.oracles')}</div>
	<p>
		{$t('common.oraclesdescription')}
	</p>
	{#if $epochs && $epochs.length && $allOracles}
		<div class="table-container">
			<table class="table">
				<thead>
					<tr>
						<th class="text-center">
							{$t('common.epoch')}
							<div class="text-xs text-slate-400">{$t('common.number')}</div>
						</th>
						<th class="text-center">
							{$t('common.itemname')}
							<div class="text-xs text-slate-400">{$t('common.fromoracles')}</div>
						</th>
						{#each $allOracles as oracle}
							<th class="text-center lowercase">
								<span class="text-xs">{oracle}</span>
								<div class="text-xs text-slate-400">{$t('common.oracle')}</div>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each $revealSchedule as epoch}
						<tr>
							<td class="text-center">{epoch.epoch}</td>
							<td class="text-center">
								<pre class="text-xs">{epoch.drops}</pre>
							</td>
							{#each $allOracles as oracle}
								{@const record = epoch.oracles.find((o) => o.oracle.equals(oracle))}
								<td class="text-center">
									{#if record}
										{#if record.reveal}
											<span class="text-green-500">{$t('common.oraclerevealed')}</span>
										{:else if record.commit}
											<span class="text-yellow-500">{$t('common.oraclecommitted')}</span>
										{:else}
											<span class="text-red-500">{$t('common.oraclewaiting')}</span>
										{/if}
									{:else}
										<span class="text-slate-500">{$t('common.oraclena')}</span>
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
