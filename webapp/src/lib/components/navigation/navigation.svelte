<script lang="ts">
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { Home, LogOut, PieChart, VenetianMask } from 'svelte-lucide';

	import Generate from '../headers/generate.svelte';
	import MyItems from '../headers/myitems.svelte';
	import { t, locales, locale } from '$lib/i18n';
	import { logout, session } from '$lib/wharf';

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
					<Home class={`dark:text-yellow-300 inline size-6 mr-4`} />
					<span
						class="bg-gradient-to-br from-yellow-400 to-orange-200 bg-clip-text text-transparent box-decoration-clone"
					>
						{$t('common.home')}
					</span>
				</div>
			</a>
		</li>
		<li>
			<a href="/drops" on:click={drawerClose}>
				<MyItems format="h4" size={6} />
			</a>
		</li>
		<li>
			<a href="/generate" on:click={drawerClose}>
				<Generate format="h4" size={6} />
			</a>
		</li>
		<li>
			<a href="/oracles" on:click={drawerClose}>
				<div class={`h4 flex items-center`}>
					<VenetianMask class={`dark:text-pink-400 inline size-6 mr-4`} />
					<span
						class="bg-gradient-to-br from-pink-300 to-violet-300 bg-clip-text text-transparent box-decoration-clone"
					>
						{$t('common.oracles')}
					</span>
				</div>
			</a>
		</li>
		<li>
			<a href="/distribution" on:click={drawerClose}>
				<div class={`h4 flex items-center`}>
					<PieChart class={`dark:text-purple-400 inline size-6 mr-4`} />
					<span
						class="bg-gradient-to-br from-purple-300 to-blue-300 bg-clip-text text-transparent box-decoration-clone"
					>
						{$t('common.distribution')}
					</span>
				</div>
			</a>
		</li>

		<li>
			{#if $session}
				<!-- svelte-ignore a11y-invalid-attribute -->
				<a href="#" on:click={logout}>
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
		<li class="p-4">
			<label>
				<span>{$t('common.language')}</span>
				<select class="select" bind:value={$locale} on:change={handleChange}>
					{#each $locales as value}
						<option {value} selected={$locale === value}
							>{$t(`common.${value}`)} ({value.toUpperCase()})</option
						>
					{/each}
				</select>
			</label>
		</li>
	</ul>
</nav>
