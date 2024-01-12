<script lang="ts">
	import { Asset, Int64, Name } from '@wharfkit/session';
	import { onDestroy, onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { AlertCircle } from 'svelte-lucide';

	import Seeds from '../../lib/components/headers/seeds.svelte';
	import { DropsContract, dropsContract, session, systemContract } from '../../lib/wharf';

	const dropPrice: Writable<number> = writable();

	let ramPriceInterval: ReturnType<typeof setInterval>;
	let seedCountInterval: ReturnType<typeof setInterval>;

	const epochStats: Writable<DropsContract.Types.stat_row[]> = writable([]);

	onMount(async () => {
		loadRamPrice();
		loadSeedCounts();
		ramPriceInterval = setInterval(loadRamPrice, 2000);
		seedCountInterval = setInterval(loadSeedCounts, 5000);
	});

	onDestroy(() => {
		clearInterval(ramPriceInterval);
		clearInterval(seedCountInterval);
	});

	async function loadSeedCounts() {
		if ($session) {
			const counts = await dropsContract
				.table('stats')
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
	<div class="space-y-4 flex flex-col bg-surface-900 p-8 rounded-lg shadow-xl">
		<Seeds />
		<p>The number of seeds your account currently owns, by epoch.</p>
		{#if $session}
			<div class="table-container text-center">
				<table class="table">
					<thead>
						<tr>
							<th class="text-center">Seeds</th>
							<th class="text-center">Epoch</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each $epochStats as epoch}
							<tr>
								<td>
									<span class="text-2xl font-extrabold">{epoch.seeds}</span>
								</td>
								<td>
									<span class="text-2xl">{epoch.epoch}</span>
								</td>
								<td>
									<a
										href={`/seeds/list`}
										type="button"
										class="btn variant-filled w-full bg-gradient-to-br from-green-500 to-blue-400 box-decoration-clone"
									>
										<span>View Epoch {epoch.epoch}</span>
									</a>
								</td>
							</tr>
						{:else}
							<tr>
								<td class="text-center" colspan="3"> No seeds found. </td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<aside class="alert variant-filled-error">
				<div><AlertCircle /></div>
				<div class="alert-message">
					<h3 class="h3">Sign-in first</h3>
					<p>You must be signed in to view your seeds.</p>
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
