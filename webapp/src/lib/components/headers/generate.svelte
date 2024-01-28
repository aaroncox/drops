<script lang="ts">
	import { PackagePlus } from 'svelte-lucide';
	import { t } from '$lib/i18n';

	export let format = 'h1';
	export let size = 12;
</script>

<div class={`${format} flex items-center`}>
	<PackagePlus class={`dark:text-blue-400 inline size-${size} mr-4`} />
	<span
		class="leading-snug bg-gradient-to-br from-blue-300 to-cyan-400 bg-clip-text text-transparent box-decoration-clone"
		>{$t('common.generate')}</span
	>
</div>

<style lang="postcss">
</style>
