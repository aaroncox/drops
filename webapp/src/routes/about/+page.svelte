<script lang="ts">
	import { t } from '$lib/i18n';
</script>

<div class="container p-4 sm:p-8 lg:p-16 mx-auto flex justify-center items-center">
	<article class="prose lg:prose-xl dark:prose-invert">
		<h1>Drops</h1>
		<h2>What is a Drop?</h2>
		<p>
			Each Drop is a non-fungible piece of data owned by a specific account and persisted on the
			blockchain. Anyone can create a unique Drop by consuming network resources (CPU, NET, and
			RAM). Drops can be freely transferred and traded between accounts. An unwanted Drop can also
			be destroyed to reclaim the RAM that was used to create it.
		</p>
		<h2>Are Drops a form of inscription?</h2>
		<p>
			At the most primitive level, yes - Drops are a form of inscription. However, Drops are not
			inscriptions in the traditional sense. Drops are not associated directly with a fungible token
			through use of an ordinal, they are instead guaranteed unique non-fungible entries in a smart
			contract that can be used in any number of ways.
		</p>
		<p>
			They do share many of the same qualities as inscriptions, such as fairness and inclusion, in
			that anyone can create them by voluntarily consuming the resources they own to participate.
			This voluntary resource consumption allows them to be used as the basis of a fair distribution
			system or as drops data for cryptographic algorithms.
		</p>
		<h2>What is an Epoch?</h2>
		<p>
			Each Drop that is created is automatically associated to the epoch it was created during. Each
			epoch represents a set period of time since the launch of the smart contract. When the Drops
			contract launches, the first period of time will be epoch 1. After a predefined period of time
			passes the contract will advance to epoch 2. This process will continue for the life of the
			contract.
		</p>
		<p>
			When a Drop is created it starts in an immature state and will remain that way until the next
			epoch. Once the next epoch begins, the Drop will be considered mature and can be combined with
			the epoch drops provided by the oracles for use in algorithms.
		</p>
		<h2>How do I create a Drop?</h2>
		<p>
			Drops can be created on the <a href="/generate">Generate</a> page. This page allows users to select
			the number of drops to create and shows a detailed breakdown of the costs involved. Currently offers
			two methods to create a Drop.
		</p>
		<ol>
			<li>
				<p><strong>Use tokens to purchase RAM automatically</strong></p>
				<p>
					An account with an EOS token balance can send tokens to the smart contract to
					automatically purchase RAM from the blockchain and create a Drop. The amount of RAM
					purchased by the contract will be the exact amount required for the Drop(s) and amount
					sent will be returned to the creator automatically.
				</p>
				<p>
					The smart contract will retain control of the RAM resource until the Drop is destroyed. By
					allowing the smart contract this control, the Drop <u>will remain transferrable</u> to other
					accounts.
				</p>
			</li>
			<li>
				<p><strong>Use an accounts RAM balance</strong></p>
				<p>
					An account may use its existing and available RAM balance to create a Drop. Creating a
					Drop using this method will consume RAM directly from the account and will not require any
					additional tokens.
				</p>
				<p>
					The account that created the Drop using this method will retain ownership of the RAM, but
					the Drop <u>will not be transferrable</u> to other accounts.
				</p>
			</li>
		</ol>
		<h2>Are there any fees when creating a Drop?</h2>
		<p>Yes, network fees are required to create a Drop.</p>
		<p>
			The creation of a Drop consumes all 3 native network resources: CPU, NET, and RAM. The buying
			and selling of RAM to the system contract has a 0.5% fee. The rental of CPU and NET also has a
			cost through the Powerup system. All of the fees collected from these systems are paid to EOS
			token holders who stake their tokens in REX (the Resource Exchange).
		</p>
		<p><strong><u>No additional fees are taken by the Drops system.</u></strong></p>
		<p>
			The Drops smart contracts will always remain at a zero token balance. The RAM balance of the
			Drops smart contract will slowly increase over time as Drops are created and destroyed due to <a
				href="https://github.com/EOSIO/eosio.system/issues/30"
				>an unresolved bug in the precision of the Bancor algorithm</a
			>. This extra RAM will be utilized by the contract for additional data storage.
		</p>
		<h2>Oracles</h2>
		<p>
			During every Epoch, a set or Oracles participate in a commit and reveal process to add salt
			for use in cryptographic algorithms.
		</p>
		<h2>Incomplete...</h2>
		<p>Drops have a few different representations: Name (a-z1-5.), UInt64, hex, binary</p>
	</article>
</div>

<style lang="postcss">
</style>
