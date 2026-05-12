/**
 * Хоёр тоглогч ижил 6 тэмдэгтийн өрөөний кодоор нэг лобби-д нэгдэж байгаа эсэхийг
 * MatchRoomManager-оор шууд баталгаажуулна (WebSocket биш, зөвхөн өрөөний логик).
 *
 * Ажиллуулах: npm run verify:match --workspace mongolian-games-server
 */
import { WebSocket } from "ws";
import { MatchRoomManager } from "../src/realtime/matchRooms.js";

const OPEN = WebSocket.OPEN;

function fakeWs(): WebSocket {
  return {
    readyState: OPEN,
    send: () => {},
    close: () => {},
    on: () => {},
    once: () => {},
    off: () => {},
  } as unknown as WebSocket;
}

function main(): void {
  const mgr = new MatchRoomManager();
  const pref = "AB2CDE";

  const hostId = mgr.newPlayerId();
  const guestId = mgr.newPlayerId();

  const a = mgr.createRoom({
    hostId,
    hostWs: fakeWs(),
    displayName: "Host",
    gameType: "horse-race",
    gameSlug: "horse-race",
    maxPlayers: 4,
    preferredCode: pref,
  });
  if (!a.ok) {
    console.error("FAIL: first create should succeed", a);
    process.exit(1);
  }
  if (a.room.players.size !== 1) {
    console.error("FAIL: room should have 1 player");
    process.exit(1);
  }

  const b = mgr.createRoom({
    hostId: guestId,
    hostWs: fakeWs(),
    displayName: "Guest",
    gameType: "horse-race",
    gameSlug: "horse-race",
    maxPlayers: 4,
    preferredCode: pref,
  });
  if (b.ok || b.error !== "code_taken") {
    console.error("FAIL: second create should be code_taken", b);
    process.exit(1);
  }

  const j = mgr.joinRoom({
    code: pref,
    playerId: guestId,
    ws: fakeWs(),
    displayName: "Guest",
  });
  if (!j.ok) {
    console.error("FAIL: join should succeed", j);
    process.exit(1);
  }

  const room = j.room;
  if (room.code !== pref || room.players.size !== 2) {
    console.error("FAIL: expected 2 players in same room", room.players.size);
    process.exit(1);
  }
  if (!room.players.has(hostId) || !room.players.has(guestId)) {
    console.error("FAIL: both player ids should be in room");
    process.exit(1);
  }

  console.log("OK: two players share one lobby via preferredCode (station+game flow).");
  console.log(`   room=${room.code} players=${room.players.size} host=${room.hostId}`);
}

main();
