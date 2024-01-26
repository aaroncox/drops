<script lang="ts">
	import { t } from '$lib/i18n';
	import { sizeDropRowPurchase } from '$lib/constants';
	import { dropsContract } from '$lib/wharf';
	import type { Readable } from 'svelte/motion';
	import { derived, writable } from 'svelte/store';
	import { onMount } from 'svelte';
	import { getRamPrice } from '$lib/bancor';
	import { Asset, Name, UInt64 } from '@wharfkit/session';

	let ramLoader: ReturnType<typeof setInterval>;

	const ramPrice = writable(0);
	const dropsPrice = writable(0);
	const totaldrops = writable(0);
	const totalRam = derived(totaldrops, ($totalRam) => {
		return (($totalRam * sizeDropRowPurchase) / 1024).toLocaleString(undefined, {
			minimumFractionDigits: 3,
			maximumFractionDigits: 3
		});
	});
	const tvl = derived([totaldrops, dropsPrice], ([$drops, $price]) => {
		if ($price && $drops) {
			return Number($price) * Number($drops);
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
			dropsPrice.set(Number(cost_plus_fee) * sizeDropRowPurchase);
		}
	}

	interface AccountStats {
		account: Name;
		drops: UInt64;
		ram: string;
		value: Asset;
	}

	const accounts: Readable<AccountStats[]> = derived([ramPrice], ([$ramPrice], set) => {
		dropsContract
			.table('account')
			.all()
			.then((results) => {
				const sorted = results
					.sort((a, b) => {
						return Number(b.drops) - Number(a.drops);
					})
					.filter((s) => Number(s.drops) > 0)
					.map((s) => ({
						...s,
						ram: ((Number(s.drops) * sizeDropRowPurchase) / 1024).toLocaleString(undefined, {
							minimumFractionDigits: 3,
							maximumFractionDigits: 3
						}),
						value: Asset.fromUnits(Number(s.drops) * sizeDropRowPurchase * $ramPrice, '4,EOS')
					}));
				totaldrops.set(results.reduce((t, result) => t + Number(result.drops), 0));
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
				<td>{$t('home.itemnameprice', { itemname: $t('common.itemnames') })}</td>
				<td class="text-right">{Asset.fromUnits($dropsPrice, '4,EOS')}</td>
			</tr>
			<tr>
				<td>{$t('home.itemnamesreserved', { itemnames: $t('common.itemnames') })}</td>
				<td class="text-right">{$totaldrops}</td>
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
</div>

<style lang="postcss">
</style>
