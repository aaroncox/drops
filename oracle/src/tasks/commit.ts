import { Bytes, Checksum256, Name, PrivateKey, Serializer, UInt64 } from '@wharfkit/antelope';
import { logger } from '../lib/logger';
import { dropsContract, session } from '../lib/wharf';
import { db } from '..';

export async function epochCommit() {
	logger.debug('Determining if a commit must be submitted for the Epoch.');

	const epochs = await dropsContract
		.table('epochs')
		.query({
			from: UInt64.from(0),
			to: UInt64.from(0),
			index_position: 'secondary'
		})
		.all();

	if (!epochs.length) {
		logger.error('No epochs found to process.');
		return;
	}

	const epochsInvolvedIn = epochs.filter((epoch) =>
		Serializer.objectify(epoch).oracles.includes(String(session.actor))
	);
	logger.debug('active epochs involved in', Serializer.objectify(epochsInvolvedIn));

	for (const epoch of epochsInvolvedIn) {
		const existingCommits = await dropsContract
			.table('commits')
			.query({
				from: epoch.epoch,
				to: epoch.epoch,
				index_position: 'secondary',
				key_type: 'i64'
			})
			.all();

		const hasCommitted = !!existingCommits.find((row) => row.oracle.equals(session.actor));
		logger.debug('Has this oracle committed?', { hasCommitted });
		if (!hasCommitted) {
			const commitValue = generateCommitValue(Number(epoch.epoch));
			const action = dropsContract.action('commit', {
				epoch: epoch.epoch,
				oracle: session.actor,
				commit: commitValue
			});
			session.transact({ action });
			logger.info(`Committed secret for Epoch ${epoch.epoch}.`);
		}
	}
}

/**
 * Generates commit/reveal data, stores it, and returns commit value.
 */
function generateCommitValue(epoch: Number) {
	// Make sure the table exists in sqlite
	ensureTableExists();

	// Determine if commit value already exists
	const rowExist = db.query(`SELECT * FROM secrets WHERE epoch=$epoch;`);
	const doesRowExist: any = rowExist.get({ $epoch: epoch });
	if (doesRowExist) {
		logger.debug('Commit value already found in database, returning', { doesRowExist });
		return doesRowExist.commitValue;
	}

	// Randomly generated value the revealed secret will be based on
	const secret = String(PrivateKey.generate('K1'));

	// Reveal: The secret which will be revealed in the future
	const revealValue = Checksum256.hash(Bytes.from(secret, 'utf8').array).hexString;
	logger.debug('Reveal value generated', { revealValue });

	// Commit: A hash thats submitted to prove the secret has already been decided
	const commitValue = Checksum256.hash(Bytes.from(revealValue, 'utf8').array).hexString;
	logger.debug('Commit value generated', { commitValue });

	// Persist the data between restarts
	const insertCommit = db.prepare(
		'INSERT INTO secrets (epoch, commitValue, revealValue) VALUES($epoch, $commitValue, $revealValue)'
	);
	insertCommit.run({
		$epoch: epoch,
		$commitValue: commitValue,
		$revealValue: revealValue
	});

	return commitValue;
}

function ensureTableExists() {
	// Ensure secrets table exists
	const tableExists = db.query(
		`SELECT name FROM sqlite_master WHERE type='table' AND name='secrets';`
	);
	const doesTableExist = tableExists.get();
	if (!doesTableExist) {
		const query = db.query(`create table secrets (
	        epoch INTEGER PRIMARY KEY,
	        commitValue TEXT NOT NULL,
	        revealValue TEXT NOT NULL
	    )`);
		query.run();
	}
}
