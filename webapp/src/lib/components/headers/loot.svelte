<script lang="ts">
	import { PackageOpen } from 'svelte-lucide';
	import { t } from '$lib/i18n';

	export let format = 'h1';
	export let size = 12;
</script>

<div class={`${format} flex items-center`}>
	<PackageOpen class={`dark:text-orange-400 inline size-${size} mr-4`} />
	<span
		class="bg-gradient-to-br from-orange-500 to-yellow-500 bg-clip-text text-transparent box-decoration-clone"
		>{$t('common.loot')}</span
	>
</div>

<style lang="postcss">
</style>
