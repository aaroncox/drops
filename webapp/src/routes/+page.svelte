<script lang="ts">
	import { sizeDropRow } from '$lib/constants';
	import { t } from '$lib/i18n';
</script>

<div class="container p-4 sm:p-8 lg:p-16 mx-auto flex justify-center items-center">
	<article class="prose lg:prose-xl dark:prose-invert">
		<h1>{$t('home.title')}</h1>
		<h2>{$t('home.q1')}</h2>
		<p>{$t('home.q1p1')}</p>
		<p>{$t('home.q1p2')}</p>
		<p>{$t('home.q1p3')}</p>
		<h2>{$t('home.q2')}</h2>
		<p>{$t('home.q2p1')}</p>
		<p>{$t('home.q2p2', { sizeDropRow })}</p>
		<p>{$t('home.q2p3')}</p>
		<h2>{$t('home.q3')}</h2>
		<p>{$t('home.q3p1')}</p>
		<p>
			{$t('home.q3p2a')}
			<a href="https://en.wikipedia.org/wiki/Random_seed">{$t('home.q3p2b')}</a>
			{$t('home.q3p2c')}
			<a href="https://en.wikipedia.org/wiki/Pseudorandomness">{$t('home.q3p2d')}</a>
			{$t('home.q3p2e')}
			<a href="https://en.wikipedia.org/wiki/Procedural_generation">{$t('home.q3p2f')}</a>
			{$t('home.q3p2g')}
		</p>
		<p>{$t('home.q3p3')}</p>
		<h2>{$t('home.q4')}</h2>
		<p>{$t('home.q4p1')}</p>
		<p>{$t('home.q4p2')}</p>
		<ol>
			<li>
				<p><strong>{$t('home.q4p3a')}</strong></p>
				<p>{$t('home.q4p3a1')}</p>
				<p>{$t('home.q4p3a2')}</p>
				<p>{$t('home.q4p3a3')}</p>
			</li>
			<li>
				<p><strong>{$t('home.q4p4a')}</strong></p>
				<p>{$t('home.q4p4a1')}</p>
				<p>{$t('home.q4p4a2')}</p>
			</li>
		</ol>
		<h2>{$t('home.q5')}</h2>
		<p>{$t('home.q5p1')}</p>
		<p>{$t('home.q5p2')}</p>
		<ol>
			<li>{$t('home.q5p3a')}</li>
			<li>{$t('home.q5p3b')}</li>
		</ol>
		<p>{$t('home.q5p4')}</p>
		<p>{$t('home.q5p5')}</p>
		<h2>{$t('home.q6')}</h2>
		<p>{$t('home.q6p1')}</p>
		<p>{$t('home.q6p2')}</p>
		<p>{$t('home.q6p3')}</p>
		<p><strong><u>{$t('home.q6p4')}</u></strong></p>
		<p>
			{$t('home.q6p5a')}
			<a href="https://github.com/EOSIO/eosio.system/issues/30">{$t('home.q6p5b')}</a>
			{$t('home.q6p5c')}
		</p>
		<h2>{$t('home.q7')}</h2>
		<p>{$t('home.q7p1')}</p>
		<p>{$t('home.q7p2')}</p>
		<h2>{$t('home.q8')}</h2>
		<p>{$t('home.q8p1')}</p>
		<h2>{$t('home.more')}</h2>
		<p>{$t('home.morep1')}</p>
		<p>{$t('home.morep2')}</p>
		<p>
			<a href="https://t.me/dropscontract">https://t.me/dropscontract</a>
		</p>
	</article>
</div>

<style lang="postcss">
</style>
