<script lang="ts">
	import { Asset, Int64, Name } from '@wharfkit/session';
	import { onDestroy, onMount } from 'svelte';
	import { derived, writable, type Readable, type Writable } from 'svelte/store';
	import { AlertCircle } from 'svelte-lucide';

	import { t } from '$lib/i18n';

	import MyItems from '$lib/components/headers/myitems.svelte';
	import { DropContract, dropsContract, session, systemContract } from '$lib/wharf';
	import { epochNumber } from '$lib/epoch';

	const dropPrice: Writable<number> = writable();

	let ramPriceInterval: ReturnType<typeof setInterval>;
	let dropsCountInterval: ReturnType<typeof setInterval>;

	const epochStats: Writable<DropContract.Types.stat_row[]> = writable([]);
	const dropsTotal: Readable<number> = derived([epochStats], ([$epochStats]) => {
		if ($epochStats) {
			return $epochStats.reduce((acc, cur) => acc + Number(cur.drops), 0);
		}
		return 0;
	});

	const dropstats: Readable<Asset | undefined> = derived(
		[epochStats, dropPrice],
		([$epochStats, $dropPrice]) => {
			if ($epochStats && $dropPrice) {
				const drops = $epochStats.reduce((acc, cur) => acc + Number(cur.drops), 0);
				return Asset.fromUnits($dropPrice * drops, '4,EOS');
			}
		}
	);

	onMount(async () => {
		loadRamPrice();
		loadDropCounts();
		ramPriceInterval = setInterval(loadRamPrice, 2000);
		dropsCountInterval = setInterval(loadDropCounts, 5000);
	});

	onDestroy(() => {
		clearInterval(ramPriceInterval);
		clearInterval(dropsCountInterval);
	});

	async function loadDropCounts() {
		if ($session) {
			const counts = await dropsContract
				.table('stat')
				.query({
					key_type: 'i64',
					index_position: 'secondary',
					from: $session.actor,
					to: $session.actor
				})
				.all();
			epochStats.set(counts);
		}
	}

	function get_bancor_input(out_reserve: Asset, inp_reserve: Asset, out: number): Int64 {
		const ob = out_reserve.units;
		const ib = inp_reserve.units;
		let inp = ib.multiplying(out).dividing(ob.subtracting(out));
		return inp;
	}

	async function loadRamPrice() {
		const result = await systemContract.table('rammarket').get();
		if (result) {
			const { base, quote } = result;
			const cost = get_bancor_input(base.balance, quote.balance, 2810000);
			const cost_plus_fee = Number(cost) / 0.995;
			dropPrice.set(cost_plus_fee / 10000);
		}
	}
</script>

<div class="container p-4 sm:p-8 lg:p-16 mx-auto flex justify-center items-center">
	<div class="space-y-4 bg-surface-900 p-8 rounded-lg shadow-xl">
		<MyItems />
		<p>{$t('inventory.subheader', { itemnames: $t('common.itemnames') })}</p>
		{#if $session}
			<div class="text-center grid grid-cols-2 gap-4">
				<div>
					<div class="h3 font-bold">
						{#if $dropsTotal}
							{$dropsTotal.toLocaleString()}
						{:else}
							0
						{/if}
					</div>
					{$t('common.itemnames')}
					<div class="text-slate-400">{$t('common.total')}</div>
				</div>
				<div>
					<div class="h3 font-bold">
						{#if $epochNumber}
							{$epochNumber}
						{:else}
							~
						{/if}
					</div>
					{$t('common.epoch')}
					<div class="text-slate-400">{$t('common.current')}</div>
				</div>
			</div>
			<a
				href={`/drops/list`}
				type="button"
				class="btn variant-filled w-full bg-gradient-to-br from-green-500 to-blue-400 box-decoration-clone"
			>
				<span>{$t('inventory.manage', { itemnames: $t('common.itemnames') })}</span>
			</a>
			<div class="table-container text-center space-y-10">
				<table class="table">
					<thead>
						<tr>
							<th class="text-center">{$t('common.epoch')}</th>
							<th class="text-center">{$t('common.itemnames')}</th>
						</tr>
					</thead>
					<tbody>
						{#each $epochStats as epoch}
							<tr>
								<td>
									<span class="text-2xl text-slate-300">{epoch.epoch}</span>
								</td>
								<td>
									<span class="text-2xl">{Number(epoch.drops).toLocaleString()}</span>
								</td>
							</tr>
						{:else}
							<tr>
								<td class="text-center" colspan="3">{$t('inventory.none')}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<aside class="alert variant-filled-error">
				<div><AlertCircle /></div>
				<div class="alert-message">
					<h3 class="h3">{$t('common.signinfirst')}</h3>
					<p>{$t('inventory.signinfirst')}</p>
				</div>
				<div class="alert-actions"></div>
			</aside>
		{/if}
	</div>
</div>

<style lang="postcss">
	table tbody tr td {
		vertical-align: middle;
	}
</style>
