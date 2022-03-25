import { createLogger, transports, format } from 'winston';

let date = new Date().toISOString();

const logFormat = format.printf(function (info) {
  return `${date} [${info.level}]: ${JSON.stringify(info.message, null, 3)}\n`;
});

const settings = {
  transports: [
    new transports.File({
      level: 'silly',
      filename: 'compose.log',
    }),
  ],
};

const settings2 = {
  transports: [new transports.Console()],
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    }),
  ),
};

export const logger = createLogger(settings);
