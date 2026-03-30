import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    strictAdFree: env.playback.strictAdFree,
    enabledProviders: env.playback.enabledProviders,
    validatedProviders: env.playback.validatedProviders,
  });
}
