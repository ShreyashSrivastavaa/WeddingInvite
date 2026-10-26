import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'password',
      '*.password',
      'currentPassword',
      'newPassword',
      'passwordHash',
      'token',
      '*.token',
      'tokenHash',
      'phone',
      '*.phone',
      'phoneE164',
      '*.phoneE164',
      'email',
      '*.email',
      'cookie',
    ],
    censor: '[REDACTED]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
