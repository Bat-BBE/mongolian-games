import type { WebSocket } from "ws";

const PING_MS = 25_000;

/** Railway зэрэг прокси idle TCP таслахаас сэргийлнэ */
export function attachWsKeepAlive(ws: WebSocket, label: string): void {
  const t = setInterval(() => {
    if (ws.readyState !== ws.OPEN) return;
    try {
      ws.ping();
    } catch (err) {
      console.warn(`[ws ${label}] ping error`, err);
    }
  }, PING_MS);
  ws.once("close", () => clearInterval(t));
}
