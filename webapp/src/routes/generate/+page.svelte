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
	import { AlertCircle, Loader2, MemoryStick, PackagePlus } from 'svelte-lucide';
	import { DropContract, accountKit, dropsContract, session, tokenContract } from '$lib/wharf';
	import { getRamPrice } from '$lib/bancor';
	import { sizeDropRowPurchase, sizeAccountRow, sizeStatRow } from '$lib/constants';
	import { t } from '$lib/i18n';
	import { epochEnded, epochNumber, epochWaitingAdvance } from '$lib/epoch';
	import { Tab, TabAnchor, TabGroup } from '@skeletonlabs/skeleton';

	const useRandomDrop: Writable<boolean> = writable(true);
	const dropsAmount: Writable<number> = writable(1);
	const randomDrop: Writable<Name> = writable(randomName());

	const accountRamBalance: Writable<number> = writable();
	const accountTokenBalance: Writable<Asset> = writable();

	// Price of individual drops
	const dropsPrice: Writable<number> = writable();
	const accountPrice: Writable<number> = writable();
	const statsPrice: Writable<number> = writable();

	const accountStats: Writable<DropContract.Types.account_row> = writable();
	const accountEpochStats: Writable<DropContract.Types.stat_row[]> = writable([]);
	const accountThisEpochStats: Readable<DropContract.Types.stat_row> = derived(
		[accountEpochStats, epochNumber],
		([$accountEpochStats, $epochNumber], set) => {
			if ($accountEpochStats.length) {
				const thisEpoch = $accountEpochStats.find((e) => e.epoch.equals($epochNumber));
				if (thisEpoch) {
					set(thisEpoch);
				} else {
					set(undefined);
				}
			}
		}
	);

	const totalPrice: Readable<number | undefined> = derived(
		[dropsAmount, dropsPrice, accountPrice, statsPrice, accountStats, accountThisEpochStats],
		([
			$dropsAmount,
			$dropsPrice,
			$accountPrice,
			$statsPrice,
			$accountStats,
			$accountThisEpochStats
		]) => {
			if ($dropsAmount && $dropsPrice && $accountPrice && $statsPrice) {
				let cost = $dropsAmount * $dropsPrice;
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

	const totalRam: Readable<number | undefined> = derived(
		[dropsAmount, accountStats, accountThisEpochStats],
		([$dropsAmount, $accountStats, $accountThisEpochStats]) => {
			let amount = $dropsAmount * sizeDropRowPurchase;
			if (!$accountStats) {
				amount += sizeAccountRow;
			}
			if (!$accountThisEpochStats) {
				amount += sizeStatRow;
			}
			return amount;
		}
	);

	// let accountLoader: ReturnType<typeof setInterval>;
	let ramLoader: ReturnType<typeof setInterval>;

	onMount(async () => {
		loadRamPrice();
		// loadState();
		// accountLoader = setInterval(loadAccountData, 5000);
		ramLoader = setInterval(loadRamPrice, 2000);
	});

	onDestroy(() => {
		// clearInterval(accountLoader);
		clearInterval(ramLoader);
	});

	epochNumber.subscribe(() => {
		loadAccountData();
	});

	session.subscribe(() => {
		loadAccountData();
	});

	async function loadAccountData() {
		await loadAccountBalances();
		await loadAccountStats();
		await loadAccountEpochStats();
	}

	async function loadAccountStats() {
		if ($session) {
			const results = await dropsContract.table('account').get($session.actor);
			if (results) {
				accountStats.set(results);
			}
		}
	}

	// async function loadState() {
	// 	const state = await dropsContract.table('state').get();
	// 	if (state) {
	// 		dropsState.set(state);
	// 	}
	// }

	async function loadAccountEpochStats() {
		if ($session) {
			const results = await dropsContract
				.table('stat')
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

	async function loadAccountBalances() {
		if ($session) {
			const result = await accountKit.load($session.actor);
			accountRamBalance.set(Number(result.resource('ram').available));
			console.log(String(result.data.core_liquid_balance));
			if (result.data.core_liquid_balance) {
				accountTokenBalance.set(result.data.core_liquid_balance);
			}
		}
	}

	async function loadRamPrice() {
		const cost_plus_fee = await getRamPrice();
		if (cost_plus_fee) {
			dropsPrice.set(Number(cost_plus_fee) * sizeDropRowPurchase);
			accountPrice.set(Number(cost_plus_fee) * sizeAccountRow);
			statsPrice.set(Number(cost_plus_fee) * sizeStatRow);
		}
	}

	function randomName(): Name {
		const length = 12;
		const chars = 'abcdefghijklmnopqrstuvwxyz12345';
		let drops = '';
		for (var i = 0; i < length; i++) {
			drops += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return Name.from(drops);
	}

	@Struct.type('returnvalue')
	class GenerateReturnValue extends Struct {
		@Struct.field(Int32) drops!: Int32;
		@Struct.field(Int64) epoch!: Int64;
		@Struct.field(Asset) cost!: Asset;
		@Struct.field(Asset) refund!: Asset;
	}

	const lastResult: Writable<GenerateReturnValue | undefined> = writable();
	const lastResultId: Writable<string | undefined> = writable();
	const lastResultError: Writable<string> = writable();
	const transacting: Writable<boolean> = writable(false);

	async function buy(event: Event) {
		lastResultError.set('');
		transacting.set(true);
		if ($session) {
			const hash = String(Checksum256.hash(Bytes.from(String($randomDrop), 'utf8')));
			const quantity = Asset.fromUnits($totalPrice, '4,EOS');
			const actionData = {
				from: $session?.actor,
				// to: 'testing.gm',
				quantity,
				to: 'seed.gm',
				// quantity: '1.0000 EOS',
				memo: [$dropsAmount, hash].join(',')
			};

			const action = tokenContract.action('transfer', actionData);
			let result: TransactResult;
			try {
				result = await $session.transact({ action });
				// Set the last successful transaction ID
				lastResultId.set(String(result.resolved?.transaction.id));

				// Process return values
				result.returns.forEach((returnValue) => {
					try {
						const data = Serializer.decode({
							data: returnValue.hex,
							type: DropContract.Types.generate_return_value
						});
						if (Number(data.epoch_drops) > 0) {
							accountEpochStats.update((stats) => {
								const newStats = [...stats];
								const index = newStats.findIndex((s) => s.epoch.equals(data.epoch));
								if (index >= 0) {
									newStats[index].drops = data.epoch_drops;
								} else {
									newStats.push(
										DropContract.Types.stat_row.from({
											account: $session?.actor,
											epoch: data.epoch,
											id: 0,
											drops: data.epoch_drops
										})
									);
								}
								return newStats;
							});
						}
						if (Number(data.total_drops) > 0) {
							accountStats.update((stats) => {
								return {
									...stats,
									account: $session?.actor,
									drops: data.total_drops
								};
							});
						}
						if (Number(data.drops) > 0) {
							lastResult.set(data);
						}
					} catch (e) {
						console.warn(e);
					}
				});
				randomDrop.set(randomName());
				loadRamPrice();
			} catch (e) {
				lastResult.set(undefined);
				lastResultId.set(undefined);
				lastResultError.set(e);
			}
			transacting.set(false);
			setTimeout(loadAccountBalances, 400);
		}
	}

	async function mint(event: Event) {
		lastResultError.set('');
		transacting.set(true);
		if ($session) {
			const hash = String(Checksum256.hash(Bytes.from(String($randomDrop), 'utf8')));
			const action = dropsContract.action('mint', {
				amount: $dropsAmount,
				owner: $session.actor,
				data: hash
			});
			let result: TransactResult;
			try {
				result = await $session.transact({ action });
				// Set the last successful transaction ID
				lastResultId.set(String(result.resolved?.transaction.id));

				// Process return values
				result.returns.forEach((returnValue) => {
					try {
						const data = Serializer.decode({
							data: returnValue.hex,
							type: DropContract.Types.generate_return_value
						});
						if (Number(data.epoch_drops) > 0) {
							accountEpochStats.update((stats) => {
								const newStats = [...stats];
								const index = newStats.findIndex((s) => s.epoch.equals(data.epoch));
								if (index >= 0) {
									newStats[index].drops = data.epoch_drops;
								} else {
									newStats.push(
										DropContract.Types.stat_row.from({
											account: $session?.actor,
											epoch: data.epoch,
											id: 0,
											drops: data.epoch_drops
										})
									);
								}
								return newStats;
							});
						}
						if (Number(data.total_drops) > 0) {
							accountStats.update((stats) => {
								return {
									...stats,
									account: $session?.actor,
									drops: data.total_drops
								};
							});
						}
						if (Number(data.drops) > 0) {
							lastResult.set(data);
						}
					} catch (e) {
						console.warn(e);
					}
				});
				randomDrop.set(randomName());
				loadRamPrice();
			} catch (e) {
				lastResult.set(undefined);
				lastResultId.set(undefined);
				lastResultError.set(e);
			}
			transacting.set(false);
			setTimeout(loadAccountBalances, 400);
		}
	}

	const selectDropAmount = (e: Event) => dropsAmount.set(Number(e.target.value));

	let tabSet: number = 1;
</script>

<div class="container p-4 sm:p-8 lg:p-16 mx-auto flex justify-center items-center">
	<div class="space-y-4 flex flex-col bg-surface-900 p-8 rounded-lg shadow-xl">
		<div class="h1 flex items-center">
			<PackagePlus class="dark:text-blue-400 inline size-12 mr-4" />
			<span
				class="bg-gradient-to-br from-blue-500 to-cyan-300 bg-clip-text text-transparent box-decoration-clone"
				>{$t('common.generate')}</span
			>
		</div>
		<div class="text-center grid grid-cols-3 gap-4">
			<div>
				<div class="h2 font-bold">
					{#if $accountStats}
						{$accountStats.drops}
					{:else}
						0
					{/if}
				</div>
				{$t('common.itemnames')}
				<div class="text-slate-400">{$t('common.total')}</div>
			</div>
			<div>
				<div class="h2 font-bold">
					{#if $accountThisEpochStats}
						{$accountThisEpochStats.drops}
					{:else}
						0
					{/if}
				</div>
				{$t('common.itemnames')}
				<div class="text-slate-400">{$t('common.epoch')}</div>
			</div>
			<div>
				<div class="h2 font-bold">
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
		<TabGroup
			justify="justify-center"
			active="bg-blue-500"
			hover="hover:bg-blue-400"
			flex="flex-1 lg:flex-none"
			rounded=""
			border=""
			class="bg-surface-100-800-token w-full"
		>
			<Tab bind:group={tabSet} name="tab2" value={1}>
				<span>{$t('generate.useram')}</span>
			</Tab>
			<Tab bind:group={tabSet} name="tab1" value={0}>
				<span>{$t('generate.useeos')}</span>
			</Tab>
			<svelte:fragment slot="panel">
				<div class="p-6 space-y-8 shadow-xl rounded-lg">
					<form class="space-y-8" on:submit|preventDefault={tabSet === 0 ? buy : mint}>
						{#if tabSet === 0}
							<p>{$t('generate.headereos', { itemnames: $t('common.itemnames') })}</p>
						{:else if tabSet === 1}
							<p>{$t('generate.headerram', { itemnames: $t('common.itemnames') })}</p>
						{/if}
						<label class="label">
							<span>{$t('generate.togenerate')}</span>
							<select class="select" on:change={selectDropAmount} value={$dropsAmount}>
								{#each [1, 10, 100, 1000, 10000] as amount}
									<option value={amount}
										>+ {amount.toLocaleString()} {$t('common.itemnames')}</option
									>
								{/each}
							</select>
						</label>
						<!-- <label>
                            <label class="flex items-center space-x-2">
                                <input
                                    class="checkbox"
                                    type="checkbox"
                                    checked={$useRandomDrop}
                                    on:change={(e) => useRandomDrop.set(e.target?.checked)}
                                />
                                <p>Randomly generate drops value</p>
                            </label>
                        </label> -->
						{#if !$useRandomDrop}
							<label class="label space-y-4">
								<span class="h4 font-bold"
									>{$t('generate.dropseedvalue', { itemname: $t('common.itemname') })}</span
								>
								<input class="input" type="text" placeholder="Random Drop" value={$randomDrop} />
							</label>
						{/if}
						{#if $lastResultError}
							<aside class="alert variant-filled-error">
								<div><AlertCircle /></div>
								<div class="alert-message">
									<h3 class="h3">{$t('common.transacterror')}</h3>
									<p>{$lastResultError}</p>
								</div>
								<div class="alert-actions"></div>
							</aside>
						{/if}
						{#if $session}
							<button
								class="btn btn-lg variant-filled w-full bg-gradient-to-br from-blue-300 to-cyan-400 box-decoration-clone"
								disabled={$epochWaitingAdvance || $transacting}
							>
								<span>
									{#if $transacting}
										<Loader2 class="animate-spin" />
									{:else}
										<MemoryStick />
									{/if}
								</span>
								<span class="text-sm">
									{#if tabSet === 0}
										{$t('common.generate')}
										{$t('common.costof')}
										~{Asset.fromUnits($totalPrice, '4,EOS')}
									{:else if tabSet === 1}
										{$t('common.generate')}
										{$t('common.costof')}
										~{($totalRam / 1024).toLocaleString()}kb
									{/if}
								</span>
							</button>
							<div class="text-center">
								{#if tabSet === 0}
									<span>EOS Balance:</span>
									<span>{$accountTokenBalance}</span>
								{:else if tabSet === 1}
									<span>RAM Balance:</span>
									<span>{($accountRamBalance / 1024).toLocaleString()} kb</span>
								{/if}
							</div>
						{:else}
							<aside class="alert variant-filled-error">
								<div><AlertCircle /></div>
								<div class="alert-message">
									<h3 class="h3">{$t('common.signinfirst')}</h3>
									<p>{$t('generate.signinfirst')}</p>
								</div>
								<div class="alert-actions"></div>
							</aside>
						{/if}
					</form>
				</div>
			</svelte:fragment>
		</TabGroup>
		{#if $lastResult}
			<div class="table-container">
				<table class="table">
					<thead>
						<tr>
							<th
								colspan="3"
								class="variant-filled w-full bg-gradient-to-br from-green-500 to-green-700 box-decoration-clone"
							>
								<div class="text-white text-center">{$t('common.transactsuccess')}</div>
								<div class="lowercase text-xs text-white text-center">
									<a href={`https://bloks.io/transaction/${$lastResultId}`}
										><pre>{$lastResultId}</pre></a
									>
								</div>
							</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="text-right">{$lastResult.drops}</td>
							<td
								>{$t('generate.generatedropsepoch', {
									itemnames: $t('common.itemnames'),
									epoch: $lastResult.epoch
								})}
							</td>
						</tr>
						<tr>
							<td class="text-right">{$lastResult.cost}</td>
							<td>{$t('generate.ramcost')}</td>
						</tr>
						<tr>
							<td class="text-right">{$lastResult.refund}</td>
							<td>{$t('common.overpaymentrefund')}</td>
						</tr>
					</tbody>
				</table>
			</div>
		{/if}
		{#if $dropsAmount && $dropsPrice}
			<div class="table-container">
				<table class="table table-hover">
					<thead>
						<tr>
							<th colspan="3"> {$t('generate.costbreakdown')} </th>
						</tr>
						<!-- <tr>
								<th class="text-right">Item</th>
								<th class="text-center">Count</th>
								<th class="text-right">Cost</th>
							</tr> -->
					</thead>
					<tbody>
						<tr>
							<td>
								<div class="text-lg font-bold">{$t('common.itemnames')}</div>
								{$t('generate.ramstorage')}
							</td>
							<td class="text-center">
								<div class="text-lg font-bold">
									{$dropsAmount}
								</div>
							</td>
							<td class="text-right">
								{#if tabSet === 0}
									<div class="text-lg font-bold">
										{Asset.fromUnits($dropsAmount * $dropsPrice, '4,EOS')}
									</div>
									<div>{($dropsAmount * sizeDropRowPurchase).toLocaleString()} bytes</div>
								{:else if tabSet === 1}
									<div class="text-lg font-bold">
										<div>{($dropsAmount * sizeDropRowPurchase).toLocaleString()} bytes</div>
									</div>
								{/if}
							</td>
						</tr>
						{#if !$accountStats}
							<tr>
								<td>
									<div class="text-lg font-bold">{$t('common.account')}</div>
									{$t('generate.ramsignup')}
								</td>
								<td class="text-center">
									<div class="text-lg font-bold">1</div>
								</td>
								<td class="text-right">
									{#if tabSet === 0}
										<div class="text-lg font-bold">{Asset.fromUnits($accountPrice, '4,EOS')}</div>
										<div>{sizeAccountRow.toLocaleString()} bytes</div>
									{:else if tabSet === 1}
										<div class="text-lg font-bold">
											<div>{sizeAccountRow.toLocaleString()} bytes</div>
										</div>
									{/if}
								</td>
							</tr>
						{/if}
						{#if !$accountThisEpochStats || $epochEnded}
							<tr>
								<td>
									<div class="text-lg font-bold">{$t('common.epoch')}</div>
									{$t('generate.ramepoch')}
								</td>
								<td class="text-center">
									<div class="text-lg font-bold">1</div>
								</td>
								<td class="text-right">
									{#if tabSet === 0}
										<div class="text-lg font-bold">{Asset.fromUnits($statsPrice, '4,EOS')}</div>
										<div>{sizeStatRow.toLocaleString()} bytes</div>
									{:else if tabSet === 1}
										<div class="text-lg font-bold">
											{sizeStatRow.toLocaleString()} bytes
										</div>
									{/if}
								</td>
							</tr>
						{/if}
					</tbody>
					<tfoot>
						<tr>
							<td colspan="3" class="text-right">
								{#if tabSet === 0}
									<div class="font-bold text-xl">
										<div class="text-sm">{$t('common.total')}</div>
										{Asset.fromUnits(Number($totalPrice), '4,EOS')}
									</div>
									<div>{$totalRam?.toLocaleString()} bytes</div>
								{:else if tabSet === 1}
									<div class="text-lg font-bold">
										{$totalRam?.toLocaleString()} bytes
									</div>
								{/if}
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</div>
</div>

<style lang="postcss">
</style>
