import { createLogger, format, transports } from 'winston';

const { combine, timestamp, prettyPrint } = format;

export const logger = createLogger({
	level: 'debug',
	format: combine(timestamp(), prettyPrint()),
	transports: [
		new transports.Console()
		// new transports.File({ filename: 'error.log', level: 'error' }),
	]
});
