<script lang="ts">
	import { t } from '$lib/i18n';
	import { sizeSeedRow } from '$lib/constants';
	import { DropsContract, dropsContract, session } from '$lib/wharf';
	import type { Readable } from 'svelte/motion';
	import { derived, writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { getRamPrice } from '$lib/bancor';
	import { Asset, Name, UInt64 } from '@wharfkit/session';

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

	interface AccountStats {
		account: Name;
		seeds: UInt64;
		ram: string;
		value: Asset;
	}

	const accounts: Readable<AccountStats[]> = derived([ramPrice], ([$ramPrice], set) => {
		dropsContract
			.table('accounts')
			.all()
			.then((results) => {
				const sorted = results
					.sort((a, b) => {
						return Number(b.seeds) - Number(a.seeds);
					})
					.filter((s) => Number(s.seeds) > 0)
					.map((s) => ({
						...s,
						ram: ((Number(s.seeds) * sizeSeedRow) / 1024).toLocaleString(undefined, {
							minimumFractionDigits: 3,
							maximumFractionDigits: 3
						}),
						value: Asset.fromUnits(Number(s.seeds) * sizeSeedRow * $ramPrice, '4,EOS')
					}));
				totalSeeds.set(results.reduce((t, result) => t + Number(result.seeds), 0));
				set(sorted);
			});
		set([]);
	});
</script>

<div class="p-8 space-y-8">
	<div class="h2 font-bold">{$t('home.statistics')}</div>
	<table class="table">
		<thead>
			<tr>
				<th>{$t('home.stat')}</th>
				<th class="text-right">{$t('home.value')}</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>{$t('home.seedprice')}</td>
				<td class="text-right">{Asset.fromUnits($seedPrice, '4,EOS')}</td>
			</tr>
			<tr>
				<td>{$t('home.seedsreserved')}</td>
				<td class="text-right">{$totalSeeds}</td>
			</tr>
			<tr>
				<td>{$t('home.ramreserved')}</td>
				<td class="text-right">
					{$totalRam}
					kb
				</td>
			</tr>
			<tr>
				<td>{$t('home.rampricekb')}</td>
				<td class="text-right">{Asset.fromUnits($ramPrice * 1024, '4,EOS')}</td>
			</tr>
			<tr>
				<td>{$t('home.tvl')}</td>
				<td class="text-right">
					{Asset.fromUnits($tvl, '4,EOS')}
				</td>
			</tr>
		</tbody>
	</table>
	<div class="h2 font-bold">{$t('home.distribution')}</div>
	<table class="table">
		<thead>
			<tr>
				<th>{$t('home.account')}</th>
				<th class="text-right">{$t('home.value')}</th>
				<th class="text-right">{$t('home.ramkb')}</th>
				<th class="text-right">{$t('common.seeds')}</th>
			</tr>
		</thead>
		<tbody>
			{#each $accounts as row}
				<tr>
					<td>{row.account}</td>
					<td class="text-right">{row.value}</td>
					<td class="text-right">{row.ram}</td>
					<td class="text-right">{Number(row.seeds).toLocaleString()}</td>
				</tr>
			{/each}
		</tbody>
	</table>
	<div class="h2">{$t('extra.header')}</div>
	<p>{$t('extra.subheader')}</p>
	<ul class="list p-8">
		<li>{$t('extra.extra1')}</li>
		<li>{$t('extra.extra2')}</li>
		<li>{$t('extra.extra3')}</li>
		<li>{$t('extra.extra4')}</li>
		<li>{$t('extra.extra5')}</li>
		<li>{$t('extra.extra6')}</li>
		<li>{$t('extra.extra7')}</li>
		<li>{$t('extra.extra8')}</li>
		<li>{$t('extra.extra9')}</li>
		<li>{$t('extra.extra10')}</li>
		<li>{$t('extra.extra11')}</li>
		<li>{$t('extra.extra12')}</li>
		<li>{$t('extra.extra13')}</li>
		<li>{$t('extra.extra14')}</li>
	</ul>
</div>

<style lang="postcss">
</style>
