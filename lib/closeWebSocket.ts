export function closeWebSocketQuiet(ws: WebSocket | null | undefined): void {
  if (!ws) return;
  const { readyState } = ws;
  if (readyState === WebSocket.CLOSED || readyState === WebSocket.CLOSING) return;
  if (readyState === WebSocket.CONNECTING) {
    ws.addEventListener(
      "open",
      () => {
        try {
          ws.close(1000);
        } catch {
          /* noop */
        }
      },
      { once: true },
    );
    return;
  }
  if (readyState === WebSocket.OPEN) {
    try {
      ws.close(1000);
    } catch {
      /* noop */
    }
  }
}
