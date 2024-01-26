<script lang="ts">
	import { sizeDropRowPurchase } from '$lib/constants';
	import { t } from '$lib/i18n';
</script>

<div class="container p-4 sm:p-8 lg:p-16 mx-auto flex justify-center items-center">
	<article class="prose lg:prose-xl dark:prose-invert">
		<h1>Drops</h1>
		<h2>What is a Drop?</h2>
		<p>Each individual Drop is a unique, non-fungible piece of data owned by a specific account.</p>
		<p>
			Anyone is free to create as many unique Drops as they'd like by using their own network
			resources. These Drops can then be used by other applications as seed data in various types of
			algorithms in a provably fair manner, with each Drop representing a unique outcome.
		</p>
		<p>
			Using a Drop with another application can happen in multiple ways, which is decided by
			creators of that application. The application could require you verify ownership of a Drop,
			transfer a Drop, or even Destroy a drop to participate.
		</p>
		<p>
			Drops can also be traded between accounts and an unwanted Drop can also be destroyed to
			reclaim the RAM (bound) or RAM value (unbound) that was used to create it.
		</p>
		<h2>Are Drops a form of inscription?</h2>
		<p>
			At the most primitive level, yes - Drops are a form of inscription. However, Drops are not
			inscriptions in the traditional sense. Drops are not associated directly with a fungible token
			through use of an ordinal, they are instead guaranteed unique non-fungible entries in a smart
			contract that can be used in many different of ways.
		</p>
		<p>
			They do share many of the same qualities as inscriptions, such as fairness and inclusion, in
			that anyone can create them by voluntarily consuming the resources they own to participate.
			This voluntary resource consumption allows them to be used as the basis of a fair distribution
			system or as drops data for cryptographic algorithms.
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
					An account with a token balance can send tokens directly to the smart contract to create
					one or more drops. The smart contract will use the tokens sent to automatically purchase
					the exact amount of RAM required to create the amount of Drops requested.
				</p>
				<p>
					Any excess tokens sent during this transfer that are not used to purchase RAM for the
					creation of Drops will be automatically returned to the sender.
				</p>
				<p>
					Using this method will create an <strong>unbound</strong> Drop. The smart contract will retain
					control of the RAM resources used to create the Drop until the Drop is either destroyed or
					is later bound to an account.
				</p>
			</li>
			<li>
				<p><strong>Use an accounts own RAM quota</strong></p>
				<p>
					An account with an available RAM quota may use its own resources to create one or more
					Drops. Creating a Drop using this method will use the exact RAM amount required directly
					from the account.
				</p>
				<p>
					Using this method will create a Drop that is <strong>bound</strong> to the account that created
					it. The account that created the Drop will retain control of the RAM resources used to create
					it.
				</p>
			</li>
		</ol>
		<h2>What are bound vs unbound Drops?</h2>
		<p>
			Every Drop that exists is either <strong>bound</strong> or <strong>unbound</strong>. This
			property only affects whether a Drop may be transferred to another account or not.
		</p>
		<p>
			A Drop which is <strong>bound</strong> is locked to a specific account and cannot be traded. The
			underlying RAM resources for bound Drops are controlled by the owner.
		</p>
		<p>
			A Drop which is <strong>unbound</strong> is unlocked and may be traded to other accounts. The underlying
			RAM resources of the unbound Drops are controlled by the contract.
		</p>
		<p>
			A Drop which is <strong>unbound</strong> may be <strong>bound</strong> to an account at any time.
			This is done by requesting the Drop to be bound, which will use the owners RAM resources and sell
			the RAM resources on the contract. The value of the RAM sold from the smart contract is sent to
			the owner of the Drop.
		</p>
		<p>
			A Drop which is <strong>bound</strong> to an account may be <strong>unbound</strong> at any time.
			This is done by requesting the Drop to be unbound and sending the appropriate amount of tokens
			to the smart contract in order to purchase the RAM required to transfer the Drop.
		</p>
		<p>
			The process of switching between these two states will cause the smart contract to buy or sell
			RAM resources in order to transfer who the RAM payer is, and will incur the 0.5% fee the
			network charges for these operations.
		</p>
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
