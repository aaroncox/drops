import { logger } from '../lib/logger';
import { seedContract, session } from '../lib/wharf';

export async function epochAdvance() {
	logger.debug('Determining if the Epoch needs to be advanced.');

	const state = await seedContract.table('state').get();
	if (!state) logger.warn('Could not retrieve contract state during epoch advancement.');

	const epoch = await seedContract.table('epoch').get(state?.epoch);
	if (!epoch) logger.warn('Could not retrieve current epoch during epoch advancement.');

	const advanceTime = epoch?.end.toDate();
	if (advanceTime && new Date() > advanceTime) {
		logger.debug('Epoch requires advancing.', { advanceTime, currentTime: new Date() });
		try {
			const action = seedContract.action('advance', {});
			await session.transact({ action });
			logger.info(`Advancing epoch.`);
		} catch (e) {
			logger.error('Error advancing epoch: ', e);
		}
	} else {
		logger.debug('Epoch does not need to be advanced.');
	}
}
