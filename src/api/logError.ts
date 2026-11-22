/** Never log the request, response body or arbitrary error message: they can contain secrets. */
export function logApiError(context: string, error: unknown): void {
  const value = typeof error === 'object' && error !== null
    ? error as { status?: unknown; response?: { status?: unknown } } : {};
  const status = value.status ?? value.response?.status;
  console.error(context, { status: typeof status === 'number' ? status : undefined });
}
