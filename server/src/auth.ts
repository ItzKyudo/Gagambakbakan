export function validateUsername(username: string): { ok: boolean; message?: string; clean?: string } {
  const clean = (username || '').trim();
  if (clean.length < 3 || clean.length > 10) {
    return { ok: false, message: 'Username must be between 3 and 10 characters.' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return { ok: false, message: 'Username can only contain letters, numbers, and underscores.' };
  }
  return { ok: true, clean };
}
