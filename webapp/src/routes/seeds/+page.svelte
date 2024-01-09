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
	import Seeds from '../../lib/components/headers/seeds.svelte';

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
	let dropscontract: typeof import('$lib/contracts/drops').Contract;

	let ramLoader;
	let seedsLoader;

	const epochStats: Writable<[]> = writable([]);

	onMount(async () => {
		let wharf: typeof import('$lib/wharf');
		wharf = await import('$lib/wharf');
		session = wharf.session;

		const system = (await import('$lib/contracts/eosio')).Contract;
		systemcontract = new system({ client: wharf.client });

		const token = (await import('$lib/contracts/eosio-token')).Contract;
		tokencontract = new token({ client: wharf.client });

		const drops = (await import('$lib/contracts/drops')).Contract;
		dropscontract = new drops({ client: wharf.client });

		loadRamPrice();
		loadSeeds();
		ramLoader = setInterval(loadRamPrice, 2000);
		seedsLoader = setInterval(loadSeeds, 2000);
		// const contract = new system.Contract({ client });
		// console.log(contract);
	});

	onDestroy(() => {
		clearInterval(ramLoader);
		clearInterval(seedsLoader);
	});

	async function loadSeeds() {
		const test = await dropscontract
			.table('stats')
			.query({
				key_type: 'i64',
				index_position: 'secondary',
				from: $session.actor,
				to: $session.actor
			})
			.all();
		epochStats.set(test);
	}

	function get_bancor_input(out_reserve: Asset, inp_reserve: Asset, out: number): Int64 {
		const ob = out_reserve.units;
		const ib = inp_reserve.units;
		let inp = ib.multiplying(out).dividing(ob.subtracting(out));
		return inp;
	}

	async function loadRamPrice() {
		if (systemcontract) {
			const { base, quote } = await systemcontract.table('rammarket').get();
			const cost = get_bancor_input(base.balance, quote.balance, 2810000);
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
				quantity: Asset.fromUnits(amount * $dropPrice, '4,EOS'),
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

<div class="container p-4 sm:p-8 lg:p-16 mx-auto flex justify-center items-center">
	<div class="space-y-4 flex flex-col bg-surface-900 p-8 rounded-lg shadow-xl">
		<Seeds />
		<p>The seeds your account currently owns.</p>
	</div>
</div>

{#each $epochStats as epoch}
	<p>
		Epoch {epoch.epoch} - {epoch.seeds} seeds
	</p>
{/each}

<style lang="postcss">
</style>
