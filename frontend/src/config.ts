import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  VITE_API_URL: z.string().default(''),
  VITE_WS_URL: z.string().default('ws://localhost:8000'),
  VITE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

// Parse environment variables
const env = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
  VITE_ENV: import.meta.env.VITE_ENV,
});

const config = {
  API_BASE_URL: env.VITE_API_URL,
  WS_URL: env.VITE_WS_URL,
  ENV: env.VITE_ENV,
  API_TIMEOUT: 30000,
  WS_RECONNECT_INTERVAL: 5000,
  WS_MAX_RECONNECT_ATTEMPTS: 5,
  WS_PING_INTERVAL: 30000,
  getWSEndpoint: (path: string = '/ws') => `${env.VITE_WS_URL}${path}`,
  getAPIEndpoint: (path: string) => `${env.VITE_API_URL}${path}`,
} as const;

export default config;