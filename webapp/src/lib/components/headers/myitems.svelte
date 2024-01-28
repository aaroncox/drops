<script lang="ts">
	import { Package } from 'svelte-lucide';
	import { t } from '$lib/i18n';

	export let format = 'h1';
	export let size = 12;
</script>

<div class={`${format} flex items-center`}>
	<Package class={`dark:text-green-400 inline size-${size} mr-4`} />
	<span
		class="leading-snug bg-gradient-to-br from-green-300 to-blue-300 bg-clip-text text-transparent box-decoration-clone"
		>{$t('common.myitemnames')}</span
	>
</div>

<style lang="postcss">
</style>
