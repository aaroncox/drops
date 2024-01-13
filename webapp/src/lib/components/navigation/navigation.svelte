<script lang="ts">
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { BadgeInfo, Home, LogOut } from 'svelte-lucide';

	import Generate from '../headers/generate.svelte';
	import Seeds from '../headers/seeds.svelte';
	import Loot from '../headers/loot.svelte';
	import Destroy from '../headers/destroy.svelte';
	import { t, locales, locale } from '$lib/i18n';
	import { logout, login, session } from '$lib/wharf';

	const drawerStore = getDrawerStore();

	function drawerClose(): void {
		drawerStore.close();
	}

	const handleChange = ({ currentTarget }) => {
		const { value } = currentTarget;

		document.cookie = `lang=${value} ;`;
	};
</script>

<nav class="list-nav p-4">
	<ul>
		<li>
			<a href="/" on:click={drawerClose}>
				<div class={`h4 flex items-center`}>
					<Home class={`dark:text-slate-300 inline size-6 mr-4`} />
					<span
						class="bg-gradient-to-br from-slate-400 to-slate-300 bg-clip-text text-transparent box-decoration-clone"
					>
						{$t('common.home')}
					</span>
				</div>
			</a>
		</li>
		<li>
			<a href="/seeds" on:click={drawerClose}>
				<Seeds format="h4" size={6} />
			</a>
		</li>
		<li>
			<a href="/generate" on:click={drawerClose}>
				<Generate format="h4" size={6} />
			</a>
		</li>
		<!-- <li>
			<a href="/loot" on:click={drawerClose}>
				<Loot format="h4" size={6} />
			</a>
		</li> -->
		<!-- <li>
			<a href="/destroy" on:click={drawerClose}>
				<Destroy format="h4" size={6} />
			</a>
		</li> -->
		<!-- <li>
			<a href="/about" on:click={drawerClose}>
				<div class={`h4 flex items-center`}>
					<BadgeInfo class={`dark:text-slate-300 inline size-6 mr-4`} />
					<span
						class="bg-gradient-to-br from-slate-400 to-slate-300 bg-clip-text text-transparent box-decoration-clone"
					>
						{$t('common.about')}
					</span>
				</div>
			</a>
		</li> -->
		<li>
			{#if $session}
				<a href="/about" on:click={logout}>
					<div class={`h4 flex items-center`}>
						<LogOut class={`dark:text-slate-300 inline size-6 mr-4`} />
						<span
							class="bg-gradient-to-br from-slate-400 to-slate-300 bg-clip-text text-transparent box-decoration-clone"
						>
							{$t('common.signout')}
						</span>
					</div>
				</a>
			{/if}
		</li>
		<li class="space-y-4 py-8">
			<label>
				<span>Language</span>
				<select class="select" bind:value={$locale} on:change={handleChange}>
					{#each $locales as value}
						<option {value} selected={$locale === value}>{value}</option>
					{/each}
				</select>
			</label>
		</li>
	</ul>
</nav>
