/**
 * Firestore rejected a request because the security rules said no.
 *
 * Distinguished from a genuine failure so the UI can say "not yet permitted"
 * instead of "something broke" — the two need very different copy.
 */
export class PermissionDeniedError extends Error {
  readonly resource: string;

  constructor(resource: string) {
    super(`Permission denied reading ${resource}`);
    this.name = 'PermissionDeniedError';
    this.resource = resource;
  }
}

export function isPermissionDenied(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === 'string') return err.toLowerCase().includes('permission');
  if (err instanceof PermissionDeniedError) return true;
  const code = (err as { code?: string })?.code ?? '';
  const name = (err as { name?: string })?.name ?? '';
  const message = (err as { message?: string })?.message ?? '';
  return code === 'permission-denied'
    || name === 'PermissionDeniedError'
    || message.includes('Missing or insufficient permissions');
}
