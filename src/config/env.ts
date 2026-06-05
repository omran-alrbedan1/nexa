export const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
  APP_NAME: (import.meta.env.VITE_APP_NAME as string) || 'MyApp',
} as const;

if (!env.API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL is not defined in .env file');
}
