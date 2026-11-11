export const errorMessage = (err: unknown, fallback = 'Something went wrong. Please try again.') =>
  err instanceof Error && err.message ? err.message : fallback;
