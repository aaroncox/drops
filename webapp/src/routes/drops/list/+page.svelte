<script lang="ts">
	import { onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { AlertCircle, Combine, Lock, Package2, PackageX } from 'svelte-lucide';
	import { Asset, Serializer, UInt64, type TransactResult, Name } from '@wharfkit/session';
	import { Paginator, type PaginationSettings, TabGroup, Tab } from '@skeletonlabs/skeleton';

	import { t } from '$lib/i18n';
	import MyItems from '$lib/components/headers/myitems.svelte';
	import { DropContract, session, dropsContract, tokenContract } from '$lib/wharf';
	import { getRamPrice } from '$lib/bancor';
	import { sizeDropRow } from '$lib/constants';

	const loaded = writable(false);

	const drops: Writable<DropContract.Types.drop_row[]> = writable([]);

	session.subscribe(() => {
		loaddrops();
	});

	// let accountLoader: ReturnType<typeof setInterval>;
	let ramLoader: ReturnType<typeof setInterval>;

	onMount(async () => {
		loadRamPrice();
		ramLoader = setInterval(loadRamPrice, 2000);
	});

	const dropsPrice = writable(0);
	async function loadRamPrice() {
		const cost_plus_fee = await getRamPrice();
		if (cost_plus_fee) {
			dropsPrice.set(Number(cost_plus_fee) * sizeDropRow);
		}
	}

	async function loaddrops() {
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

			const rows = await dropsContract
				.table('drop')
				.query({
					key_type: 'i128',
					index_position: 'secondary',
					from,
					to
				})
				.all();

			loaded.set(true);
			drops.set(rows);
		}
	}

	let paginationSettings = {
		page: 0,
		limit: 10,
		size: 20,
		amounts: [10, 25, 100, 500, 1000, 5000]
	} satisfies PaginationSettings;

	$: paginationSettings.size = $drops.length;

	$: paginatedSource = $drops.slice(
		paginationSettings.page * paginationSettings.limit,
		paginationSettings.page * paginationSettings.limit + paginationSettings.limit
	);

	let selected: Writable<String[]> = writable([]);

	function dropselect(e: Event) {
		const { checked, value } = e.target;
		console.log(value);
		if (checked) {
			selected.update((s) => {
				s.push(value);
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
			selected.set(paginatedSource.map((s) => String(s.seed)));
		} else {
			selectingAll.set(false);
			selected.set([]);
		}
	}

	interface TransferResult {
		from: Name;
		to: Name;
		drops: number;
		txid: string;
	}
	const transferTo: Writable<string> = writable();
	const lastTransferResult: Writable<TransferResult | undefined> = writable();
	const lastTransferError = writable();

	async function transferSelected() {
		if ($session) {
			lastTransferError.set(undefined);
			const to = Name.from($transferTo);

			const action = dropsContract.action('transfer', {
				from: $session?.actor,
				to,
				drops_ids: $selected,
				memo: ''
			});

			let result: TransactResult;
			try {
				result = await $session.transact({ action });
				// Remove transferred from list
				const dropsTransferred = $selected.map((s) => String(s));
				drops.update((current) =>
					current.filter((row) => !dropsTransferred.includes(String(row.seed)))
				);

				selected.set([]);
				selectingAll.set(false);

				lastTransferResult.set({
					from: $session.actor,
					to,
					drops: dropsTransferred.length,
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
		lastDestroyError.set(undefined);
		if ($session) {
			const action = dropsContract.action('destroy', {
				owner: $session?.actor,
				drops_ids: $selected,
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
						type: DropContract.Types.destroy_return_value
					});

					if (Number(data.ram_sold.value) > 0) {
						// Remove destroyed from list
						const dropsDestroyed = $selected.map((s) => String(s));
						drops.update((current) =>
							current.filter((row) => !dropsDestroyed.includes(String(row.seed)))
						);

						// Clear selected
						selected.set([]);
						selectingAll.set(false);

						lastDestroyResult.set({
							destroyed: dropsDestroyed.length,
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

	interface BindResult {
		bound: number;
		ram: number;
		redeemed: Asset;
		txid: string;
	}

	const lastBindResult: Writable<BindResult | undefined> = writable();
	const lastBindError = writable();

	async function bindSelected() {
		console.log('bind', $selected);
		lastBindError.set(undefined);
		if ($session) {
			const action = dropsContract.action('bind', {
				owner: $session?.actor,
				drops_ids: $selected
			});

			let result: TransactResult;
			try {
				result = await $session.transact({ action });
			} catch (e) {
				lastBindResult.set(undefined);
				lastBindError.set(e);
			}

			result.returns.forEach((returnValue) => {
				try {
					const data = Serializer.decode({
						data: returnValue.hex,
						type: DropContract.Types.bind_return_value
					});

					if (Number(data.ram_sold.value) > 0) {
						// Refresh drops that were bound
						const dropsBound = $selected.map((s) => String(s));
						drops.update((current) => {
							const newDrops = [...current];
							newDrops.forEach((row) => {
								if (dropsBound.includes(String(row.seed))) {
									row.bound = true;
								}
							});
							return newDrops;
						});

						// Clear selected
						selected.set([]);
						selectingAll.set(false);

						lastBindResult.set({
							bound: dropsBound.length,
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

	interface UnbindResult {
		unbound: number;
		cost: Asset;
		refund: Asset;
		txid: string;
	}

	const lastUnbindResult: Writable<UnbindResult | undefined> = writable();
	const lastUnbindError = writable();

	async function unbindSelected() {
		console.log('bind', $selected);
		lastUnbindError.set(undefined);
		if ($session) {
			const unbind = dropsContract.action('unbind', {
				owner: $session?.actor,
				drops_ids: $selected
			});
			const quantity = $dropsPrice * $selected.length;
			const transfer = tokenContract.action('transfer', {
				from: $session?.actor,
				to: 'seed.gm',
				quantity: Asset.fromUnits(quantity, '4,EOS'),
				memo: 'unbind'
			});
			let result: TransactResult;
			try {
				result = await $session.transact({
					actions: [transfer],
					context_free_actions: [unbind]
				});
			} catch (e) {
				lastUnbindResult.set(undefined);
				lastUnbindError.set(e);
			}

			result.returns.forEach((returnValue) => {
				try {
					const data = Serializer.decode({
						data: returnValue.hex,
						type: DropContract.Types.generate_return_value
					});

					if (Number(data.cost.value) > 0) {
						// Refresh drops that were unbound
						const dropsUnbound = $selected.map((s) => String(s));
						drops.update((current) => {
							const newDrops = [...current];
							newDrops.forEach((row) => {
								if (dropsUnbound.includes(String(row.seed))) {
									row.bound = false;
								}
							});
							return newDrops;
						});

						// Clear selected
						selected.set([]);
						selectingAll.set(false);

						lastUnbindResult.set({
							unbound: dropsUnbound.length,
							cost: data.cost,
							refund: data.refund,
							txid: String(result.resolved?.transaction.id)
						});
					}
				} catch (e) {
					// console.warn(e);
				}
			});
		}
	}

	let tabSet: number = 4;
</script>

<div class="container p-4 sm:p-8 lg:p-16 mx-auto flex justify-center items-center">
	<div class="space-y-4 flex flex-col bg-surface-900 p-8 rounded-lg shadow-xl">
		<MyItems />
		<p>{$t('inventory.owned', { itemnames: $t('common.itemnames') })}</p>
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
		{:else if $drops.length}
			<div class="table-container text-center space-y-4">
				<div class="h2 font-bold p-6 text-center">
					{$drops.length.toLocaleString()}
					{$t('inventory.totalitems', { itemnames: $t('common.itemnames') })}
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
					<Tab bind:group={tabSet} name="tab3" value={3}>
						<span
							><PackageX class={`dark:text-pink-400 inline size-4 mr-2`} />
							Bind</span
						>
					</Tab>
					<Tab bind:group={tabSet} name="tab4" value={4}>
						<span
							><PackageX class={`dark:text-pink-400 inline size-4 mr-2`} />
							Unbind</span
						>
					</Tab>
					<svelte:fragment slot="panel">
						{#if tabSet === 1}
							<form class="space-y-4 p-8">
								<label class="label">
									<span>{$t('inventory.transferaccount')}</span>
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
									{$t('inventory.transferitem', { itemnames: $t('common.itemnames') })}
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
													<td class="text-right"
														>{$t('inventory.itemtransferred', {
															itemnames: $t('common.itemnames')
														})}</td
													>
													<td>{$lastTransferResult.drops}</td>
												</tr>
												<tr>
													<td class="text-right">{$t('inventory.itemsentto')}</td>
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
									{$t('inventory.destroyheader', { itemnames: $t('common.itemnames') })}
								</p>
								<button
									type="button"
									class="btn variant-filled"
									on:click={destroySelected}
									disabled={!$selected.length}
								>
									{$t('inventory.destroyitems', { itemnames: $t('common.itemnames') })}
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
													<td class="text-right"
														>{$t('inventory.itemsdestroyed', {
															itemnames: $t('common.itemnames')
														})}</td
													>
													<td>{$lastDestroyResult.destroyed}</td>
												</tr>
												<tr>
													<td class="text-right">{$t('inventory.itemramreclaimed')}</td>
													<td>{$lastDestroyResult.ram}</td>
												</tr>
												<tr>
													<td class="text-right">{$t('inventory.itemeosredeemed')}</td>
													<td>{$lastDestroyResult.redeemed}</td>
												</tr>
											</tbody>
										</table>
									</div>
								{/if}
							</form>
						{:else if tabSet === 3}
							<form class="space-y-4 p-8">
								<p>
									{$t('inventory.bindheader', { itemnames: $t('common.itemnames') })}
								</p>
								<button
									type="button"
									class="btn variant-filled"
									on:click={bindSelected}
									disabled={!$selected.length}
								>
									{$t('inventory.binditems', { itemnames: $t('common.itemnames') })}
									{$selected.length}
								</button>
								{#if $lastBindError}
									<aside class="alert variant-filled-error">
										<div><AlertCircle /></div>
										<div class="alert-message">
											<h3 class="h3">{$t('common.transacterror')}</h3>
											<p>{$lastBindError}</p>
										</div>
										<div class="alert-actions"></div>
									</aside>
								{/if}
								{#if $lastBindResult}
									<div class="table-container">
										<table class="table">
											<thead>
												<tr>
													<th
														colspan="3"
														class="variant-filled w-full bg-gradient-to-br from-green-500 to-green-700 box-decoration-clone"
													>
														<div class="lowercase text-sm text-white">
															<a href={`https://bloks.io/transaction/${$lastBindResult.txid}`}
																>{$lastBindResult.txid}</a
															>
														</div>
													</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td class="text-right"
														>{$t('inventory.itemsbound', {
															itemnames: $t('common.itemnames')
														})}</td
													>
													<td>{$lastBindResult.bound}</td>
												</tr>
												<tr>
													<td class="text-right">{$t('inventory.itemramreclaimed')}</td>
													<td>{$lastBindResult.ram}</td>
												</tr>
												<tr>
													<td class="text-right">{$t('inventory.itemeosredeemed')}</td>
													<td>{$lastBindResult.redeemed}</td>
												</tr>
											</tbody>
										</table>
									</div>
								{/if}
							</form>
						{:else if tabSet === 4}
							<form class="space-y-4 p-8">
								<p>
									{$t('inventory.unbindheader', { itemnames: $t('common.itemnames') })}
								</p>
								<button
									type="button"
									class="btn variant-filled"
									on:click={unbindSelected}
									disabled={!$selected.length}
								>
									{$t('inventory.unbinditems', { itemnames: $t('common.itemnames') })}
									{$selected.length}
								</button>
								{#if $lastBindError}
									<aside class="alert variant-filled-error">
										<div><AlertCircle /></div>
										<div class="alert-message">
											<h3 class="h3">{$t('common.transacterror')}</h3>
											<p>{$lastBindError}</p>
										</div>
										<div class="alert-actions"></div>
									</aside>
								{/if}
								{#if $lastBindResult}
									<div class="table-container">
										<table class="table">
											<thead>
												<tr>
													<th
														colspan="3"
														class="variant-filled w-full bg-gradient-to-br from-green-500 to-green-700 box-decoration-clone"
													>
														<div class="lowercase text-sm text-white">
															<a href={`https://bloks.io/transaction/${$lastBindResult.txid}`}
																>{$lastBindResult.txid}</a
															>
														</div>
													</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td class="text-right"
														>{$t('inventory.itemsbound', {
															itemnames: $t('common.itemnames')
														})}</td
													>
													<td>{$lastBindResult.bound}</td>
												</tr>
												<tr>
													<td class="text-right">{$t('inventory.itemramreclaimed')}</td>
													<td>{$lastBindResult.ram}</td>
												</tr>
												<tr>
													<td class="text-right">{$t('inventory.itemeosredeemed')}</td>
													<td>{$lastBindResult.redeemed}</td>
												</tr>
											</tbody>
										</table>
									</div>
								{/if}
							</form>
						{/if}
					</svelte:fragment>
				</TabGroup>
				<div class="h5">
					{$t('inventory.itemselected', { itemnames: $t('common.itemnames') })}
					{$selected.length}
				</div>
				<table class="table">
					<thead>
						<tr>
							<th colspan="4">
								<Paginator
									bind:settings={paginationSettings}
									showFirstLastButtons={false}
									showPreviousNextButtons={true}
									showNumerals
									maxNumerals={1}
								/>
							</th>
						</tr>
						<tr>
							<th class="text-center">
								<input type="checkbox" checked={$selectingAll} on:change={selectAll} />
							</th>
							<th class="text-center">{$t('common.itemname')}</th>
							<th class="text-center">{$t('common.epoch')}</th>
							<th class="text-center">{$t('common.bound')}</th>
						</tr>
					</thead>
					<tbody>
						{#each paginatedSource as drop}
							<tr class="text-center">
								<td>
									<input
										checked={$selected.includes(String(drop.seed))}
										type="checkbox"
										on:change={dropselect}
										value={drop.seed}
									/>
								</td>
								<td>
									<p class="text-lg">{Name.from(drop.seed)}</p>
									<p class="text-xs">{drop.seed}</p>
								</td>
								<td>
									<p class="text-lg">{drop.epoch}</p>
									<p class="text-xs">{drop.created}</p>
								</td>
								<td class="flex justify-center items-center">
									{#if drop.bound}
										<Lock />
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot class="p-12">
						<tr>
							<td colspan="4">
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
			<p>{$t('inventory.none')}</p>
		{/if}
	</div>
</div>
