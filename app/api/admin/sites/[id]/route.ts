import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/api";
import { deleteSite, getSite, updateSite } from "@/lib/sites";
import type { NewSite } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireUser();
  if (response) return response;
  const { id } = await params;
  try {
    const site = await getSite(id);
    if (!site) return jsonError("Not found", 404);
    return NextResponse.json({ site });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Load failed");
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireUser();
  if (response) return response;
  const { id } = await params;
  let patch: Partial<NewSite>;
  try {
    patch = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  try {
    const site = await updateSite(id, patch);
    return NextResponse.json({ site });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Update failed");
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireUser();
  if (response) return response;
  const { id } = await params;
  try {
    await deleteSite(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Delete failed");
  }
}
