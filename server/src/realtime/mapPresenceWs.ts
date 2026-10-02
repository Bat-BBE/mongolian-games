import type { WebSocket } from "ws";
import { WebSocketServer } from "ws";

export function createMapPresenceWebSocketServer(router: {
  addConnection(ws: WebSocket): void;
}): WebSocketServer {
  const wss = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false,
  });
  wss.on("connection", (ws) => {
    router.addConnection(ws);
  });
  return wss;
}
