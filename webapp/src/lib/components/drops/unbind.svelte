<script lang="ts">
	import { derived, writable, type Readable, type Writable } from 'svelte/store';
	import { AlertCircle } from 'svelte-lucide';
	import { Asset, Serializer, type TransactResult } from '@wharfkit/session';

	import { t } from '$lib/i18n';
	import { DropContract, session, dropsContract, tokenContract } from '$lib/wharf';
	import { sizeDropRow } from '$lib/constants';

	const unbinding = writable(false);
	export let drops: Writable<DropContract.Types.drop_row[]> = writable([]);
	export let dropsPricePlusFee: Writable<number> = writable(0);
	export let selected: Writable<Record<string, boolean>> = writable({});
	export let selectingAll: Writable<boolean> = writable(false);

	interface UnbindResult {
		unbound: number;
		cost: Asset;
		refund: Asset;
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
		[dropsPricePlusFee, numBoundSelected],
		([$dropsPricePlusFee, $numBoundSelected]) => {
			return $dropsPricePlusFee * $numBoundSelected;
		}
	);

	const estimatedRAM = derived(numBoundSelected, ($numBoundSelected) => {
		return sizeDropRow * $numBoundSelected;
	});

	const lastUnbindResult: Writable<UnbindResult | undefined> = writable();
	const lastUnbindError = writable();

	async function unbindSelected() {
		unbinding.set(true);
		lastUnbindError.set(undefined);
		if ($session) {
			const unbind = dropsContract.action('unbind', {
				owner: $session?.actor,
				drops_ids: Object.keys($selected)
			});
			const quantity = $dropsPricePlusFee * Object.keys($selected).length;
			const transfer = tokenContract.action('transfer', {
				from: $session?.actor,
				to: 'seed.gm',
				quantity: Asset.fromUnits(quantity, '4,EOS'),
				memo: 'unbind'
			});

			let result: TransactResult;
			try {
				result = await $session.transact({
					actions: [unbind, transfer]
				});

				unbinding.set(false);

				result.returns.forEach((returnValue) => {
					const data = Serializer.decode({
						data: returnValue.hex,
						type: DropContract.Types.generate_return_value
					});

					if (Number(data.cost.value) > 0) {
						// Refresh drops that were unbound
						const dropsUnbound = Object.keys($selected).map((s) => String(s));
						drops.update((current) => {
							for (const toUnbind of dropsUnbound) {
								const index = current.findIndex((row) => String(row.seed) === String(toUnbind));
								current[index].bound = false;
							}
							return current;
						});

						selected.set({});
						selectingAll.set(false);

						lastUnbindResult.set({
							unbound: dropsUnbound.length,
							cost: data.cost,
							refund: data.refund,
							txid: String(result.resolved?.transaction.id)
						});
					}
				});
			} catch (e) {
				unbinding.set(false);
				lastUnbindResult.set(undefined);
				lastUnbindError.set(e);
			}
		}
	}
</script>

<form class="space-y-8 p-4">
	<p>
		{$t('inventory.unbindheader', { itemnames: $t('common.itemnames') })}
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
						<th>{$t('inventory.ramtorelease')}</th>
						<td>{$estimatedRAM} bytes</td>
					</tr>
					<tr>
						<th>{$t('inventory.ramtobuy')}</th>
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
	{#if $lastUnbindError}
		<aside class="alert variant-filled-error">
			<div><AlertCircle /></div>
			<div class="alert-message">
				<h3 class="h3">{$t('common.transacterror')}</h3>
				<p>{$lastUnbindError}</p>
			</div>
			<div class="alert-actions"></div>
		</aside>
	{/if}
	{#if $isUnboundSelected}
		<aside class="alert variant-filled-warning">
			<div><AlertCircle /></div>
			<div class="alert-message">
				<h3 class="h3">
					{$t('inventory.unbindunboundwarning', { itemnames: $t('common.itemnames') })}
				</h3>
				<p>{$t('inventory.unbindunboundwarningtext', { itemnames: $t('common.itemnames') })}</p>
			</div>
			<div class="alert-actions"></div>
		</aside>
	{/if}
	<button
		type="button"
		class="btn bg-orange-600 w-full"
		on:click={unbindSelected}
		disabled={!Object.keys($selected).length || $isUnboundSelected || $unbinding}
	>
		{$t('inventory.unbinditems', {
			itemnames: $t('common.itemnames'),
			drops: Object.keys($selected).length
		})}
	</button>
	{#if $lastUnbindResult}
		<div class="table-container">
			<table class="table">
				<thead>
					<tr>
						<th
							colspan="3"
							class="variant-filled w-full bg-gradient-to-br from-green-500 to-green-700 box-decoration-clone"
						>
							<div class="lowercase text-sm text-white">
								<a href={`https://bloks.io/transaction/${$lastUnbindResult.txid}`}>
									{$t('common.transactsuccess')}
								</a>
							</div>
						</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td class="text-right"
							>{$t('inventory.unbindcount', {
								itemnames: $t('common.itemnames')
							})}</td
						>
						<td>{$lastUnbindResult.unbound}</td>
					</tr>
					<tr>
						<td class="text-right">{$t('inventory.ramtobuy')}</td>
						<td>{$lastUnbindResult.cost}</td>
					</tr>
					<tr>
						<td class="text-right">{$t('common.overpaymentrefund')}</td>
						<td>{$lastUnbindResult.refund}</td>
					</tr>
				</tbody>
			</table>
		</div>
	{/if}
</form>
