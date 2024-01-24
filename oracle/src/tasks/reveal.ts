import { Bytes, Checksum256, PrivateKey, Serializer, UInt64 } from '@wharfkit/antelope';
import { logger } from '../lib/logger';
import { dropsContract, oracleContract, session } from '../lib/wharf';
import { db } from '..';

export async function epochReveal() {
	logger.debug('Determining if a reveal must be submitted for any previous Epoch.');

	const from = Serializer.decode({
		data:
			Serializer.encode({ object: UInt64.from(UInt64.min) }).hexString +
			Serializer.encode({ object: session.actor }).hexString,
		type: 'uint128'
	});

	const to = Serializer.decode({
		data:
			Serializer.encode({ object: UInt64.from(UInt64.max) }).hexString +
			Serializer.encode({ object: session.actor }).hexString,
		type: 'uint128'
	});

	const commits = await oracleContract
		.table('commit')
		.query({
			from,
			to,
			index_position: 'tertiary',
			key_type: 'i128'
		})
		.all();

	if (!commits.length) {
		logger.error('Oracle has never committed data.');
		return;
	}

	const reveals = await oracleContract
		.table('reveal')
		.query({
			from,
			to,
			index_position: 'tertiary',
			key_type: 'i128'
		})
		.all();

	for (const commit of commits) {
		const hasRevealed = !!reveals.find((reveal) => reveal.epoch.equals(commit.epoch));
		logger.debug('Checking if oracle has revealed', { hasRevealed, epoch: String(commit.epoch) });
		if (!hasRevealed) {
			const epoch = await dropsContract.table('epoch').get(commit.epoch);
			const advanceTime = epoch?.end.toDate();
			if (advanceTime && new Date() > advanceTime) {
				const value = getRevealValue(commit.epoch);
				if (value) {
					const action = oracleContract.action('reveal', {
						epoch: commit.epoch,
						oracle: session.actor,
						reveal: value
					});
					session.transact({ action });
					logger.info(`Revealed secret for Epoch ${commit.epoch}.`);
				}
			}
		}
	}
}

function getRevealValue(epoch: UInt64) {
	const query = db.query(`SELECT * FROM secrets WHERE epoch=$epoch;`);
	const existingRow: any = query.get({ $epoch: Number(epoch) });
	if (!existingRow) {
		logger.error('Trying to reveal for a row that doesnt exist.', { existingRow });
		return;
	}
	return existingRow.revealValue;
}
