import { NextResponse } from "next/server";
import { hasLlm } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ aiReady: hasLlm() });
}
