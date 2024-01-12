<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<div class="p-8">
	<div class="h2">Notes on how this all works...</div>
	<p>This will all be removed once a homepage is created.</p>
	<ul class="list p-8">
		<li>Seeds are created by sending EOS tokens to the drops contract.</li>
		<li>The drops contract automatically spends these tokens to purchase RAM for the seed data.</li>
		<li>Any overage paid that is not used to buy RAM is automatically returned to the sender.</li>
		<li>Seeds can be destroyed at any time by the owner.</li>
		<li>
			Released RAM after destroying seeds is automatically sold and tokens given to the owner.
		</li>
		<li>Seeds are transferable and can be sent to other accounts.</li>
		<li>Seeds are unique, no two have the same data within them.</li>
		<li>Every seed created has a marking that indicates which epoch it was created in.</li>
		<li>The epoch automatically advanced every 1 day.</li>
		<li>Oracles commit and reveal additional seed data to aid in randomization.</li>
		<li>At the end of each epoch, each seed is combined with additional data.</li>
		<li>Drops can be created to distribute things to seed holders.</li>
		<li>A seed must exist before the epoch ends to be eligible for any drops in in that epoch.</li>
		<li>Seeds from prior epochs are eligible for distributions in any future epoch.</li>
	</ul>
</div>

<style lang="postcss">
</style>
