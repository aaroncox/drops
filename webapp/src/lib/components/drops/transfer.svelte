<script lang="ts">
	import { derived, writable, type Readable, type Writable } from 'svelte/store';
	import { AlertCircle, Combine } from 'svelte-lucide';
	import { type TransactResult, Name } from '@wharfkit/session';

	import { t } from '$lib/i18n';
	import { DropContract, session, dropsContract } from '$lib/wharf';

	const transferring = writable(false);
	export let drops: Writable<DropContract.Types.drop_row[]> = writable([]);
	export let selected: Writable<Record<string, boolean>> = writable({});
	export let selectingAll: Writable<boolean> = writable(false);

	interface TransferResult {
		from: Name;
		to: Name;
		drops: number;
		txid: string;
	}

	const transferTo: Writable<string> = writable();
	const lastTransferResult: Writable<TransferResult | undefined> = writable();
	const lastTransferError = writable();
	const isBoundSelected: Readable<boolean> = derived([drops, selected], ([$drops, $selected]) => {
		const selectedBound = Object.keys($selected).find(
			(s) => $drops.find((d) => String(d.seed) === String(s))?.bound
		);
		return !!selectedBound;
	});
	const isDisabled = derived(
		[isBoundSelected, selected, transferTo, transferring],
		([$isBoundSelected, $selected, $transferTo, $transferring]) => {
			return $transferring || $isBoundSelected || !Object.keys($selected).length || !$transferTo;
		}
	);

	async function transferSelected() {
		transferring.set(true);
		if ($session) {
			lastTransferError.set(undefined);
			const to = Name.from($transferTo);

			const action = dropsContract.action('transfer', {
				from: $session?.actor,
				to,
				drops_ids: Object.keys($selected),
				memo: ''
			});

			let result: TransactResult;
			try {
				result = await $session.transact({ action });
				transferring.set(false);

				// Remove transferred from list
				const dropsTransferred = Object.keys($selected).map((s) => String(s));
				drops.update((current) => {
					for (const toTransfer of dropsTransferred) {
						const index = current.findIndex((row) => String(row.seed) === String(toTransfer));
						current.splice(index, 1);
					}
					return current;
				});

				selected.set({});
				selectingAll.set(false);

				lastTransferResult.set({
					from: $session.actor,
					to,
					drops: dropsTransferred.length,
					txid: String(result.resolved?.transaction.id)
				});
			} catch (e) {
				transferring.set(false);
				lastTransferResult.set(undefined);
				lastTransferError.set(e);
			}
		}
	}
</script>

<form class="space-y-8 p-4">
	<p>
		{$t('inventory.transferdescription', {
			itemnames: $t('common.itemnames'),
			drops: Object.keys($selected).length
		})}
	</p>
	<label class="label">
		<input
			class="input"
			type="text"
			placeholder={$t('common.accountname')}
			bind:value={$transferTo}
		/>
	</label>
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
	{#if $isBoundSelected}
		<aside class="alert variant-filled-warning">
			<div><AlertCircle /></div>
			<div class="alert-message">
				<h3 class="h3">
					{$t('inventory.transferboundwarning', { itemnames: $t('common.itemnames') })}
				</h3>
				<p>{$t('inventory.transferboundwarningtext', { itemnames: $t('common.itemnames') })}</p>
			</div>
			<div class="alert-actions"></div>
		</aside>
	{/if}
	<button
		type="button"
		class="btn bg-green-600 w-full"
		on:click={transferSelected}
		disabled={$isDisabled}
	>
		<Combine class={`inline size-6 mr-2`} />
		{$t('inventory.transferitem', {
			itemnames: $t('common.itemnames'),
			drops: Object.keys($selected).length
		})}
	</button>
	{#if $lastTransferResult}
		<div class="table-container">
			<table class="table">
				<thead>
					<tr>
						<th
							colspan="3"
							class="variant-filled w-full bg-gradient-to-br from-green-500 to-green-700 box-decoration-clone"
						>
							<div class="text-sm text-white">
								<a href={`https://bloks.io/transaction/${$lastTransferResult.txid}`}>
									{$t('common.transactsuccess')}
								</a>
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
