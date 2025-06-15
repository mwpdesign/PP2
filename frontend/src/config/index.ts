import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  VITE_API_URL: z.string().default(''),
  VITE_WS_URL: z.string().default('ws://localhost:8000'),
  VITE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  VITE_JWT_SECRET: z.string().default('healthcare-ivr-development-secret-key-2025'),
  VITE_API_TIMEOUT: z.number().default(30000),
  VITE_WS_RECONNECT_INTERVAL: z.number().default(5000),
  VITE_WS_MAX_RECONNECT_ATTEMPTS: z.number().default(5),
  VITE_WS_PING_INTERVAL: z.number().default(30000),
});

// Parse environment variables
const env = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
  VITE_ENV: import.meta.env.VITE_ENV,
  VITE_JWT_SECRET: import.meta.env.VITE_JWT_SECRET,
  VITE_API_TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT),
  VITE_WS_RECONNECT_INTERVAL: Number(import.meta.env.VITE_WS_RECONNECT_INTERVAL),
  VITE_WS_MAX_RECONNECT_ATTEMPTS: Number(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS),
  VITE_WS_PING_INTERVAL: Number(import.meta.env.VITE_WS_PING_INTERVAL),
});

// API endpoints
const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REFRESH: '/api/v1/auth/refresh',
    VERIFY: '/api/v1/auth/verify',
    LOGOUT: '/api/v1/auth/logout',
  },
  IVR: {
    BASE: '/api/v1/ivr',
    QUEUE: '/api/v1/ivr/queue',
    SUBMIT: '/api/v1/ivr/submit',
    BATCH: '/api/v1/ivr/batch',
  },
  PATIENTS: {
    BASE: '/api/v1/patients',
    SEARCH: '/api/v1/patients/search',
  },
  PROVIDERS: {
    BASE: '/api/v1/providers',
    SEARCH: '/api/v1/providers/search',
  },
} as const;

const config = {
  API_BASE_URL: env.VITE_API_URL,
  WS_URL: env.VITE_WS_URL,
  ENV: env.VITE_ENV,
  JWT_SECRET: env.VITE_JWT_SECRET,
  API_TIMEOUT: env.VITE_API_TIMEOUT,
  WS_RECONNECT_INTERVAL: env.VITE_WS_RECONNECT_INTERVAL,
  WS_MAX_RECONNECT_ATTEMPTS: env.VITE_WS_MAX_RECONNECT_ATTEMPTS,
  WS_PING_INTERVAL: env.VITE_WS_PING_INTERVAL,
  ENDPOINTS: API_ENDPOINTS,
  getWSEndpoint: (path: string = '/api/v1/realtime/ws') => `${env.VITE_WS_URL}${path}`,
  getAPIEndpoint: (path: string) => `${env.VITE_API_URL}${path}`,
  isDevelopment: () => env.VITE_ENV === 'development',
  isProduction: () => env.VITE_ENV === 'production',
  isTest: () => env.VITE_ENV === 'test',
} as const;

export type Config = typeof config;
export default config;