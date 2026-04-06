const onlineConnections = new Map<string, number>();

export function markUserOnline(userId: string): void {
  const count = onlineConnections.get(userId) || 0;
  onlineConnections.set(userId, count + 1);
}

export function markUserOffline(userId: string): void {
  const count = onlineConnections.get(userId) || 0;
  if (count <= 1) {
    onlineConnections.delete(userId);
    return;
  }

  onlineConnections.set(userId, count - 1);
}

export function isUserOnline(userId: string): boolean {
  return (onlineConnections.get(userId) || 0) > 0;
}
