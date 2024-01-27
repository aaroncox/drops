<script lang="ts">
	import { derived, writable, type Readable, type Writable } from 'svelte/store';
	import { AlertCircle } from 'svelte-lucide';
	import { Asset, Serializer, type TransactResult } from '@wharfkit/session';

	import { t } from '$lib/i18n';
	import { DropContract, session, dropsContract } from '$lib/wharf';
	import { sizeDropRow } from '$lib/constants';

	const destroying = writable(false);
	export let drops: Writable<DropContract.Types.drop_row[]> = writable([]);
	export let dropsPrice: Writable<number> = writable(0);
	export let selected: Writable<Record<string, boolean>> = writable({});
	export let selectingAll: Writable<boolean> = writable(false);

	interface DestroyResult {
		destroyed: number;
		ramsold: number;
		redeemed: Asset;
		reclaimed: number;
		txid: string;
	}

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

	const estimatedRAM = derived(numBoundSelected, ($numBoundSelected) => {
		return sizeDropRow * $numBoundSelected;
	});

	const lastDestroyResult: Writable<DestroyResult | undefined> = writable();
	const lastDestroyError = writable();

	async function destroySelected() {
		destroying.set(true);
		lastDestroyError.set(undefined);
		if ($session) {
			const action = dropsContract.action('destroy', {
				owner: $session?.actor,
				drops_ids: Object.keys($selected),
				memo: ''
			});

			let result: TransactResult;
			try {
				result = await $session.transact({ action });
				destroying.set(false);

				result.returns.forEach((returnValue) => {
					try {
						const data = Serializer.decode({
							data: returnValue.hex,
							type: DropContract.Types.destroy_return_value
						});

						if (Number(data.ram_sold.value) > 0 || Number(data.ram_reclaimed.value) > 0) {
							// Remove destroyed from list
							const dropsDestroyed = Object.keys($selected).map((s) => String(s));

							// Clear selected
							selected.set({});
							selectingAll.set(false);

							// Update the store and remove those that were destroyed
							drops.update((current) => {
								for (const toRemove of dropsDestroyed) {
									const index = current.findIndex((row) => String(row.seed) === String(toRemove));
									current.splice(index, 1);
								}
								return current;
							});

							lastDestroyResult.set({
								destroyed: dropsDestroyed.length,
								ramsold: Number(data.ram_sold),
								redeemed: data.redeemed,
								reclaimed: Number(data.ram_reclaimed),
								txid: String(result.resolved?.transaction.id)
							});
						}
					} catch (e) {
						// console.log(e);
					}
				});
			} catch (e) {
				destroying.set(false);
				lastDestroyResult.set(undefined);
				lastDestroyError.set(e);
			}
		}
	}
</script>

<form class="space-y-8 p-4">
	<p>
		{$t('inventory.destroyheader', {
			itemnames: $t('common.itemnames'),
			drops: Object.keys($selected).length
		})}
	</p>
	<div class="table-container">
		<table class="table">
			<thead>
				<tr>
					<th colspan="2"> {$t('inventory.estimatedresults')} </th>
				</tr>
			</thead>
			<tbody>
				{#if $isBoundSelected}
					<tr>
						<th>{$t('inventory.ramreleased')}</th>
						<td>{$estimatedRAM} bytes</td>
					</tr>
				{/if}
				{#if $isUnboundSelected}
					<tr>
						<th>{$t('inventory.itemeosredeemed')}</th>
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
	<button
		type="button"
		class="btn w-full bg-pink-600"
		on:click={destroySelected}
		disabled={!Object.keys($selected).length || $destroying}
	>
		{$t('inventory.destroyitems', {
			itemnames: $t('common.itemnames'),
			drops: Object.keys($selected).length
		})}
	</button>
	{#if $lastDestroyResult}
		<div class="table-container">
			<table class="table">
				<thead>
					<tr>
						<th
							colspan="3"
							class="variant-filled w-full bg-gradient-to-br from-green-500 to-green-700 box-decoration-clone"
						>
							<div class="text-sm text-white">
								<a href={`https://bloks.io/transaction/${$lastDestroyResult.txid}`}>
									{$t('common.transactsuccess')}
								</a>
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
					{#if $lastDestroyResult.ramsold > 0}
						<tr>
							<td class="text-right">{$t('inventory.itemeosredeemed')}</td>
							<td>{$lastDestroyResult.redeemed}</td>
						</tr>
					{/if}
					{#if $lastDestroyResult.reclaimed > 0}
						<tr>
							<td class="text-right">{$t('inventory.itemramreclaimed')}</td>
							<td>{$lastDestroyResult.reclaimed}</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</form>
