import _ from 'lodash';
import winston from 'winston';

const { combine, timestamp, json, errors, colorize, printf } = winston.format;

const prettierJsonFormat = printf(function (info) {
    const level = info.level;
    const timestamp = info.timestamp;
    const infoContent: Omit<winston.Logform.TransformableInfo, 'level' | 'timestamp'> = _.omit(
        info,
        ['level', 'timestamp']
    );
    return `${timestamp} - ${level}: ${JSON.stringify(infoContent, null, 4)}\n`;
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        errors({ stack: true }),
        timestamp(),
        json(),
        colorize({ level: true }),
        prettierJsonFormat
    ),
    transports: [new winston.transports.Console()]
});

export default logger;
