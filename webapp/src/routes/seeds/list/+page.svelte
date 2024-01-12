<script lang="ts">
	import { derived, writable, type Readable, type Writable } from 'svelte/store';
	import { page } from '$app/stores';
	import { Serializer, UInt64 } from '@wharfkit/session';

	import Seeds from '$lib/components/headers/seeds.svelte';
	import { session, dropsContract } from '$lib/wharf';
	import * as DropsContract from '$lib/contracts/drops';
	import { Paginator, type PaginationSettings } from '@skeletonlabs/skeleton';

	const epoch = derived(page, ($page) => $page.params.epoch);
	const seeds: Readable<DropsContract.Types.seed_row[]> = derived([session], ([$session], set) => {
		if ($epoch && $session) {
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

			dropsContract
				.table('seeds')
				.query({
					key_type: 'i128',
					index_position: 'secondary',
					from,
					to
				})
				.all()
				.then((results) => {
					console.log(results);
					set(results);
				});
		}
		set([]);
	});

	// const seeds: Writable<DropsContract.Types.seed_row[]> = writable([]);

	// const iterator: Readable<TableRowCursor<DropsContract.Types.seed_row>> = derived(
	// 	[epoch, session],
	// 	([$epoch, $session], set) => {
	// if ($epoch && $session) {
	// 	const from = Serializer.decode({
	// 		data:
	// 			Serializer.encode({ object: UInt64.from(UInt64.min) }).hexString +
	// 			Serializer.encode({ object: $session.actor }).hexString,
	// 		type: 'uint128'
	// 	});

	// 	const to = Serializer.decode({
	// 		data:
	// 			Serializer.encode({ object: UInt64.from(UInt64.max) }).hexString +
	// 			Serializer.encode({ object: $session.actor }).hexString,
	// 		type: 'uint128'
	// 	});

	// 	set(
	// 		dropsContract.table('seeds').query({
	// 			key_type: 'i128',
	// 			index_position: 'secondary',
	// 			from,
	// 			to
	// 		})
	// 	);
	// }
	// 	}
	// );

	// onMount(() => {
	// 	loadSeeds();
	// });

	// function loadSeeds() {
	// 	$iterator.next(500).then((results) => {
	// 		seeds.update((seeds) => {
	// 			seeds.push(...results);
	// 			return seeds;
	// 		});
	// 	});
	// }

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
				return s.splice(index, 1);
			});
		}
	}

	function selectAll(e: Event) {
		const { checked } = e.target;
		if (checked) {
			selected.set($seeds.map((s) => s.seed));
		} else {
			selected.set([]);
		}
	}
</script>

<div class="container p-4 sm:p-8 lg:p-16 mx-auto flex justify-center items-center">
	<div class="space-y-4 flex flex-col bg-surface-900 p-8 rounded-lg shadow-xl">
		<Seeds />
		<div class="text-center"></div>
		<p></p>
		{#if $seeds.length}
			<div class="table-container text-center">
				<table class="table">
					<thead>
						<tr>
							<td colspan="3">
								<div class="h2 font-bold p-6 text-center">{$seeds.length} total seeds</div>
							</td>
						</tr>
						<tr>
							<th class="text-center">
								<input type="checkbox" on:change={selectAll} />
							</th>
							<th class="text-center">Seed</th>
							<th class="text-center">Epoch</th>
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
		{/if}
	</div>
</div>
