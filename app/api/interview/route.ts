import { NextRequest, NextResponse } from "next/server";
import { generateInterviewQuestions } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  const body = await request.json() as { docType?: string; fields?: Record<string, string> };
  if (body.docType !== "lecture") return NextResponse.json({ questions: [] });
  const fields = body.fields ?? {};
  if (!fields.topic?.trim()) return NextResponse.json({ error: "주제를 입력해 주세요." }, { status: 400 });
  const result = await generateInterviewQuestions({
    topic: fields.topic.trim(), institutionName: fields.institutionName?.trim() || "미정",
    audience: fields.audience?.trim(), durationMinutes: Number(fields.durationMinutes) || undefined, knownFields: fields,
  });
  return NextResponse.json(result);
}
