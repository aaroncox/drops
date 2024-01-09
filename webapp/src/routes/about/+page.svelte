<script lang="ts">
	import { t } from '$lib/i18n';
	import { Accordion, AccordionItem, ProgressBar } from '@skeletonlabs/skeleton';
	import type { Session } from '@wharfkit/session';
	import { onMount } from 'svelte';
	import type { Writable } from 'svelte/store';
	import { PackageOpen, PackagePlus, PackageX } from 'svelte-lucide';
	import Generate from '../../lib/components/headers/generate.svelte';
	import Loot from '../../lib/components/headers/loot.svelte';
	import Destroy from '../../lib/components/headers/destroy.svelte';

	const link = 'https://kit.svelte.dev';
</script>

<!-- YOU CAN DELETE EVERYTHING IN THIS PAGE -->

<div class="container p-4 sm:p-8 lg:p-16 mx-auto flex justify-center items-center">
	<div class="space-y-4 text-center flex flex-col bg-surface-900 p-8 rounded-lg">
		<Generate />
		<p>Drops are seed data contained on the blockchain which anyone can generate and own.</p>
		<br />
		<Loot />
		<p>Each drop is unique and can be used to claim loot from participating projects.</p>
		<br />
		<Destroy />
		<p>At any point a drop can be destroyed to reclaim that space on the blockchain.</p>
	</div>
</div>

<div class="container mx-auto p-4 sm:p-8 lg:p-16">
	<div class="h1 mb-8">Questions</div>
	<Accordion class="card p-4 text-token shadow-xl">
		<AccordionItem>
			<svelte:fragment slot="lead"></svelte:fragment>
			<svelte:fragment slot="summary"
				><p class="font-bold">How do I create a drop?</p></svelte:fragment
			>
			<svelte:fragment slot="content"></svelte:fragment>
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="lead"></svelte:fragment>
			<svelte:fragment slot="summary"
				><p class="font-bold">How do I create a drop?</p></svelte:fragment
			>
			<svelte:fragment slot="content"></svelte:fragment>
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="lead"></svelte:fragment>
			<svelte:fragment slot="summary"
				><p class="font-bold">How do I create a drop?</p></svelte:fragment
			>
			<svelte:fragment slot="content"></svelte:fragment>
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="lead"></svelte:fragment>
			<svelte:fragment slot="summary"
				><p class="font-bold">How do I create a drop?</p></svelte:fragment
			>
			<svelte:fragment slot="content"></svelte:fragment>
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="lead"></svelte:fragment>
			<svelte:fragment slot="summary"
				><p class="font-bold">How do I create a drop?</p></svelte:fragment
			>
			<svelte:fragment slot="content"></svelte:fragment>
		</AccordionItem>
		<AccordionItem>
			<svelte:fragment slot="lead"></svelte:fragment>
			<svelte:fragment slot="summary"
				><p class="font-bold">How do I create a drop?</p></svelte:fragment
			>
			<svelte:fragment slot="content"></svelte:fragment>
		</AccordionItem>
		<!-- ... -->
	</Accordion>
</div>

<style lang="postcss">
</style>
