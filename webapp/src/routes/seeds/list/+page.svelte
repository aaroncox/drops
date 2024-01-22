<script lang="ts">
	import { writable, type Writable } from 'svelte/store';
	import { AlertCircle, Combine, Package2, PackageX } from 'svelte-lucide';
	import { Asset, Serializer, UInt64, type TransactResult, Name } from '@wharfkit/session';
	import { Paginator, type PaginationSettings, TabGroup, Tab } from '@skeletonlabs/skeleton';

	import { t } from '$lib/i18n';
	import Seeds from '$lib/components/headers/seeds.svelte';
	import { SeedContract, session, seedContract } from '$lib/wharf';

	const loaded = writable(false);

	const seeds: Writable<SeedContract.Types.seed_row[]> = writable([]);

	session.subscribe(() => {
		loadSeeds();
	});

	async function loadSeeds() {
		if ($session) {
			const from = Serializer.decode({
				data:
					Serializer.encode({ object: UInt64.from(UInt64.min) }).hexString +
					Serializer.encode({ object: $session.actor }).hexString,
				type: 'uint128'
			});

			const to = Serializer.decode({
				data:
					Serializer.encode({ object: UInt64.from(UInt64.max) }).hexString +
					Serializer.encode({ object: $session.actor }).hexString,
				type: 'uint128'
			});

			const rows = await seedContract
				.table('seed')
				.query({
					key_type: 'i128',
					index_position: 'secondary',
					from,
					to
				})
				.all();

			loaded.set(true);
			seeds.set(rows);
		}
	}

	let paginationSettings = {
		page: 0,
		limit: 10,
		size: 20,
		amounts: [10, 25, 100, 500, 1000, 5000]
	} satisfies PaginationSettings;

	$: paginationSettings.size = $seeds.length;

	$: paginatedSource = $seeds.slice(
		paginationSettings.page * paginationSettings.limit,
		paginationSettings.page * paginationSettings.limit + paginationSettings.limit
	);

	let selected: Writable<UInt64[]> = writable([]);

	function seedSelect(e: Event) {
		const { checked, value } = e.target;
		if (checked) {
			selected.update((s) => {
				s.push(UInt64.from(value));
				return s;
			});
		} else {
			selected.update((s) => {
				const index = s.indexOf(value);
				console.log(s, index, s.splice(index, 1));
				return s.splice(index, 1);
			});
		}
	}

	const selectingAll = writable(false);

	function selectAll(e: Event) {
		const { checked } = e.target;
		if (checked) {
			selectingAll.set(true);
			selected.set(paginatedSource.map((s) => s.seed));
		} else {
			selectingAll.set(false);
			selected.set([]);
		}
	}

	interface TransferResult {
		from: Name;
		to: Name;
		seeds: number;
		txid: string;
	}
	const transferTo: Writable<string> = writable();
	const lastTransferResult: Writable<TransferResult | undefined> = writable();
	const lastTransferError = writable();

	async function transferSelected() {
		if ($session) {
			lastTransferError.set(undefined);
			const to = Name.from($transferTo);

			const action = seedContract.action('transfer', {
				from: $session?.actor,
				to,
				seed_ids: $selected,
				memo: ''
			});

			let result: TransactResult;
			try {
				result = await $session.transact({ action });
				// Remove transferred from list
				const seedsTransferred = $selected.map((s) => String(s));
				seeds.update((current) =>
					current.filter((row) => !seedsTransferred.includes(String(row.seed)))
				);

				selected.set([]);
				selectingAll.set(false);

				lastTransferResult.set({
					from: $session.actor,
					to,
					seeds: seedsTransferred.length,
					txid: String(result.resolved?.transaction.id)
				});
			} catch (e) {
				lastTransferResult.set(undefined);
				lastTransferError.set(e);
			}
		}
	}

	interface DestroyResult {
		destroyed: number;
		ram: number;
		redeemed: Asset;
		txid: string;
	}
	const lastDestroyResult: Writable<DestroyResult | undefined> = writable();
	const lastDestroyError = writable();

	async function destroySelected() {
		console.log('destroy', $selected);
		if ($session) {
			const action = seedContract.action('destroy', {
				owner: $session?.actor,
				seed_ids: $selected,
				memo: ''
			});

			let result: TransactResult;
			try {
				result = await $session.transact({ action });
			} catch (e) {
				lastDestroyResult.set(undefined);
				lastDestroyError.set(e);
			}

			result.returns.forEach((returnValue) => {
				try {
					const data = Serializer.decode({
						data: returnValue.hex,
						type: SeedContract.Types.destroy_return_value
					});

					if (Number(data.ram_sold.value) > 0) {
						// Remove destroyed from list
						const seedsDestroyed = $selected.map((s) => String(s));
						seeds.update((current) =>
							current.filter((row) => !seedsDestroyed.includes(String(row.seed)))
						);

						// Clear selected
						selected.set([]);
						selectingAll.set(false);

						lastDestroyResult.set({
							destroyed: seedsDestroyed.length,
							ram: Number(data.ram_sold),
							redeemed: data.redeemed,
							txid: String(result.resolved?.transaction.id)
						});
					}
				} catch (e) {
					// console.warn(e);
				}
			});
		}
	}

	let tabSet: number = 0;
</script>

