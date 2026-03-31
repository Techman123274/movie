import { NextResponse } from "next/server";
import { searchCatalog } from "@/lib/tmdb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchCatalog(query, 6);

  if (results === null) {
    return NextResponse.json({ results: [] }, { status: 503 });
  }

  return NextResponse.json({ results });
}
