export function formatTimeLeft(msLeft: number): string {
  const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function isExpired(createdAt: number): boolean {
  const expiryTs = createdAt + 60 * 60 * 1000;
  return Date.now() > expiryTs;
}
export function timeFromNowMessage(expiryStr: string): string {
  if (!expiryStr) {
    return "0 minute";
  }
  const [mm] = expiryStr.split(":").map(Number);

  return `${mm} minute${mm !== 1 ? "s" : ""}`;
}
