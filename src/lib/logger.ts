import winston from 'winston'

const isDevelopment = process.env.NODE_ENV === 'development'

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`
    if (Object.keys(meta).length > 0 && meta.stack) {
      msg += `\n${meta.stack}`
    } else if (Object.keys(meta).length > 0) {
      msg += `\n${JSON.stringify(meta, null, 2)}`
    }
    return msg
  })
)

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  format: logFormat,
  defaultMeta: { service: 'smartbuild-api' },
  transports: [
    // Write errors to error.log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
})

// Add console transport in development
if (isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  )
}

// Helper functions for structured logging
export const logAPI = {
  request: (method: string, path: string, meta?: Record<string, unknown>) => {
    logger.info(`${method} ${path}`, { type: 'request', ...meta })
  },
  response: (method: string, path: string, status: number, duration: number, meta?: Record<string, unknown>) => {
    logger.info(`${method} ${path} - ${status}`, { 
      type: 'response', 
      status, 
      duration: `${duration}ms`,
      ...meta 
    })
  },
  error: (method: string, path: string, error: Error, meta?: Record<string, unknown>) => {
    logger.error(`${method} ${path} - Error`, {
      type: 'error',
      error: error.message,
      stack: error.stack,
      ...meta,
    })
  },
}

export const logAuth = {
  login: (userId: string, email: string, success: boolean) => {
    logger.info('User login', { type: 'auth', userId, email, success })
  },
  logout: (userId: string) => {
    logger.info('User logout', { type: 'auth', userId })
  },
  tokenRefresh: (userId: string) => {
    logger.info('Token refresh', { type: 'auth', userId })
  },
  failed: (email: string, reason: string) => {
    logger.warn('Authentication failed', { type: 'auth', email, reason })
  },
}

export const logDB = {
  query: (operation: string, model: string, duration: number) => {
    logger.debug('Database query', { type: 'database', operation, model, duration: `${duration}ms` })
  },
  error: (operation: string, model: string, error: Error) => {
    logger.error('Database error', {
      type: 'database',
      operation,
      model,
      error: error.message,
      stack: error.stack,
    })
  },
}

export const logCache = {
  hit: (key: string) => {
    logger.debug('Cache hit', { type: 'cache', key, hit: true })
  },
  miss: (key: string) => {
    logger.debug('Cache miss', { type: 'cache', key, hit: false })
  },
  set: (key: string, ttl?: number) => {
    logger.debug('Cache set', { type: 'cache', key, ttl })
  },
  invalidate: (key: string) => {
    logger.debug('Cache invalidate', { type: 'cache', key })
  },
}

export default logger
