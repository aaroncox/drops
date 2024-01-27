<script lang="ts">
	import { onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { AlertCircle, Combine, Lock, PackageX, Unlock } from 'svelte-lucide';
	import { Serializer, UInt64 } from '@wharfkit/session';
	import { TabGroup, Tab } from '@skeletonlabs/skeleton';

	import { t } from '$lib/i18n';
	import MyItems from '$lib/components/headers/myitems.svelte';
	import DropsTable from '$lib/components/drops/table.svelte';
	import DropUnbind from '$lib/components/drops/unbind.svelte';
	import DropBind from '$lib/components/drops/bind.svelte';
	import DropDestroy from '$lib/components/drops/destroy.svelte';
	import DropTransfer from '$lib/components/drops/transfer.svelte';

	import { DropContract, session, dropsContract } from '$lib/wharf';
	import { getRamPrice, getRamPriceMinusFee } from '$lib/bancor';
	import { sizeDropRow, sizeDropRowPurchase } from '$lib/constants';
	import type { TableRowCursor } from '@wharfkit/contract';
	import { epochNumber } from '$lib/epoch';

	const loaded = writable(false);
	const selected: Writable<Record<string, boolean>> = writable({});
	const selectingAll = writable(false);

	const drops: Writable<DropContract.Types.drop_row[]> = writable([]);
	const dropsLoaded = writable(0);
	const dropsProcessed = writable(0);

	const dropsFound = writable(0);
	const dropsClaimed = writable(0);

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
	const dropsPricePlusFee = writable(0);
	async function loadRamPrice() {
		const cost_minus_fee = await getRamPriceMinusFee();
		if (cost_minus_fee) {
			dropsPrice.set(Number(cost_minus_fee) * sizeDropRow);
		}
		const cost_plus_fee = await getRamPrice();
		if (cost_plus_fee) {
			dropsPricePlusFee.set(Number(cost_plus_fee) * sizeDropRowPurchase + 1);
		}
	}

	async function loaddrops() {
		if ($session) {
			loaded.set(false);

			// Reset all state
			dropsLoaded.set(0);
			dropsProcessed.set(0);
			dropsFound.set(0);
			dropsClaimed.set(0);
			drops.set([]);

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

			const cursor: TableRowCursor = await dropsContract.table('drop').query({
				key_type: 'i128',
				index_position: 'secondary',
				rowsPerAPIRequest: 10000,
				from,
				to
			});

			const accumulator: DropContract.Types.drop_row[] = [];
			while (!cursor.endReached) {
				const rows = await cursor.next();
				accumulator.push(...rows);
				dropsLoaded.set(accumulator.length);
			}

			dropsFound.set(accumulator.length);
			loaded.set(true);
			drops.set(accumulator);
		}
	}

	function resetSelected() {
		selected.set({});
		selectingAll.set(false);
	}

	let tabSet: number = 1;
</script>

<div class="container mx-auto grid grid-cols-3 2xl:grid-cols-5">
	<div class="col-span-3 2xl:col-span-2 p-8 space-y-10">
		<div class="space-y-4">
			<MyItems />
		</div>
		<TabGroup justify="justify-center" flex="flex-auto">
			<Tab bind:group={tabSet} name="tab1" value={1} on:click={resetSelected}>
				<svelte:fragment slot="lead">
					<Combine class={`dark:text-green-400 inline size-6 mr-2`} />
				</svelte:fragment>
				<span class="font-bold">{$t('common.transfer')}</span>
			</Tab>
			<Tab bind:group={tabSet} name="tab3" value={3} on:click={resetSelected}>
				<svelte:fragment slot="lead">
					<Lock class={`dark:text-blue-400 inline size-6 mr-2`} />
				</svelte:fragment>
				<span class="font-bold">{$t('common.bind')}</span>
			</Tab>
			<Tab bind:group={tabSet} name="tab4" value={4} on:click={resetSelected}>
				<svelte:fragment slot="lead">
					<Unlock class={`dark:text-orange-400 inline size-6 mr-2`} />
				</svelte:fragment>
				<span class="font-bold">{$t('common.unbind')}</span>
			</Tab>
			<Tab bind:group={tabSet} name="tab2" value={2} on:click={resetSelected}>
				<svelte:fragment slot="lead">
					<PackageX class={`dark:text-pink-400 inline size-6 mr-2`} />
				</svelte:fragment>
				<span class="font-bold">{$t('common.destroy')}</span>
			</Tab>
			<svelte:fragment slot="panel">
				{#if tabSet === 1}
					<DropTransfer {drops} {selected} {selectingAll} />
				{:else if tabSet === 2}
					<DropDestroy {drops} {dropsPrice} {selected} {selectingAll} />
				{:else if tabSet === 3}
					<DropBind {drops} {dropsPrice} {selected} {selectingAll} />
				{:else if tabSet === 4}
					<DropUnbind {drops} {dropsPricePlusFee} {selected} {selectingAll} />
				{/if}
			</svelte:fragment>
		</TabGroup>
	</div>
	<div class="col-span-3 2xl:col-span-3">
		<div class="p-8">
			{#if !$session}
				<div class="p-4 space-y-4">
					<aside class="alert variant-filled-error">
						<div><AlertCircle /></div>
						<div class="alert-message">
							<h3 class="h3">{$t('common.signinfirst')}</h3>
							<p>{$t('inventory.signinfirst', { itemnames: $t('common.itemnames') })}</p>
						</div>
						<div class="alert-actions"></div>
					</aside>
				</div>
			{:else if !$loaded}
				<section class="card w-full p-12">
					<div class="p-4 space-y-4">
						<div class="text-center h2">{$t('common.loading')}</div>
						<div class="text-center h3">
							{$dropsLoaded}
							{$t('common.itemnames')}...
						</div>
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
				<div class="space-y-8">
					<div class="text-center grid grid-cols-2 gap-4">
						<div>
							<div class="h2 font-bold">
								{#if $drops.length}
									{$drops.length.toLocaleString()}
								{:else}
									0
								{/if}
							</div>
							{$t('common.itemnames')}
							<div class="text-slate-400">{$t('common.total')}</div>
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
					<DropsTable {drops} {selected} {selectingAll} />
				</div>
			{:else}
				<p>{$t('inventory.none')}</p>
			{/if}
		</div>
	</div>
</div>

<div class="container mx-auto xl:columns-2 columns-1 rounded-lg shadow-xl bg-surface-900"></div>
