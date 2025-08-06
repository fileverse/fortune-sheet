export function formatTimeLeft(msLeft: number): string {
  const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}
export function timeFromNowMessage(expiryStr: string): string {
  if (!expiryStr) {
    return "0 minute";
  }
  const [mm] = expiryStr.split(":").map(Number);

  return `${mm} minute${mm !== 1 ? "s" : ""}`;
}
export function getJwtExpiry(token: string): number {
  try {
    const payloadBase64 = token?.split(".")?.[1];
    if (!payloadBase64) return 0;

    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);

    return typeof payload.exp === "number" ? payload.exp : 0;
  } catch (error) {
    return 0;
  }
}
