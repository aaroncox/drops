<script lang="ts">
	import { t } from '$lib/i18n';
	import { sizeSeedRow } from '$lib/constants';
	import { DropsContract, dropsContract, session } from '$lib/wharf';
	import type { Readable } from 'svelte/motion';
	import { derived, writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { getRamPrice } from '$lib/bancor';
	import { Asset } from '@wharfkit/session';

	let ramLoader: ReturnType<typeof setInterval>;

	const ramPrice = writable(0);
	const seedPrice = writable(0);
	const totalSeeds = writable(0);
	const totalRam = derived(totalSeeds, ($totalRam) => {
		return (($totalRam * sizeSeedRow) / 1024).toLocaleString(undefined, {
			minimumFractionDigits: 3,
			maximumFractionDigits: 3
		});
	});
	const tvl = derived([totalSeeds, seedPrice], ([$seeds, $price]) => {
		if ($price && $seeds) {
			return Number($price) * Number($seeds);
		}
		return 0;
	});

	onMount(async () => {
		loadRamPrice();
		ramLoader = setInterval(loadRamPrice, 2000);
	});

	async function loadRamPrice() {
		const cost_plus_fee = await getRamPrice();
		if (cost_plus_fee) {
			ramPrice.set(Number(cost_plus_fee));
			seedPrice.set(Number(cost_plus_fee) * sizeSeedRow);
		}
	}

	const stats: Readable<DropsContract.Types.account_row[]> = derived(
		[ramPrice],
		([$ramPrice], set) => {
			dropsContract
				.table('accounts')
				.all()
				.then((results) => {
					results.sort((a, b) => {
						return Number(b.seeds) - Number(a.seeds);
					});
					totalSeeds.set(results.reduce((t, result) => t + Number(result.seeds), 0));
					set(results);
				});
			set([]);
		}
	);
</script>

<div class="p-8 space-y-8">
	<div class="h2">Statistics</div>
	<table class="table">
		<thead>
			<tr>
				<th>Stat</th>
				<th class="text-right">Value</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Total Seeds</td>
				<td class="text-right">{$totalSeeds}</td>
			</tr>
			<tr>
				<td>Total RAM/kb</td>
				<td class="text-right">
					{$totalRam}
					kb
				</td>
			</tr>
			<tr>
				<td>RAM/kb Price</td>
				<td class="text-right">{Asset.fromUnits($ramPrice * 1024, '4,EOS')}</td>
			</tr>
			<tr>
				<td>Seed Price</td>
				<td class="text-right">{Asset.fromUnits($seedPrice, '4,EOS')}</td>
			</tr>
			<tr>
				<td>TVL</td>
				<td class="text-right">
					{Asset.fromUnits($tvl, '4,EOS')}
				</td>
			</tr>
		</tbody>
	</table>
	<div class="h2">Distribution</div>
	<table class="table">
		<thead>
			<tr>
				<th>Account</th>
				<th class="text-right">RAM (kb)</th>
				<th class="text-right">Seeds</th>
			</tr>
		</thead>
		<tbody>
			{#each $stats as stat}
				<tr>
					<td>{stat.account}</td>
					<td class="text-right"
						>{((Number(stat.seeds) * sizeSeedRow) / 1024).toLocaleString(undefined, {
							minimumFractionDigits: 3,
							maximumFractionDigits: 3
						})}</td
					>
					<td class="text-right">{Number(stat.seeds).toLocaleString()}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<div class="h2">Notes on how this all works...</div>
	<p>This will all be removed once a homepage is created.</p>
	<ul class="list p-8">
		<li>Seeds are created by sending EOS tokens to the drops contract.</li>
		<li>The drops contract automatically spends these tokens to purchase RAM for the seed data.</li>
		<li>Any overage paid that is not used to buy RAM is automatically returned to the sender.</li>
		<li>Seeds can be destroyed at any time by the owner.</li>
		<li>
			Released RAM after destroying seeds is automatically sold and tokens given to the owner.
		</li>
		<li>Seeds are transferable and can be sent to other accounts.</li>
		<li>Seeds are unique, no two have the same data within them.</li>
		<li>Every seed created has a marking that indicates which epoch it was created in.</li>
		<li>The epoch automatically advanced every 1 day.</li>
		<li>Oracles commit and reveal additional seed data to aid in randomization.</li>
		<li>At the end of each epoch, each seed is combined with additional data.</li>
		<li>Drops can be created to distribute things to seed holders.</li>
		<li>A seed must exist before the epoch ends to be eligible for any drops in in that epoch.</li>
		<li>Seeds from prior epochs are eligible for distributions in any future epoch.</li>
	</ul>
</div>

<style lang="postcss">
</style>
