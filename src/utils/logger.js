const winston = require('winston');

// Filter out sensitive data
const sensitiveFields = [
  'password',
  'token',
  'authorization',
  'jwtSecret',
  'sessionSecret'
];
const sensitiveDataReplacer = (key, value) => {
  return sensitiveFields.includes(key) ? '***REDACTED***' : value;
};

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json({
      replacer: sensitiveDataReplacer
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(info => {
          const { timestamp, level, message, ...rest } = info;
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(rest).length
              ? JSON.stringify(rest, sensitiveDataReplacer, 2)
              : ''
          }`;
        })
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Log unhandled exceptions to separate file
if (process.env.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  );
}

module.exports = logger;
