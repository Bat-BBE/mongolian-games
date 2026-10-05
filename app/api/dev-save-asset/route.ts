import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "dev only" }, { status: 403 });
  }
  const name = req.nextUrl.searchParams.get("name");
  if (!name || !/^[a-zA-Z0-9_-]+\.glb$/.test(name)) {
    return NextResponse.json({ error: "invalid name" }, { status: 400 });
  }
  const buf = Buffer.from(await req.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "models", "map");
  await mkdir(dir, { recursive: true });
  const outPath = path.join(dir, name);
  await writeFile(outPath, buf);
  return NextResponse.json({ ok: true, path: `/models/map/${name}`, bytes: buf.length });
}
