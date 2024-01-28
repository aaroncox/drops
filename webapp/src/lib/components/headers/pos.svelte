<script lang="ts">
	import { PackageOpen } from 'svelte-lucide';
	import { t } from '$lib/i18n';

	export let format = 'h1';
	export let size = 12;
</script>

<div class={`${format} flex items-center`}>
	<PackageOpen class={`dark:text-purple-400 inline size-${size} mr-4`} />
	<span
		class="leading-snug bg-gradient-to-br from-purple-500 to-blue-300 bg-clip-text text-transparent box-decoration-clone"
	>
		Proof of {$t('common.itemnames')}
	</span>
</div>

<style lang="postcss">
</style>
