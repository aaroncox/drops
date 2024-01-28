<script lang="ts">
	import { onMount } from 'svelte';
	import { initializeStores, Drawer, getDrawerStore } from '@skeletonlabs/skeleton';
	import { AppShell, AppBar } from '@skeletonlabs/skeleton';

	import { setLocale, t } from '$lib/i18n';
	import { login, session, restore } from '$lib/wharf';

	import '../app.postcss';

	initializeStores();

	const drawerStore = getDrawerStore();

	import Navigation from '$lib/components/navigation/navigation.svelte';
	import {
		loadEpoch,
		epochNumber,
		epochRemainingHours,
		epochRemainingMinutes,
		epochRemainingSeconds,
		epochWaitingAdvance,
		formatClockValue
	} from '$lib/epoch';

	const handleChange = ({ currentTarget }) => {
		const { value } = currentTarget;
		document.cookie = `lang=${value};`;
	};

	function getLanguage(name: string) {
		const value = document.cookie;
		const parts = value.split(`=`);
		if (parts && parts.length === 2) {
			return parts.pop().split(';').shift();
		}
		const defaultLanguage = navigator.language.split('-')[0];
		if (defaultLanguage) {
			return defaultLanguage;
		}
		return 'en';
	}

	onMount(async () => {
		setLocale(getLanguage('lang'));
		restore();
		loadEpoch();
	});

	function drawerOpen(): void {
		drawerStore.open({});
	}
</script>

<Drawer class="shadow-xl">
	<img src="/logo.png" class="w-48 px-6 py-4" />
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
						{#if $epochWaitingAdvance}
							{$t('common.readytoadvance')}
						{:else}
							<span class="hidden sm:inline-block">{$t('common.epochend')}:</span>
							{formatClockValue($epochRemainingHours)}:{formatClockValue(
								$epochRemainingMinutes
							)}:{formatClockValue($epochRemainingSeconds)}
						{/if}
					</span>
				{/if}
			</span>
			<svelte:fragment slot="trail">
				{#if $session}
					{$session.actor}
				{:else}
					<button type="button" class="btn variant-filled" on:click={login}
						>{$t('common.signin')}</button
					>
				{/if}
			</svelte:fragment>
		</AppBar>
		<aside class="alert bg-gradient-to-br variant-gradient-error-warning rounded-none">
			<div class="text-center w-full font-bold">{$t('common.testnetnotice')}</div>
		</aside>
	</svelte:fragment>
	<svelte:fragment slot="sidebarLeft">
		<img src="/logo.png" class="w-48 px-6 py-4" />
		<Navigation />
	</svelte:fragment>
	<slot />
</AppShell>
