<script lang="ts">
	import { t } from '$lib/i18n';
	import { onMount } from 'svelte';
	import '../app.postcss';
	import { AppShell, AppBar, AppRail, AppRailAnchor, AppRailTile } from '@skeletonlabs/skeleton';
	import type { Session } from '@wharfkit/session';
	import type { Writable } from 'svelte/store';
	import { initializeStores, Drawer, getDrawerStore } from '@skeletonlabs/skeleton';
	import { MemoryStick } from 'svelte-lucide';

	initializeStores();

	const drawerStore = getDrawerStore();

	import Navigation from '$lib/components/navigation/navigation.svelte';

	const handleChange = ({ currentTarget }) => {
		const { value } = currentTarget;
		document.cookie = `lang=${value} ;`;
	};

	let wharf: typeof import('$lib/wharf');
	let session: Writable<Session | undefined>;
	onMount(async () => {
		wharf = await import('$lib/wharf');
		wharf.restore();
		session = wharf.session;
	});

	function drawerOpen(): void {
		drawerStore.open({});
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

			<svelte:fragment slot="trail">
				{#if $session}
					<button type="button" class="btn variant-filled" on:click={wharf.logout}
						>{$t('common.signout')}</button
					>
				{:else}
					<button type="button" class="btn variant-filled" on:click={wharf.login}
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
