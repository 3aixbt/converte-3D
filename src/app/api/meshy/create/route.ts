import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { imageDataUri, options, apiKey: clientKey } = await req.json();
    if (!imageDataUri) {
      return NextResponse.json({ error: "imageDataUri is required" }, { status: 400 });
    }

    const apiKey = clientKey || process.env.MESHY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing MESHY_API_KEY" }, { status: 500 });
    }

    const body = {
      image_url: imageDataUri,
      ai_model: "latest",
      model_type: options?.model_type || "standard",
      topology: options?.topology || "triangle",
      target_polycount: options?.target_polycount || 30000,
      symmetry_mode: options?.symmetry_mode || "auto",
      should_remesh: options?.should_remesh ?? true,
      should_texture: options?.should_texture ?? false,
      moderation: options?.moderation ?? false,
    };

    const res = await fetch("https://api.meshy.ai/openapi/v1/image-to-3d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json({ taskId: data?.result, raw: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
