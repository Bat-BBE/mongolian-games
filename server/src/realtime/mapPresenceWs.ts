import { WebSocketServer } from "ws";
import { MapPresenceHub } from "./mapPresence.js";

/** `noServer: true` — HTTP `upgrade`-ийг `index.ts` дээр нэг газраас дамжуулна (Express-тай зөрчилгүй). */
export function createMapPresenceWebSocketServer(
  hub: MapPresenceHub,
): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });
  wss.on("connection", (ws) => {
    hub.addConnection(ws);
  });
  return wss;
}
