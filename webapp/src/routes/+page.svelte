<script lang="ts">
	import { sizeDropRow } from '$lib/constants';
</script>

<div class="container p-4 sm:p-8 lg:p-16 mx-auto flex justify-center items-center">
	<article class="prose lg:prose-xl dark:prose-invert">
		<h1>Drops: An ecosystem-wide distribution mechanism</h1>
		<h2>What is the Drops system?</h2>
		<p>The Drops system is a minimalistic smart contract designed to serve the entire ecosystem.</p>
		<p>
			At its core, the Drops system is a smart contract that allows anyone to create and manage
			non-fungible pieces of data which are backed by RAM. This data can stand alone as a unit of
			value and can be leveraged for its uniqueness in other applications. The sole purpose of the
			Drops system is to manage this data and enhance its utility.
		</p>
		<p>
			Anyone is free to use this system to create as many unique Drops as they'd like by using their
			own network resources. Any developer is also free to leverage this system and its unique data
			in their own applications in a provably fair manner.
		</p>
		<h2>What is an individual Drop?</h2>
		<p>
			Each individual Drop is a unique, non-fungible piece of data owned by a specific account. It
			is a primitive data type that alone offers uniquness and inherent value.
		</p>

		<p>
			A Drop is similar to an Ordinal found on a UTXO-based blockchain. The creation of a Drop will
			use {sizeDropRow} of fungible RAM and transform it into an non-fungible ordinal. Once created it
			can be traded, destroyed, or used as unique data in logic of other contracts and applications (in-game
			items, inscriptions, NFTs, etc).
		</p>
		<p>
			Unlike ordinals on UTXO chains, Drops are not associated with an unspent token output and
			instead owned by accounts. Without this dependency on UTXO, a Drop can be destroyed in order
			to reclaim part of the value that was used to create it. This gives every Drop an inherent
			value associated to the amount of RAM used to create it.
		</p>
		<h2>What can a Drop be used for?</h2>
		<p>
			Besides simply existing as a store of value, Drops can be utilized by other applications for
			their unique properties. Using a Drop with another application can happen in multiple ways,
			which is decided by creators of those other applications. The application could require simple
			verification of ownership, require verification of a Drop from a specific epoch, require a
			transfer of a specific Drop, or requiring the destruction of a drop for participation.
		</p>
		<p>
			The uniqueness a Drop can also be used as <a href="https://en.wikipedia.org/wiki/Random_seed">
				seed data
			</a>
			in other applications to represent unique ownership (similar to an inscription) or combined with
			an oracle system in algorithms that use
			<a href="https://en.wikipedia.org/wiki/Pseudorandomness">pseudorandom</a>
			or
			<a href="https://en.wikipedia.org/wiki/Procedural_generation">procedural generation</a>
			techniques.
		</p>
		<p>
			The system itself is agonstic to the use of Drops in other applications. It is up to the
			creators of those applications to decide how to use Drops.
		</p>

		<h2>How do I create a Drop?</h2>
		<p>
			Drops can be created on the <a href="/generate">Generate</a> page. This page allows users to select
			the number of drops to create and shows a detailed breakdown of the token/resource costs involved.
		</p>
		<p>Currently offers two methods to create a Drop.</p>
		<ol>
			<li>
				<p><strong>Use tokens to purchase RAM automatically</strong></p>
				<p>
					An account with a token balance can send tokens directly to the smart contract to create
					one or more drops. The smart contract will use the tokens it receives to automatically
					purchase the exact amount of RAM required to create the amount of Drops requested.
				</p>
				<p>
					Any excess tokens sent during this transfer that are not used to purchase RAM for the
					creation of Drops will be automatically returned to the sender.
				</p>
				<p>
					Using this method will create an <strong>unbound</strong> Drop. The smart contract will control
					the RAM resources used to create the Drop until the Drop is either destroyed or is later bound
					to a specific account.
				</p>
			</li>
			<li>
				<p><strong>Use an accounts own RAM quota</strong></p>
				<p>
					An account with an available RAM quota may use its own resources to create one or more
					Drops. Creating a Drop using this method will use the exact RAM amount required directly
					from the creators account.
				</p>
				<p>
					Using this method will create a Drop that is <strong>bound</strong> to the account that created
					it. The account that created the Drop will retain control of the RAM resources used to create
					it. It will not be tradable unless made unbound in the future. If the bound Drop is destroyed,
					the RAM used will be released to the owner.
				</p>
			</li>
		</ol>
		<h2>What are bound vs unbound Drops?</h2>
		<p>
			Every Drop that exists is either <strong>bound</strong> or <strong>unbound</strong>.
		</p>
		<p>This property affects two aspects the individual Drop:</p>
		<ol>
			<li>Who technically holds the RAM backing the Drop.</li>
			<li>Whether a Drop may be traded to another account.</li>
		</ol>
		<p>
			A Drop which is <strong>bound</strong> is locked to a specific account and cannot be traded.
			The underlying RAM resources for bound Drops are controlled by the current owner. The opposite
			of this is a Drop that is <strong>unbound</strong>, which is unlocked and may be traded to
			other accounts. The underlying RAM resources of an unbound Drop is controlled by the smart
			contract, which is what allows it to be freely traded between accounts.
		</p>
		<p>
			Each Drop can be switched between these two states at any time by the owner of a Drop. The act
			of switching between bound and unbound requires the current owner to pay the network fees for
			the operation, as well as use their own EOS and/or RAM to shift the Drop between these two
			states.
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
			An epoch is the simple numeric representation of time since the Drops project launched. When
			the Drops project launches, epoch 1 will begin. After a set amount of time passes, the epoch
			will advance to 2. This process will repeat for the life of the smart contract.
		</p>
		<p>
			Each Drop created is automatically associated to the epoch it was created in. When a Drop is
			created it starts in an immature state and will remain that way until the next epoch. Once the
			next epoch begins, the Drop will be considered mature and can be combined with the epoch seeds
			provided by the oracles for use in other applications and algorithms.
		</p>
		<h2>What is an Oracle?</h2>
		<p>
			An oracle is a designated account that is responsible for providing a random seed for each
			epoch. During each epoch, these oracles participate in a commit and reveal process to add
			unique salt for use in cryptographic algorithms and other applications.
		</p>
		<h2>More information</h2>
		<p>
			This document will continue to evolve and more information will be added as community feedback
			is received. This is the start to what is essentially a living white paper for Drops.
		</p>
		<p>For discussion related to this project, a Telegram channel has been created here:</p>
		<p>
			<a href="https://t.me/dropscontract">https://t.me/dropscontract</a>
		</p>
	</article>
</div>

<style lang="postcss">
</style>