<div class="container p-4 sm:p-8 lg:p-16 mx-auto flex justify-center items-center">
	<div class="space-y-4 flex flex-col bg-surface-900 p-8 rounded-lg shadow-xl">
		<Seeds />
		<p>{$t('seeds.owned')}</p>
		{#if !$loaded}
			<section class="card w-full">
				<div class="p-4 space-y-4">
					<div class="text-center h3">{$t('common.loading')}</div>
					<div class="grid grid-cols-3 gap-8">
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
					</div>
					<div class="grid grid-cols-4 gap-4">
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
					</div>
				</div>
			</section>
		{:else if $seeds.length}
			<div class="table-container text-center space-y-4">
				<div class="h2 font-bold p-6 text-center">
					{$seeds.length.toLocaleString()}
					{$t('seeds.totalseeds')}
				</div>
				<TabGroup justify="justify-center">
					<Tab bind:group={tabSet} name="tab1" value={0}>
						<span
							><Package2 class={`dark:text-green-400 inline size-4 mr-2`} />
							{$t('common.list')}</span
						>
					</Tab>
					<Tab bind:group={tabSet} name="tab1" value={1}>
						<span
							><Combine class={`dark:text-yellow-400 inline size-4 mr-2`} />
							{$t('common.transfer')}</span
						>
					</Tab>
					<Tab bind:group={tabSet} name="tab2" value={2}>
						<span
							><PackageX class={`dark:text-pink-400 inline size-4 mr-2`} />
							{$t('common.destroy')}</span
						>
					</Tab>
					<svelte:fragment slot="panel">
						{#if tabSet === 1}
							<form class="space-y-4 p-8">
								<label class="label">
									<span>{$t('seeds.transferaccount')}</span>
									<input
										class="input"
										type="text"
										placeholder={$t('common.accountname')}
										bind:value={$transferTo}
									/>
								</label>
								<button
									type="button"
									class="btn variant-filled"
									on:click={transferSelected}
									disabled={!$selected.length || !$transferTo}
								>
									{$t('seeds.transferseeds')}
									{$selected.length}
								</button>
								{#if $lastTransferError}
									<aside class="alert variant-filled-error">
										<div><AlertCircle /></div>
										<div class="alert-message">
											<h3 class="h3">{$t('common.transacterror')}</h3>
											<p>{$lastTransferError}</p>
										</div>
										<div class="alert-actions"></div>
									</aside>
								{/if}
								{#if $lastTransferResult}
									<div class="table-container">
										<table class="table">
											<thead>
												<tr>
													<th
														colspan="3"
														class="variant-filled w-full bg-gradient-to-br from-green-500 to-green-700 box-decoration-clone"
													>
														<div class="lowercase text-sm text-white">
															<a href={`https://bloks.io/transaction/${$lastTransferResult.txid}`}
																>{$lastTransferResult.txid}</a
															>
														</div>
													</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td class="text-right">{$t('seeds.seedstransferred')}</td>
													<td>{$lastTransferResult.seeds}</td>
												</tr>
												<tr>
													<td class="text-right">{$t('seeds.seedssentto')}</td>
													<td>{$lastTransferResult.to}</td>
												</tr>
											</tbody>
										</table>
									</div>
								{/if}
							</form>
						{:else if tabSet === 2}
							<form class="space-y-4 p-8">
								<p>
									{$t('seeds.destroyheader')}
								</p>
								<button
									type="button"
									class="btn variant-filled"
									on:click={destroySelected}
									disabled={!$selected.length}
								>
									{$t('seeds.destroyseeds')}
									{$selected.length}
								</button>
								{#if $lastDestroyError}
									<aside class="alert variant-filled-error">
										<div><AlertCircle /></div>
										<div class="alert-message">
											<h3 class="h3">{$t('common.transacterror')}</h3>
											<p>{$lastDestroyError}</p>
										</div>
										<div class="alert-actions"></div>
									</aside>
								{/if}
								{#if $lastDestroyResult}
									<div class="table-container">
										<table class="table">
											<thead>
												<tr>
													<th
														colspan="3"
														class="variant-filled w-full bg-gradient-to-br from-green-500 to-green-700 box-decoration-clone"
													>
														<div class="lowercase text-sm text-white">
															<a href={`https://bloks.io/transaction/${$lastDestroyResult.txid}`}
																>{$lastDestroyResult.txid}</a
															>
														</div>
													</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td class="text-right">{$t('seeds.seedsdestroyed')}</td>
													<td>{$lastDestroyResult.destroyed}</td>
												</tr>
												<tr>
													<td class="text-right">{$t('seeds.seedsramreclaimed')}</td>
													<td>{$lastDestroyResult.ram}</td>
												</tr>
												<tr>
													<td class="text-right">{$t('seeds.seedseosredeemed')}</td>
													<td>{$lastDestroyResult.redeemed}</td>
												</tr>
											</tbody>
										</table>
									</div>
								{/if}
							</form>
						{/if}
					</svelte:fragment>
				</TabGroup>
				<div class="h5">{$t('seeds.seedsselected')} {$selected.length}</div>
				<table class="table">
					<thead>
						<tr>
							<th class="text-center">
								<input type="checkbox" checked={$selectingAll} on:change={selectAll} />
							</th>
							<th class="text-center">{$t('common.seed')}</th>
							<th class="text-center">{$t('common.epoch')}</th>
						</tr>
					</thead>
					<tbody>
						{#each paginatedSource as seed}
							<tr class="text-center">
								<td>
									<input
										checked={$selected.includes(seed.seed)}
										type="checkbox"
										on:change={seedSelect}
										value={seed.seed}
									/>
								</td>
								<td>
									{seed.seed}
								</td>
								<td>
									{seed.epoch}
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot class="p-12">
						<tr>
							<td colspan="3">
								<Paginator
									bind:settings={paginationSettings}
									showFirstLastButtons={false}
									showPreviousNextButtons={true}
									showNumerals
									maxNumerals={1}
								/>
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{:else}
			<p>{$t('seeds.none')}</p>
		{/if}
	</div>
</div>
