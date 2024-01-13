<script lang="ts">
	import {
		Asset,
		Bytes,
		Checksum256,
		Int64,
		Name,
		Serializer,
		Struct,
		Int32,
		type TransactResult
	} from '@wharfkit/session';
	import { onDestroy, onMount } from 'svelte';
	import { derived, writable, type Readable, type Writable } from 'svelte/store';
	import { AlertCircle, MemoryStick, PackagePlus } from 'svelte-lucide';
	import { DropsContract, dropsContract, session, systemContract, tokenContract } from '$lib/wharf';
	import { getRamPrice, get_bancor_input } from '$lib/bancor';
	import { sizeSeedRow, sizeAccountRow, sizeStatRow } from '$lib/constants';

	const useRandomSeed: Writable<boolean> = writable(true);
	const seedAmount: Writable<number> = writable(1);
	const randomSeed: Writable<Name> = writable(randomName());

	// Price of individual seed
	const seedPrice: Writable<number> = writable();
	const accountPrice: Writable<number> = writable();
	const statsPrice: Writable<number> = writable();

	const dropsState: Writable<DropsContract.Types.state_row> = writable();
	const accountStats: Writable<DropsContract.Types.account_row> = writable();
	const accountEpochStats: Writable<DropsContract.Types.stat_row[]> = writable([]);
	const accountThisEpochStats: Readable<DropsContract.Types.stat_row> = derived(
		[accountEpochStats, dropsState],
		([$accountEpochStats, $dropsState], set) => {
			if ($accountEpochStats.length) {
				const thisEpoch = $accountEpochStats.find((e) => e.epoch.equals($dropsState.epoch));
				if (thisEpoch) {
					set(thisEpoch);
				}
			}
		}
	);

	const totalPrice: Readable<number | undefined> = derived(
		[seedAmount, seedPrice, accountPrice, statsPrice, accountStats, accountThisEpochStats],
		([
			$seedAmount,
			$seedPrice,
			$accountPrice,
			$statsPrice,
			$accountStats,
			$accountThisEpochStats
		]) => {
			if ($seedAmount && $seedPrice && $accountPrice && $statsPrice) {
				let cost = $seedAmount * $seedPrice;
				if (!$accountStats) {
					cost += $accountPrice;
				}
				if (!$accountThisEpochStats) {
					cost += $statsPrice;
				}
				return cost;
			}
		}
	);

	let ramLoader: ReturnType<typeof setInterval>;

	onMount(async () => {
		loadRamPrice();
		loadState();
		ramLoader = setInterval(loadRamPrice, 2000);
	});

	onDestroy(() => {
		clearInterval(ramLoader);
	});

	session.subscribe(() => {
		loadAccountData();
	});

	async function loadAccountData() {
		await loadAccountStats();
		await loadAccountEpochStats();
	}

	async function loadAccountStats() {
		if ($session) {
			const results = await dropsContract.table('accounts').get($session.actor);
			if (results) {
				accountStats.set(results);
			}
		}
	}

	async function loadState() {
		const state = await dropsContract.table('state').get();
		if (state) {
			dropsState.set(state);
		}
	}

	async function loadAccountEpochStats() {
		if ($session) {
			const results = await dropsContract
				.table('stats')
				.query({
					index_position: 'secondary',
					from: $session.actor,
					to: $session.actor
				})
				.all();
			if (results) {
				accountEpochStats.set(results);
			}
		}
	}

	async function loadRamPrice() {
		const cost_plus_fee = await getRamPrice();
		if (cost_plus_fee) {
			seedPrice.set(Number(cost_plus_fee) * sizeSeedRow);
			accountPrice.set(Number(cost_plus_fee) * sizeAccountRow);
			statsPrice.set(Number(cost_plus_fee) * sizeStatRow);
		}
	}

	function randomName(): Name {
		const length = 12;
		const chars = 'abcdefghijklmnopqrstuvwxyz12345';
		let seed = '';
		for (var i = 0; i < length; i++) {
			seed += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return Name.from(seed);
	}

	@Struct.type('returnvalue')
	class GenerateReturnValue extends Struct {
		@Struct.field(Int32) seeds!: Int32;
		@Struct.field(Int64) epoch!: Int64;
		@Struct.field(Asset) cost!: Asset;
		@Struct.field(Asset) refund!: Asset;
	}

	const lastResult: Writable<GenerateReturnValue | undefined> = writable();
	const lastResultId: Writable<string | undefined> = writable();
	const lastResultError: Writable<string> = writable();

	async function buy(event: Event) {
		lastResultError.set('');
		if ($session) {
			const hash = String(Checksum256.hash(Bytes.from(String($randomSeed), 'utf8')));
			const quantity = Asset.fromUnits($totalPrice, '4,EOS');
			const actionData = {
				from: $session?.actor,
				to: 'testing.gm',
				quantity,
				memo: [$seedAmount, hash].join(',')
			};

			const action = tokenContract.action('transfer', actionData);
			let result: TransactResult;
			try {
				result = await $session.transact({ action });
			} catch (e) {
				lastResult.set(undefined);
				lastResultId.set(undefined);
				lastResultError.set(e);
			}

			// Set the last successful transaction ID
			lastResultId.set(String(result.resolved?.transaction.id));

			// Process return values
			result.returns.forEach((returnValue) => {
				try {
					const data = Serializer.decode({
						data: returnValue.hex,
						type: DropsContract.Types.generate_return_value
					});
					if (Number(data.epoch_seeds) > 0) {
						accountEpochStats.update((stats) => {
							const newStats = [...stats];
							const index = newStats.findIndex((s) => s.epoch.equals(data.epoch));
							if (index >= 0) {
								newStats[index].seeds = data.epoch_seeds;
							} else {
								newStats.push(
									DropsContract.Types.stat_row.from({
										account: $session?.actor,
										epoch: data.epoch,
										id: 0,
										seeds: data.epoch_seeds
									})
								);
							}
							return newStats;
						});
					}
					if (Number(data.total_seeds) > 0) {
						accountStats.update((stats) => {
							return {
								...stats,
								account: $session?.actor,
								seeds: data.total_seeds
							};
						});
					}
					if (Number(data.seeds) > 0) {
						lastResult.set(data);
					}
				} catch (e) {
					console.warn(e);
				}
			});
			randomSeed.set(randomName());
			loadRamPrice();
		}
	}

	const selectSeedAmount = (e: Event) => seedAmount.set(Number(e.target.value));
</script>

<div class="container p-4 sm:p-8 lg:p-16 mx-auto flex justify-center items-center">
	<div class="space-y-4 flex flex-col bg-surface-900 p-8 rounded-lg shadow-xl">
		<div class="h1 flex items-center">
			<PackagePlus class="dark:text-blue-400 inline size-12 mr-4" />
			<span
				class="bg-gradient-to-br from-blue-500 to-cyan-300 bg-clip-text text-transparent box-decoration-clone"
				>Generate</span
			>
		</div>
		<form class="space-y-8" on:submit|preventDefault={buy}>
			<p>Use EOS tokens to purchase RAM from the blockchain and generate seeds.</p>
			<div class="text-center grid grid-cols-3 gap-4">
				<div>
					<div class="h2 font-bold">
						{#if $accountStats}
							{$accountStats.seeds}
						{:else}
							0
						{/if}
					</div>
					Seeds
					<div class="text-slate-400">Total</div>
				</div>
				<div>
					<div class="h2 font-bold">
						{#if $accountThisEpochStats}
							{$accountThisEpochStats.seeds}
						{:else}
							0
						{/if}
					</div>
					Seeds
					<div class="text-slate-400">Epoch</div>
				</div>
				<div>
					<div class="h2 font-bold">
						{#if $dropsState}
							{$dropsState.epoch}
						{:else}
							~
						{/if}
					</div>
					Epoch
					<div class="text-slate-400">Current</div>
				</div>
			</div>
			<label class="label">
				<span>Number of Seeds to generate</span>
				<select class="select" on:change={selectSeedAmount} value={$seedAmount}>
					{#each [1, 10, 100, 1000, 10000] as amount}
						<option value={amount}>+ {amount.toLocaleString()} seed(s)</option>
					{/each}
				</select>
			</label>
			<!-- <label>
				<label class="flex items-center space-x-2">
					<input
						class="checkbox"
						type="checkbox"
						checked={$useRandomSeed}
						on:change={(e) => useRandomSeed.set(e.target?.checked)}
					/>
					<p>Randomly generate seed value</p>
				</label>
			</label> -->
			{#if !$useRandomSeed}
				<label class="label space-y-4">
					<span class="h4 font-bold">Unique Seed Value</span>
					<input class="input" type="text" placeholder="Random Seed" value={$randomSeed} />
				</label>
			{/if}
			{#if $session}
				<button
					class="btn btn-lg variant-filled w-full bg-gradient-to-br from-blue-300 to-cyan-400 box-decoration-clone"
				>
					<span><MemoryStick /></span>
					<span>Generate {$seedAmount}x for {Asset.fromUnits($totalPrice, '4,EOS')}</span>
				</button>
			{:else}
				<aside class="alert variant-filled-error">
					<div><AlertCircle /></div>
					<div class="alert-message">
						<h3 class="h3">Sign-in first</h3>
						<p>You must be signed in to generate seeds.</p>
					</div>
					<div class="alert-actions"></div>
				</aside>
			{/if}
			{#if $lastResultError}
				<aside class="alert variant-filled-error">
					<div><AlertCircle /></div>
					<div class="alert-message">
						<h3 class="h3">Error processing transaction</h3>
						<p>{$lastResultError}</p>
					</div>
					<div class="alert-actions"></div>
				</aside>
			{/if}
			{#if $lastResult}
				<div class="table-container">
					<table class="table">
						<thead>
							<tr>
								<th
									colspan="3"
									class="variant-filled w-full bg-gradient-to-br from-green-500 to-green-700 box-decoration-clone"
								>
									<div class="lowercase text-sm text-white">
										<a href={`https://bloks.io/transaction/${$lastResultId}`}>{$lastResultId}</a>
									</div>
								</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td class="text-right">{$lastResult.seeds}</td>
								<td>Seeds in epoch {$lastResult.epoch}</td>
							</tr>
							<tr>
								<td class="text-right">{$lastResult.cost}</td>
								<td>RAM Cost</td>
							</tr>
							<tr>
								<td class="text-right">{$lastResult.refund}</td>
								<td>Overpayment refunded</td>
							</tr>
						</tbody>
					</table>
				</div>
			{/if}
			{#if $seedAmount && $seedPrice}
				<div class="table-container">
					<table class="table table-hover">
						<thead>
							<tr>
								<th colspan="3"> Cost Breakdown </th>
							</tr>
							<!-- <tr>
								<th class="text-right">Item</th>
								<th class="text-center">Count</th>
								<th class="text-right">Cost</th>
							</tr> -->
						</thead>
						<tbody>
							<tr class="text-right">
								<td>
									<div class="text-lg font-bold">Seeds</div>
								</td>
								<td class="text-center">
									<div class="text-lg font-bold">
										{$seedAmount}
									</div>
								</td>
								<td>
									<div class="text-lg font-bold">
										{Asset.fromUnits($seedAmount * $seedPrice, '4,EOS')}
									</div>
									<div>{$seedAmount * sizeSeedRow} bytes</div>
								</td>
							</tr>
							{#if !$accountStats}
								<tr class="text-right">
									<td>
										<div class="text-lg font-bold">Account</div>
									</td>
									<td class="text-center">
										<div class="text-lg font-bold">1</div>
									</td>
									<td>
										<div class="text-lg font-bold">{Asset.fromUnits($accountPrice, '4,EOS')}</div>
										<div>{sizeAccountRow} bytes</div>
									</td>
								</tr>
							{/if}
							{#if !$accountThisEpochStats}
								<tr class="text-right">
									<td>
										<div class="text-lg font-bold">Epoch</div>
									</td>
									<td class="text-center">
										<div class="text-lg font-bold">1</div>
									</td>
									<td>
										<div class="text-lg font-bold">{Asset.fromUnits($statsPrice, '4,EOS')}</div>
										<div>{sizeStatRow} bytes</div>
									</td>
								</tr>
							{/if}
						</tbody>
						<tfoot>
							<tr>
								<td colspan="3" class="text-right">
									<div class="font-bold text-xl">
										<div class="text-sm">Total</div>
										{Asset.fromUnits($totalPrice, '4,EOS')}
									</div>
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			{/if}
		</form>
	</div>
</div>

<style lang="postcss">
</style>
