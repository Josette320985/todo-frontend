/** Never log the request, response body or arbitrary error message: they can contain secrets. */
export function logApiError(context: string, error: unknown): void {
  const status = typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { status?: unknown } }).response?.status : undefined;
  console.error(context, { status: typeof status === 'number' ? status : undefined });
}
