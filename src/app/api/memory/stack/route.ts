import { NextRequest, NextResponse } from "next/server";
import { addMemory, NS } from "@/lib/supermemory";

export async function POST(req: NextRequest) {
  const { deviceId, stack } = await req.json();
  if (!deviceId || !stack) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const id = await addMemory(stack, NS.static(deviceId));
  return NextResponse.json({ id });
}
