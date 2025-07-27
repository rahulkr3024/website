// logger.js (or utils/logger.js)

const { createLogger, format, transports } = require('winston');
const path = require('path');

// Format for logs
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ level, message, timestamp }) => `[${timestamp}] ${level}: ${message}`)
);

// Create logger
const logger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // Output to console
    new transports.Console(),

    // Write to a log file
    new transports.File({ filename: path.join(__dirname, 'logs', 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(__dirname, 'logs', 'combined.log') }),
  ],
});

// Stream for morgan (optional, for HTTP logging)
logger.stream = {
  write: message => logger.info(message.trim()),
};

module.exports = logger;