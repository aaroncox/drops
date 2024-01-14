<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { readable, writable, type Writable } from 'svelte/store';
	import { initializeStores, Drawer, getDrawerStore } from '@skeletonlabs/skeleton';
	import { AppShell, AppBar } from '@skeletonlabs/skeleton';

	import { setLocale, t } from '$lib/i18n';
	import { login, logout, session, restore } from '$lib/wharf';

	import '../app.postcss';
	import { MemoryStick } from 'svelte-lucide';

	initializeStores();

	const drawerStore = getDrawerStore();

	import Navigation from '$lib/components/navigation/navigation.svelte';
	import { dropsContract } from '../lib/wharf';

	const handleChange = ({ currentTarget }) => {
		const { value } = currentTarget;
		document.cookie = `lang=${value} ;`;
	};

	let epochInterval;

	function getLanguage(name: string) {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts && parts.length === 2) {
			return parts.pop().split(';').shift();
		}
		const defaultLanguage = navigator.language.split('-')[0];
		if (defaultLanguage) {
			return defaultLanguage;
		}
	}

	onMount(async () => {
		const lang = getLanguage('lang');
		if (lang) {
			console.log('setting lang on mount', lang);
			setLocale(lang);
		}
		restore();
		loadEpoch();
		epochInterval = setInterval(loadEpoch, 10000);
	});

	onDestroy(() => {
		clearInterval(epochInterval);
	});

	let epochNumber: Writable<number> = writable();
	let epochEnd: Writable<Date> = writable();

	const remaining = readable(epochEnd, function start(set) {
		const interval = setInterval(() => {
			let r = Math.round(($epochEnd - new Date()) / 1000);
			r = Math.max(r, 0);
			set(r);
			if (r <= 0) {
				clearInterval(interval);
			}
		}, 1000);

		return function stop() {
			clearInterval(interval);
		};
	});

	$: hh = Math.floor($remaining / 3600);
	$: mm = Math.floor(($remaining - hh * 3600) / 60);
	$: ss = $remaining - hh * 3600 - mm * 60;

	async function loadEpoch() {
		const state = await dropsContract.table('state').get();
		const epoch = await dropsContract.table('epochs').get(state.epoch);
		epochNumber.set(String(state.epoch));
		epochEnd.set(new Date(epoch.end.toMilliseconds()));
	}

	function drawerOpen(): void {
		drawerStore.open({});
	}

	function f(value) {
		if (value < 10) {
			return `0${value}`;
		}
		return value.toString();
	}
</script>

<Drawer class="shadow-xl">
	<div class="text-2xl p-8 uppercase font-bold flex items-center">
		<MemoryStick class="dark:text-orange-400 inline size-6 mr-2" />
		DROPS
	</div>
	<hr />
	<Navigation />
</Drawer>

<!-- App Shell -->
<AppShell
	regionPage="relative"
	slotPageHeader="sticky top-0 z-10 shadow-lg"
	slotSidebarLeft="bg-surface-500/5 w-0 lg:w-64 bg-surface-100-800-token shadow-xl"
>
	<svelte:fragment slot="pageHeader">
		<AppBar gridColumns="grid-cols-3" slotDefault="place-self-center" slotTrail="place-content-end">
			<svelte:fragment slot="lead">
				<div class="flex items-center">
					<button class="lg:hidden btn btn-sm mr-4" on:click={drawerOpen}>
						<span>
							<svg viewBox="0 0 100 80" class="fill-token w-4 h-4">
								<rect width="100" height="20" />
								<rect y="30" width="100" height="20" />
								<rect y="60" width="100" height="20" />
							</svg>
						</span>
					</button>
				</div>
			</svelte:fragment>
			<span class="text-center">
				{#if $epochNumber}
					<p>Epoch: {$epochNumber}</p>
					<span class="text-sm">
						{#if hh && mm && ss}
							{#if hh === 0 && mm === 0 && ss === 0}
								<span title="Will advance to next epoch on next action"
									>{$t('common.readytoadvance')}</span
								>
							{:else}
								{f(hh)}:{f(mm)}:{f(ss)}
							{/if}
						{:else}
							--:--:--
						{/if}
					</span>
				{/if}
			</span>
			<svelte:fragment slot="trail">
				{#if $session}
					<button type="button" class="btn variant-filled" on:click={logout}
						>{$t('common.signout')}</button
					>
				{:else}
					<button type="button" class="btn variant-filled" on:click={login}
						>{$t('common.signin')}</button
					>
				{/if}
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<svelte:fragment slot="sidebarLeft">
		<div class="text-2xl p-6 uppercase font-bold flex items-center">
			<MemoryStick class="dark:text-orange-400 inline size-6 mr-2" />
			DROPS
		</div>
		<Navigation />
	</svelte:fragment>
	<slot />
</AppShell>
