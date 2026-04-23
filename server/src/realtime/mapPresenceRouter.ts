import type { WebSocket } from "ws";
import { MapPresenceHub } from "./mapPresence.js";

/** Нэг «газрын өрөөнд» хамгийн ихдээ ийм олон тоглогч — дараагийн холболт шинэ shard руу орно. */
export const MAP_PRESENCE_MAX_PER_SHARD = 20;

export class MapPresenceShardRouter {
  private readonly shards: MapPresenceHub[] = [];

  addConnection(ws: WebSocket): void {
    let hub = this.shards.find(
      (h) => h.peerCount < MAP_PRESENCE_MAX_PER_SHARD,
    );
    if (!hub) {
      hub = new MapPresenceHub();
      this.shards.push(hub);
    }
    const shardIndex = this.shards.indexOf(hub);
    hub.addConnection(ws, shardIndex);
  }
}
