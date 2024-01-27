<script lang="ts">
	import { t } from '$lib/i18n';
	import { sizeDropRowPurchase } from '$lib/constants';
	import { dropsContract } from '$lib/wharf';
	import type { Readable } from 'svelte/motion';
	import { derived, writable } from 'svelte/store';
	import { Asset, Name, UInt64 } from '@wharfkit/session';

	const ramPrice = writable(0);
	const totaldrops = writable(0);

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
	<div class="h2 font-bold">{$t('common.distribution')}</div>
	<p>{$t('common.distributiondescription')}</p>
	<table class="table">
		<thead>
			<tr>
				<th />
				<th>{$t('common.accountname')}</th>
				<th class="text-right">%</th>
				<th class="text-right">{$t('common.ramkb')}</th>
				<th class="text-right">{$t('common.itemnames')}</th>
			</tr>
		</thead>
		<tbody>
			{#each $accounts as row, index}
				<tr>
					<td class="text-right">{index + 1}</td>
					<td>
						<a href={`https://bloks.io/account/{$row.account}`}>
							<span class="font-bold text-blue-300">
								{row.account}
							</span>
						</a>
					</td>
					<td class="text-right font-mono"
						>{((Number(row.drops) / $totaldrops) * 100).toLocaleString()}%</td
					>
					<td class="text-right font-mono">{row.ram}</td>
					<td class="text-right font-mono">{Number(row.drops).toLocaleString()}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style lang="postcss">
</style>
