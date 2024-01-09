<script lang="ts">
	import { PackageX } from 'svelte-lucide';

	export let format = 'h1';
	export let size = 12;
</script>

<div class={`${format} flex items-center`}>
	<PackageX class={`dark:text-pink-400 inline size-${size} mr-4`} />
	<span
		class="bg-gradient-to-br from-pink-400 to-violet-500 bg-clip-text text-transparent box-decoration-clone"
		>Destroy</span
	>
</div>

<style lang="postcss">
</style>
