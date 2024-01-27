<script lang="ts">
	import { derived, writable, type Readable, type Writable } from 'svelte/store';
	import { AlertCircle } from 'svelte-lucide';
	import { Asset, Serializer, type TransactResult } from '@wharfkit/session';

	import { t } from '$lib/i18n';
	import { DropContract, session, dropsContract } from '$lib/wharf';
	import { sizeDropRow } from '$lib/constants';

	const binding = writable(false);
	export let drops: Writable<DropContract.Types.drop_row[]> = writable([]);
	export let dropsPrice: Writable<number> = writable(0);
	export let selected: Writable<Record<string, boolean>> = writable({});
	export let selectingAll: Writable<boolean> = writable(false);

	interface BindResult {
		bound: number;
		ram: number;
		redeemed: Asset;
		txid: string;
	}

	const lastBindResult: Writable<BindResult | undefined> = writable();
	const lastBindError = writable();

	const numBoundSelected = derived([drops, selected], ([$drops, $selected]) => {
		const selectedBound = Object.keys($selected).filter(
			(s) => $drops.find((d) => String(d.seed) === String(s))?.bound
		);
		return selectedBound.length;
	});

	const numUnboundSelected = derived([drops, selected], ([$drops, $selected]) => {
		const selectedBound = Object.keys($selected).filter(
			(s) => !$drops.find((d) => String(d.seed) === String(s))?.bound
		);
		return selectedBound.length;
	});

	const isBoundSelected: Readable<boolean> = derived(
		numBoundSelected,
		($numBoundSelected) => $numBoundSelected > 0
	);

	const isUnboundSelected: Readable<boolean> = derived(
		numUnboundSelected,
		($numUnboundSelected) => $numUnboundSelected > 0
	);

	const estimatedEOS = derived(
		[dropsPrice, numUnboundSelected],
		([$dropsPrice, $numUnboundSelected]) => {
			return $dropsPrice * $numUnboundSelected;
		}
	);

	const estimatedRAM = derived(numUnboundSelected, ($numUnboundSelected) => {
		return sizeDropRow * $numUnboundSelected;
	});

	async function bindSelected() {
		lastBindError.set(undefined);
		binding.set(true);
		if ($session) {
			const action = dropsContract.action('bind', {
				owner: $session?.actor,
				drops_ids: Object.keys($selected)
			});

			let result: TransactResult;
			try {
				result = await $session.transact({ action });
				binding.set(false);

				result.returns.forEach((returnValue) => {
					try {
						const data = Serializer.decode({
							data: returnValue.hex,
							type: DropContract.Types.bind_return_value
						});

						if (Number(data.ram_sold.value) > 0) {
							// Refresh drops that were bound
							const dropsBound = Object.keys($selected).map((s) => String(s));
							drops.update((current) => {
								for (const toBind of dropsBound) {
									const index = current.findIndex((row) => String(row.seed) === String(toBind));
									current[index].bound = true;
								}
								return current;
							});

							// Clear selected
							selected.set({});
							selectingAll.set(false);

							lastBindResult.set({
								bound: dropsBound.length,
								ram: Number(data.ram_sold),
								redeemed: data.redeemed,
								txid: String(result.resolved?.transaction.id)
							});
						}
					} catch (e) {
						// console.log(e);
					}
				});
			} catch (e) {
				binding.set(false);
				lastBindResult.set(undefined);
				lastBindError.set(e);
			}
		}
	}
</script>

<form class="space-y-8 p-4">
	<p>
		{$t('inventory.bindheader', { itemnames: $t('common.itemnames') })}
	</p>
	<div class="table-container">
		<table class="table">
			<thead>
				<tr>
					<th colspan="2"> {$t('inventory.estimatedresults')} </th>
				</tr>
			</thead>
			<tbody>
				{#if $isUnboundSelected}
					<tr>
						<th>{$t('inventory.ramtouse')}</th>
						<td>{$estimatedRAM} bytes</td>
					</tr>
					<tr>
						<th>{$t('inventory.tokenredeemed', { token: 'EOS' })}</th>
						<td>{Asset.fromUnits($estimatedEOS, '4,EOS')}</td>
					</tr>
				{/if}
				{#if !$isBoundSelected && !$isUnboundSelected}
					<tr>
						<td colspan="2" class="text-center">
							{$t('inventory.estimationwaiting', { itemnames: $t('common.itemnames') })}
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
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
	{#if $isBoundSelected}
		<aside class="alert variant-filled-warning">
			<div><AlertCircle /></div>
			<div class="alert-message">
				<h3 class="h3">
					{$t('inventory.bindboundwarning', { itemnames: $t('common.itemnames') })}
				</h3>
				<p>{$t('inventory.bindboundwarningtext', { itemnames: $t('common.itemnames') })}</p>
			</div>
			<div class="alert-actions"></div>
		</aside>
	{/if}
	<button
		type="button"
		class="btn bg-blue-400 w-full"
		on:click={bindSelected}
		disabled={!Object.keys($selected).length || $isBoundSelected}
	>
		{$t('inventory.binditems', { itemnames: $t('common.itemnames') })}
		{Object.keys($selected).length}
	</button>
	{#if $lastBindResult}
		<div class="table-container">
			<table class="table">
				<thead>
					<tr>
						<th
							colspan="3"
							class="variant-filled w-full bg-gradient-to-br from-green-500 to-green-700 box-decoration-clone"
						>
							<div class="text-sm text-white">
								<a href={`https://bloks.io/transaction/${$lastBindResult.txid}`}>
									{$t('common.transactsuccess')}
								</a>
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
