export const APP = {
  NAME: 'MyApp',
  VERSION: '1.0.0',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 15,
  PER_PAGE_OPTIONS: [10, 15, 25, 50] as const,
} as const;
