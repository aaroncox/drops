import { dropsContract, DropsContract } from './wharf';

// TODO: Client cache of combined reveals? Will allow for rapid final values
async function compute_combined_reveals(epoch: UInt64): string {
	// TODO: Check that Epoch is complete and all secrets revealed
	const reveals = await dropsContract
		.table('reveals')
		.query({
			index_position: 'secondary',
			key_type: 'i64',
			from: epoch,
			to: epoch
		})
		.all();
	return reveals
		.map((reveal) => reveal.reveal)
		.sort()
		.join('');
}

// Mirror smart contract compute_epoch_value
async function compute_epoch_value(
	epoch: UInt64,
	seed_row: DropsContract.Types.seed_row
): Checksum256 {
	if (seed_row.epoch > epoch) {
		throw Error('Seed is not valid for this epoch.');
	}
	const reveals = await compute_combined_reveals(epoch);
	const combined = [String(epoch), String(seed_row.seed), reveals].join('');
	return Checksum256.hash(Bytes.from(combined, 'utf8'));
}

async function compute(seed_row: DropsContract.Types.seed_row) {
	const epoch = UInt64.from(52);
	// in js
	console.log('js', String(await compute_epoch_value(epoch, seed_row)));
	// via contract
	const action = dropsContract.action('compute', {
		epoch,
		seed: seed_row.seed
	});
	const result = await $session.transact({ action });
	console.log('rv', String(result.returns[0].data));
}
