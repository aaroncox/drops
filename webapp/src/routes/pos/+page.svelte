<script lang="ts">
	import { writable, type Writable } from 'svelte/store';
	import { Asset, Checksum256, Serializer, UInt64, Bytes } from '@wharfkit/session';
	import type { TableRowCursor } from '@wharfkit/contract';

	import { t } from '$lib/i18n';
	import ProofOfDrop from '$lib/components/headers/pos.svelte';
	import { DropContract, session, dropsContract, oracleContract, contractKit } from '$lib/wharf';
	import { hex2bin } from '$lib/compute';
	import { epochNumber, lastEpoch, lastEpochDrop, lastEpochRevealed } from '$lib/epoch';

	const loaded = writable(false);

	const dropsLoaded = writable(0);
	const dropsProcessed = writable(0);

	const dropsFound = writable(0);
	const dropsClaimed = writable(0);
	const dropsRedeemable = writable(0);

	const demoBalance: Writable<Asset> = writable();

	const drops: Writable<DropContract.Types.drop_row[]> = writable([]);
	const validdrops: Writable<DropContract.Types.drop_row[]> = writable([]);

	session.subscribe(() => {
		loadBalance();
	});

	lastEpochDrop.subscribe((value) => {
		if (value) {
			loaddrops(value);
		} else {
			loaded.set(false);
		}
	});

	async function loadBalance() {
		if ($session) {
			const tokenContract = await contractKit.load('token.gm');
			const row = await tokenContract.table('accounts', $session.actor).get();
			if (row) {
				demoBalance.set(row.balance);
			}
		}
	}

	async function loaddrops(lastDrop: Checksum256) {
		if ($session) {
			loaded.set(false);

			// Reset all state
			dropsLoaded.set(0);
			dropsProcessed.set(0);
			dropsFound.set(0);
			dropsClaimed.set(0);
			dropsRedeemable.set(0);
			drops.set([]);
			validdrops.set([]);

			const tokenContract = await contractKit.load('token.gm');
			const claimed = await tokenContract.table('claims', 'DEMO').all();

			const from = Serializer.decode({
				data:
					Serializer.encode({ object: UInt64.from(UInt64.min) }).hexString +
					Serializer.encode({ object: $session.actor }).hexString,
				type: 'uint128'
			});

			const to = Serializer.decode({
				data:
					Serializer.encode({ object: UInt64.from(UInt64.max) }).hexString +
					Serializer.encode({ object: $session.actor }).hexString,
				type: 'uint128'
			});

			const cursor: TableRowCursor = await dropsContract.table('drop').query({
				key_type: 'i128',
				index_position: 'secondary',
				from,
				to
			});

			const accumulator: DropContract.Types.drop_row[] = [];
			while (!cursor.endReached) {
				const rows = await cursor.next();
				accumulator.push(...rows);
				dropsLoaded.set(accumulator.length);
			}

			dropsFound.set(accumulator.length);

			const validToSubmit: DropContract.Types.drop_row[] = accumulator.reduce(
				(acc: DropContract.Types.drop_row[], row: DropContract.Types.drop_row) => {
					dropsProcessed.update((s) => s + 1);
					const validEpoch = Number(row.epoch) <= Number($lastEpoch);
					if (!validEpoch) {
						return acc;
					}
					const alreadyClaimed = claimed.find((c) => c.drops.equals(row.seed));
					if (!alreadyClaimed) {
						const combined = String(lastDrop) + String(row.seed);
						const hash = Checksum256.hash(Bytes.from(combined, 'utf8'));
						const clz = hex2bin(String(hash));
						// if (String(row.drops) === '76085440965494853') {
						// 	console.table({ combined, hash, clz });
						// }
						// Difficulty is 1
						if (clz.startsWith('00')) {
							dropsRedeemable.update((s) => s + 1);
							acc.push(row);
						}
					} else {
						dropsClaimed.update((s) => s + 1);
					}
					return acc;
				},
				[]
			);
			loaded.set(true);
			drops.set(accumulator);
			validdrops.set(validToSubmit);
		}
	}

	async function claim() {
		const result = await $session.transact({
			action: {
				account: 'token.gm',
				name: 'redeem',
				authorization: [$session?.permissionLevel],
				data: {
					owner: $session.actor,
					seed_ids: $validdrops.map((s) => s.seed)
				}
			}
		});

		loaded.set(false);
		setTimeout(() => {
			loadBalance();
			loaddrops($lastEpochDrop);
		}, 1000);
	}
</script>

<div class="container p-4 sm:p-8 lg:p-16 mx-auto flex justify-center items-center">
	<div class="space-y-4 flex flex-col bg-surface-900 p-8 rounded-lg shadow-xl">
		<ProofOfDrop />
		<p>
			An experimental system to distribute tokens using a "Proof of {$t('common.itemnames')}"
			algorithm.
		</p>
		{#if !$lastEpochRevealed}
			<section class="card w-full">
				<div class="p-4 space-y-4">
					<div class="text-center h3">Waiting for next Epoch to process...</div>
					<div class="grid grid-cols-3 gap-8">
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
					</div>
					<div class="grid grid-cols-4 gap-4">
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
					</div>
				</div>
			</section>
		{:else if !$loaded}
			<section class="card w-full">
				<div class="p-4 space-y-4">
					<div class="text-center h3">
						{$dropsLoaded}
						{$t('common.itemnames')} loaded...
					</div>
					<div class="grid grid-cols-3 gap-8">
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
					</div>
					<div class="grid grid-cols-4 gap-4">
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
						<div class="placeholder animate-pulse" />
					</div>
				</div>
			</section>
		{:else if $drops.length}
			<div class="table-container text-center space-y-4">
				<div class="p-6 space-y-4">
					{#if $dropsRedeemable > 0}
						<div class="h6">
							{$t('common.itemnames')} valid for Epoch {$epochNumber}
						</div>
						<div class="h2 text-center">
							+ {$validdrops.length.toLocaleString()} DEMO
						</div>
					{:else if $dropsClaimed > 0}
						<div class="h4">
							You have already claimed all your {$t('common.itemnames')} this epoch.
						</div>
					{:else}
						<div class="h4">None of your {$t('common.itemnames')} qualified to claim.</div>
					{/if}
				</div>
				<button
					class="btn btn-lg variant-filled w-full bg-gradient-to-br from-purple-500 to-blue-300 box-decoration-clone"
					on:click={claim}
					disabled={$dropsRedeemable <= 0}
				>
					{#if $dropsRedeemable > 0}
						Claim Tokens
					{:else}
						No claim available
					{/if}
				</button>
				<p>You currently have {$demoBalance}.</p>
				<div class="text-sm">
					Out of your <span class="font-bold">{$dropsFound.toLocaleString()}</span>
					{$t('common.itemnames')},
					<span class="font-bold">{$dropsRedeemable.toLocaleString()}</span>
					are available and successful in meeting the difficulty requirement allowing you to mint tokens
					for this epoch. You have already redeemed
					<span class="font-bold">{$dropsClaimed.toLocaleString()}</span> of your valid {$t(
						'common.itemnames'
					)}.
				</div>
			</div>
		{:else}
			<div class="h4">
				<div class="p-6 space-y-4 text-center">
					<p>{$t('inventory.none')}</p>
				</div>
			</div>
		{/if}
	</div>
</div>
