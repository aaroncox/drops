// // TODO: Client cache of combined reveals? Will allow for rapid final values
// async function compute_combined_reveals(epoch: UInt64): string {
// 	// TODO: Check that Epoch is complete and all secrets revealed
// 	const reveals = await dropsContract
// 		.table('reveal')
// 		.query({
// 			index_position: 'secondary',
// 			key_type: 'i64',
// 			from: epoch,
// 			to: epoch
// 		})
// 		.all();
// 	return reveals
// 		.map((reveal) => reveal.reveal)
// 		.sort()
// 		.join('');
// }

// // Mirror smart contract compute_epoch_value
// async function compute_epoch_value(
// 	epoch: UInt64,
// 	drop_row: DropsContract.Types.drop_row
// ): Checksum256 {
// 	if (drop_row.epoch > epoch) {
// 		throw Error('Drop is not valid for this epoch.');
// 	}
// 	const reveals = await compute_combined_reveals(epoch);
// 	const combined = [String(epoch), String(drop_row.drops), reveals].join('');
// 	return Checksum256.hash(Bytes.from(combined, 'utf8'));
// }

// async function compute(drop_row: DropsContract.Types.drop_row) {
// 	const epoch = UInt64.from(52);
// 	// in js
// 	console.log('js', String(await compute_epoch_value(epoch, drop_row)));
// 	// via contract
// 	const action = dropsContract.action('compute', {
// 		epoch,
// 		drops: drop_row.drops
// 	});
// 	const result = await $session.transact({ action });
// 	console.log('rv', String(result.returns[0].data));
// }

export function hex2bin(hex: string) {
	hex = hex.replace('0x', '').toLowerCase();
	var out = '';
	for (var c of hex) {
		switch (c) {
			case '0':
				out += '0000';
				break;
			case '1':
				out += '0001';
				break;
			case '2':
				out += '0010';
				break;
			case '3':
				out += '0011';
				break;
			case '4':
				out += '0100';
				break;
			case '5':
				out += '0101';
				break;
			case '6':
				out += '0110';
				break;
			case '7':
				out += '0111';
				break;
			case '8':
				out += '1000';
				break;
			case '9':
				out += '1001';
				break;
			case 'a':
				out += '1010';
				break;
			case 'b':
				out += '1011';
				break;
			case 'c':
				out += '1100';
				break;
			case 'd':
				out += '1101';
				break;
			case 'e':
				out += '1110';
				break;
			case 'f':
				out += '1111';
				break;
			default:
				return '';
		}
	}

	return out;
}
