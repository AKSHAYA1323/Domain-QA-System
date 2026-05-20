import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = "AIzaSyA3_XPhnBKDIeb04Yild7_iu5RX9VRjlVw";
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
