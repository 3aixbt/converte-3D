import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { id, apiKey: clientKey } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const apiKey = clientKey || process.env.MESHY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing MESHY_API_KEY" }, { status: 500 });
    }

    const res = await fetch(`https://api.meshy.ai/openapi/v1/image-to-3d/${id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
