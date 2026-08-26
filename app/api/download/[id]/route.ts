import { NextRequest, NextResponse } from "next/server";
import { getDeckFile } from "@/lib/storage";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = await getDeckFile(id);
  if (!file) {
    return NextResponse.json({ error: "파일을 찾을 수 없어요." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(file.fileName)}"`,
    },
  });
}
