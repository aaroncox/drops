<script lang="ts">
	import { derived, writable, type Writable } from 'svelte/store';
	import { Lock } from 'svelte-lucide';
	import { Paginator, type PaginationSettings } from '@skeletonlabs/skeleton';
	import { Bytes } from '@wharfkit/session';

	import { t } from '$lib/i18n';
	import { DropContract } from '$lib/wharf';

	export let drops: Writable<DropContract.Types.drop_row[]>;
	export let selected: Writable<Record<string, boolean>> = writable({});
	export let selectingAll: Writable<boolean>;

	let paginationSettings = {
		page: 0,
		limit: 10,
		size: 20,
		amounts: [10, 25, 100, 500, 1000, 2500]
	} satisfies PaginationSettings;

	const searchingFor: Writable<string> = writable();
	const filteredDrops = derived([drops, searchingFor], ([$drops, $searchingFor]) => {
		return $drops.filter((row) => {
			if ($searchingFor) {
				const matchesInt = String(row.seed).includes($searchingFor);
				const matchesHex = String(Bytes.from(row.seed.byteArray)).includes($searchingFor);
				return matchesInt || matchesHex;
			}
			return true;
		});
	});

	$: paginationSettings.size = $filteredDrops.length;

	$: paginatedSource = $filteredDrops.slice(
		paginationSettings.page * paginationSettings.limit,
		paginationSettings.page * paginationSettings.limit + paginationSettings.limit
	);

	function selectDrop(e: Event) {
		if (e.target) {
			const { checked, value } = e.target as HTMLInputElement;
			if (checked) {
				selected.update((s) => {
					s[value] = true;
					return s;
				});
			} else {
				selected.update((s) => {
					delete s[value];
					return s;
				});
			}
		}
	}

	function selectAll(e: Event) {
		if (e.target) {
			const { checked } = e.target as HTMLInputElement;
			if (checked) {
				selectingAll.set(true);
				selected.update((current) => {
					paginatedSource.forEach((s) => (current[String(s.seed)] = true));
					return current;
				});
				console.log('selected complete');
			} else {
				selectingAll.set(false);
				selected.set({});
				console.log('selected complete');
			}
		}
	}
</script>

<div class="table-container space-y-4">
	<table class="table">
		<thead>
			<tr>
				<th colspan="4">
					<Paginator
						active="bg-blue-300"
						bind:settings={paginationSettings}
						showFirstLastButtons={false}
						showPreviousNextButtons={true}
						showNumerals
						maxNumerals={1}
					/>
				</th>
			</tr>
			<tr>
				<td class="p-4" colspan="4">
					<label class="label">
						<input
							bind:value={$searchingFor}
							class="input rounded"
							type="text"
							placeholder={$t('common.search')}
						/>
					</label>
				</td>
			</tr>
			<tr>
				<th class="text-center">
					<input type="checkbox" checked={$selectingAll} on:change={selectAll} />
				</th>
				<th class="text-center">{$t('common.bound')}</th>
				<th>{$t('common.itemname')}</th>
				<th class="text-center">{$t('common.epoch')}</th>
			</tr>
		</thead>
		<tbody>
			{#each paginatedSource as drop}
				<tr>
					<td class="text-center">
						{#if $selectingAll}
							<input checked type="checkbox" disabled />
						{:else}
							<input
								checked={$selected[String(drop.seed)]}
								type="checkbox"
								on:change={selectDrop}
								value={drop.seed}
							/>
						{/if}
					</td>
					<td class="flex justify-center items-center">
						{#if drop.bound}
							<Lock />
						{/if}
					</td>
					<td>
						<p class="text-lg font-mono">{Bytes.from(drop.seed.byteArray)}</p>
						<p class="text-xs font-mono">{drop.seed}</p>
					</td>
					<td class="text-center">
						<p class="text-lg">{drop.epoch}</p>
						<p class="text-xs">{drop.created}</p>
					</td>
				</tr>
			{/each}
		</tbody>
		<tfoot class="p-12">
			<tr>
				<td colspan="4">
					<Paginator
						active="bg-blue-300"
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
