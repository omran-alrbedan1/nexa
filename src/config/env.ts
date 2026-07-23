export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
  APP_NAME: (import.meta.env.VITE_APP_NAME as string) || 'Marketplace',
  REVERB_APP_ID: import.meta.env.VITE_REVERB_APP_ID as string,
  REVERB_KEY: import.meta.env.VITE_REVERB_KEY as string,
  REVERB_SECRET: import.meta.env.VITE_REVERB_SECRET as string,
  REVERB_HOST: import.meta.env.VITE_REVERB_HOST as string,
  REVERB_PORT: Number(import.meta.env.VITE_REVERB_PORT) || 8869,
  REVERB_SCHEME: (import.meta.env.VITE_REVERB_SCHEME as string) || 'https',
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
} as const;

if (!env.API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined in .env file');
}
