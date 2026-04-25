/**
 * Unmount/StrictMode cleanup: CONNECTING эхлүүлсний дараа `close()` дуудахад Chrome
 * «WebSocket is closed before the connection is established» гэж шуугиана.
 * `CONNECTING` үед `open` болоход л хаана.
 */
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
