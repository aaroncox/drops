<script lang="ts">
	import { PackageOpen } from 'svelte-lucide';

	export let format = 'h1';
	export let size = 12;
</script>

<div class={`${format} flex items-center`}>
	<PackageOpen class={`dark:text-orange-400 inline size-${size} mr-4`} />
	<span
		class="bg-gradient-to-br from-orange-500 to-yellow-500 bg-clip-text text-transparent box-decoration-clone"
		>Loot</span
	>
</div>

<style lang="postcss">
</style>
