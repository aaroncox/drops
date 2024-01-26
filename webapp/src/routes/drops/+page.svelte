<script lang="ts">
	import { onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { Combine, Lock, PackageX, Unlock } from 'svelte-lucide';
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

	const selected: Writable<string[]> = writable([]);
	const selectingAll = writable(false);

	let tabSet: number = 1;
</script>

<div class="container mx-auto grid grid-cols-3 2xl:grid-cols-5">
	<div class="col-span-3 2xl:col-span-2 p-8 space-y-10">
		<div class="space-y-4">
			<MyItems />
		</div>
		<TabGroup justify="justify-center" flex="flex-auto">
			<Tab bind:group={tabSet} name="tab1" value={1}>
				<svelte:fragment slot="lead">
					<Combine class={`dark:text-green-400 inline size-6 mr-2`} />
				</svelte:fragment>
				<span class="font-bold">{$t('common.transfer')}</span>
			</Tab>
			<Tab bind:group={tabSet} name="tab3" value={3}>
				<svelte:fragment slot="lead">
					<Lock class={`dark:text-blue-400 inline size-6 mr-2`} />
				</svelte:fragment>
				<span class="font-bold">{$t('common.bind')}</span>
			</Tab>
			<Tab bind:group={tabSet} name="tab4" value={4}>
				<svelte:fragment slot="lead">
					<Unlock class={`dark:text-orange-400 inline size-6 mr-2`} />
				</svelte:fragment>
				<span class="font-bold">{$t('common.unbind')}</span>
			</Tab>
			<Tab bind:group={tabSet} name="tab2" value={2}>
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
				<DropsTable {drops} {selected} {selectingAll} />
			{:else}
				<p>{$t('inventory.none')}</p>
			{/if}
		</div>
	</div>
</div>

<div class="container mx-auto xl:columns-2 columns-1 rounded-lg shadow-xl bg-surface-900"></div>
