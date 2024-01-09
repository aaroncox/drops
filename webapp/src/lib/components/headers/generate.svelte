<script lang="ts">
	import { PackagePlus } from 'svelte-lucide';

	export let format = 'h1';
	export let size = 12;
</script>

<div class={`${format} flex items-center`}>
	<PackagePlus class={`dark:text-blue-400 inline size-${size} mr-4`} />
	<span
		class="bg-gradient-to-br from-blue-500 to-cyan-300 bg-clip-text text-transparent box-decoration-clone"
		>Generate</span
	>
</div>

<style lang="postcss">
</style>
