export function createId(prefix: string): string {
  const random = crypto.getRandomValues(new Uint32Array(2)).join('');
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function createAccountId(): string {
  const first = Math.floor(100000 + Math.random() * 900000);
  const second = Math.floor(1000 + Math.random() * 9000);
  return `${first}${second}`;
}