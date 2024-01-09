<script lang="ts">
	import { t } from '$lib/i18n';
	import { Accordion, AccordionItem, ProgressBar } from '@skeletonlabs/skeleton';
	import {
		Asset,
		Bytes,
		Checksum256,
		Int64,
		Name,
		Serializer,
		Struct,
		type Session,
		Int,
		Int32
	} from '@wharfkit/session';
	import { onDestroy, onMount } from 'svelte';
	import { writable, type Readable, type Writable, derived } from 'svelte/store';
	import { PackageOpen, PackagePlus, PackageX } from 'svelte-lucide';
	import type { Contract } from '@wharfkit/contract';
	import { MemoryStick } from 'svelte-lucide';

	const link = 'https://kit.svelte.dev';

	const recordSize = 281;
	const useRandomSeed: Writable<boolean> = writable(true);
	const seedAmount: Writable<number> = writable(1);
	const randomSeed: Writable<Name> = writable(randomName());
	const dropPrice: Writable<number> = writable();
	// const dropPrice: Readable<number> = derived([ramPrice], ($ramPrice) => {
	// 	if ($ramPrice) {
	// 		return $ramPrice * recordSize;
	// 	}
	// 	return 0;
	// });

	let session: Writable<Session | undefined>;
	let wharf: typeof import('$lib/wharf');
	let systemcontract: typeof import('$lib/contracts/eosio').Contract;
	let tokencontract: typeof import('$lib/contracts/eosio-token').Contract;

	let ramLoader;

	onMount(async () => {
		let wharf: typeof import('$lib/wharf');
		wharf = await import('$lib/wharf');
		session = wharf.session;

		const system = (await import('$lib/contracts/eosio')).Contract;
		systemcontract = new system({ client: wharf.client });

		const token = (await import('$lib/contracts/eosio-token')).Contract;
		tokencontract = new token({ client: wharf.client });

		loadRamPrice();
		ramLoader = setInterval(loadRamPrice, 2000);
		// const contract = new system.Contract({ client });
		// console.log(contract);
	});

	onDestroy(() => {
		clearInterval(ramLoader);
	});

	function get_bancor_input(out_reserve: Asset, inp_reserve: Asset, out: number): Int64 {
		const ob = out_reserve.units;
		const ib = inp_reserve.units;
		return ib.multiplying(out).dividing(ob.subtracting(out));
	}

	function get_bancor_output(inp_reserve: Asset, out_reserve: Asset, inp: number): Int64 {
		const ib = inp_reserve.units;
		const ob = out_reserve.units;
		return ob.multiplying(inp).dividing(ib.adding(inp));
	}

	async function loadRamPrice() {
		if (systemcontract) {
			const { base, quote } = await systemcontract.table('rammarket').get();
			const bytes = 2810000;
			const cost = get_bancor_input(base.balance, quote.balance, bytes);
			const cost_plus_fee = Number(cost) / 0.995;
			dropPrice.set(cost_plus_fee / 10000);
		}
	}

	function randomName(): Name {
		const length = 12;
		const chars = 'abcdefghijklmnopqrstuvwxyz12345';
		let seed = '';
		for (var i = 0; i < length; i++) {
			seed += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return Name.from(seed);
	}

	@Struct.type('returnvalue')
	class GenerateReturnValue extends Struct {
		@Struct.field(Int32) seeds!: Int32;
		@Struct.field(Int64) epoch!: Int64;
		@Struct.field(Asset) cost!: Asset;
		@Struct.field(Asset) refund!: Asset;
	}

	const lastResult: Writable<GenerateReturnValue> = writable();
	const lastResultId: Writable<string> = writable();

	//     struct generate_return_value
	//    {
	//       int   seeds;
	//       asset cost;
	//       asset refund;
	//    };

	async function buy(event: Event) {
		const form = event.target as HTMLFormElement;

		const data = new FormData(form);

		const amount = data.get('amount');
		console.log('amount', amount);
		if (amount) {
			const actionData = {
				from: $session?.actor,
				to: 'testing.gm',
				// quantity: Asset.fromUnits(amount * $dropPrice, '4,EOS'),
				quantity: '1.0000 EOS',

				memo: [amount, String(Checksum256.hash(Bytes.from(String($randomSeed), 'utf8')))].join(',')
			};
			console.log(JSON.stringify(actionData));
			const action = tokencontract.action('transfer', actionData);

			const result = await $session.transact({ action });

			// Set the last successful transaction ID
			lastResultId.set(String(result.resolved?.transaction.id));

			// Process return values
			result.returns.forEach((returnValue) => {
				try {
					const data = Serializer.decode({
						data: returnValue.hex,
						type: GenerateReturnValue
					});
					if (Number(data.seeds) > 0) {
						lastResult.set(data);
					}
				} catch (e) {
					console.warn(e);
				}
			});
			randomSeed.set(randomName());
			loadRamPrice();
		}

		// const actionData = {
		// 	from: $session?.actor,
		// 	to: 'testing.gm',
		// 	quantity: Asset.fromUnits(amount * $dropPrice, '4,EOS'),
		// 	memo: [amount, String(Checksum256.hash(Bytes.from(String($randomSeed), 'utf8')))].join(',')
		// };
		// console.log(JSON.stringify(actionData));
		// const action = tokencontract.action('transfer', actionData);

		// await $session.transact({ action });
		// randomSeed.set(randomName());
	}

	const selectAmount = (amount: number) => seedAmount.set(amount);
</script>

<!-- YOU CAN DELETE EVERYTHING IN THIS PAGE -->

<div class="container p-4 sm:p-8 lg:p-16 mx-auto flex justify-center items-center">
	<div class="space-y-4 flex flex-col bg-surface-900 p-8 rounded-lg shadow-xl">
		<div class="h1 flex items-center">
			<PackagePlus class="dark:text-blue-400 inline size-12 mr-4" />
			<span
				class="bg-gradient-to-br from-blue-500 to-cyan-300 bg-clip-text text-transparent box-decoration-clone"
				>Generate</span
			>
		</div>
		<p>Use EOS tokens to purchase RAM and automatically generate seeds.</p>
		<form class="space-y-8" on:submit|preventDefault={buy}>
			<div class="space-y-2">
				<div class="table-container">
					<table class="table table-hover">
						<thead>
							<tr>
								<th />
								<th class="text-right">Seeds</th>
								<th class="text-right">RAM Cost</th>
							</tr>
						</thead>
						<tbody>
							{#each [1, 10, 100, 1000, 10000] as amount}
								<tr on:click={() => selectAmount(amount)}>
									<td>
										<input
											class="radio"
											type="radio"
											checked={$seedAmount === amount}
											on:change={() => selectAmount(amount)}
											name="amount"
											value={amount}
										/>
									</td>
									<td class="text-right">
										+ {amount}
									</td>
									<td class="text-right">
										{#key $dropPrice}
											{#if $dropPrice}
												{Asset.fromUnits(amount * $dropPrice, '4,EOS')}
											{/if}
										{/key}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- <label>
				<label class="flex items-center space-x-2">
					<input
						class="checkbox"
						type="checkbox"
						checked={$useRandomSeed}
						on:change={(e) => useRandomSeed.set(e.target?.checked)}
					/>
					<p>Randomly generate seed value</p>
				</label>
			</label> -->
			{#if !$useRandomSeed}
				<label class="label space-y-4">
					<span class="h4 font-bold">Unique Seed Value</span>
					<input class="input" type="text" placeholder="Random Seed" value={$randomSeed} />
				</label>
			{/if}
			<button
				class="btn btn-lg variant-filled w-full bg-gradient-to-br from-blue-300 to-cyan-400 box-decoration-clone"
			>
				<span><MemoryStick /></span>
				<span>Generate</span>
			</button>
			{#if $lastResult}
				<div class="table-container">
					<table class="table">
						<thead>
							<tr>
								<th
									colspan="3"
									class="variant-filled w-full bg-gradient-to-br from-green-500 to-green-700 box-decoration-clone"
								>
									<div class="lowercase text-sm text-white">
										<a href={`https://bloks.io/transaction/${$lastResultId}`}>{$lastResultId}</a>
									</div>
								</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td class="text-right">{$lastResult.seeds}</td>
								<td>Seeds in epoch {$lastResult.epoch}</td>
							</tr>
							<tr>
								<td class="text-right">{$lastResult.cost}</td>
								<td>RAM Cost</td>
							</tr>
							<tr>
								<td class="text-right">{$lastResult.refund}</td>
								<td>Overpayment refunded</td>
							</tr>
						</tbody>
					</table>
				</div>
			{/if}
		</form>
	</div>
</div>

<style lang="postcss">
</style>
