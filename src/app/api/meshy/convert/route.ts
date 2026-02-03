import { NextResponse } from "next/server";
import { OBJLoader, STLExporter } from "three-stdlib";
import type { Object3D, Mesh } from "three";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch OBJ" }, { status: 502 });
    }

    const objText = await res.text();
    const loader = new OBJLoader();
    const object = loader.parse(objText);

    // Ensure geometry is in world space
    object.traverse((child: Object3D) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        mesh.updateMatrixWorld(true);
      }
    });

    const exporter = new STLExporter();
    const stlResult = exporter.parse(object, { binary: true });
    const stlBuffer = stlResult instanceof DataView 
      ? Buffer.from(stlResult.buffer) 
      : Buffer.from(stlResult as unknown as ArrayBuffer);

    return new Response(stlBuffer, {
      headers: {
        "Content-Type": "application/sla",
        "Content-Disposition": "attachment; filename=mesh.stl",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
