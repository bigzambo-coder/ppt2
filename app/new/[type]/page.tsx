import { notFound } from "next/navigation";
import NewProjectPage from "../page";
import { isDocType } from "@/lib/doctypes/registry";

/**
 * URL-backed document selection. This keeps the first critical action working
 * even when client hydration is delayed or fails in an embedded browser.
 */
export default async function NewProjectTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!isDocType(type)) notFound();
  return <NewProjectPage initialDocType={type} />;
}
