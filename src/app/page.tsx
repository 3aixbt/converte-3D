"use client";

import { useState } from "react";

type TaskStatus = "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<TaskStatus | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [modelUrls, setModelUrls] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useOwnKey, setUseOwnKey] = useState(false);
  const [userKey, setUserKey] = useState("");

  const toDataUri = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const start = async () => {
    setError(null);
    setModelUrls(null);
    setTaskId(null);
    setStatus(null);
    setProgress(0);

    if (!file) {
      setError("Seleccione uma imagem.");
      return;
    }
    if (useOwnKey && !userKey.trim()) {
      setError("Introduza a sua Meshy API key.");
      return;
    }

    setLoading(true);
    try {
      const imageDataUri = await toDataUri(file);
      const res = await fetch("/api/meshy/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUri, apiKey: useOwnKey ? userKey : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data?.error || data));

      const id = data.taskId;
      setTaskId(id);

      let done = false;
      while (!done) {
        await new Promise((r) => setTimeout(r, 2500));
        const sres = await fetch(`/api/meshy/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, apiKey: useOwnKey ? userKey : undefined }),
        });
        const sdata = await sres.json();
        if (!sres.ok) throw new Error(JSON.stringify(sdata?.error || sdata));

        const s = sdata.status as TaskStatus;
        setStatus(s);
        setProgress(sdata.progress || 0);

        if (s === "SUCCEEDED") {
          setModelUrls(sdata.model_urls || null);
          done = true;
        }
        if (s === "FAILED" || s === "CANCELED") {
          throw new Error(sdata?.error_message || "Geração falhou.");
        }
      }
    } catch (e: any) {
      setError(e?.message || "Erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-3xl font-semibold">Foto → 3D (Meshy)</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Faça upload de uma imagem. A aplicação gera um modelo 3D e disponibiliza
          OBJ/GLB. Para impressão, pode descarregar STL (conversão automática).
        </p>

        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <label className="block text-sm font-medium">Chave Meshy</label>
            <div className="mt-2 flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="keymode"
                  checked={!useOwnKey}
                  onChange={() => setUseOwnKey(false)}
                />
                Usar chave do servidor (mais seguro)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="keymode"
                  checked={useOwnKey}
                  onChange={() => setUseOwnKey(true)}
                />
                Usar a minha chave
              </label>
            </div>

            {useOwnKey && (
              <input
                type="password"
                className="mt-2 block w-full rounded border px-3 py-2 text-sm"
                placeholder="MESHY_API_KEY"
                value={userKey}
                onChange={(e) => setUserKey(e.target.value)}
              />
            )}
          </div>

          <label className="block text-sm font-medium">Imagem</label>
          <input
            type="file"
            accept="image/png,image/jpeg"
            className="mt-2 block w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <button
            className="mt-4 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            onClick={start}
            disabled={loading}
          >
            {loading ? "A gerar…" : "Gerar 3D"}
          </button>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {taskId && (
            <div className="mt-4 text-sm text-zinc-700">
              <div>Task: {taskId}</div>
              <div>Estado: {status || "—"}</div>
              <div>Progresso: {progress}%</div>
            </div>
          )}

          {modelUrls && (
            <div className="mt-4 rounded-md bg-zinc-50 p-3 text-sm">
              <div className="font-medium">Downloads</div>
              {modelUrls.glb && (
                <a className="block underline" href={modelUrls.glb} target="_blank">
                  GLB
                </a>
              )}
              {modelUrls.obj && (
                <a className="block underline" href={modelUrls.obj} target="_blank">
                  OBJ
                </a>
              )}
              {modelUrls.obj && (
                <a
                  className="mt-2 inline-block rounded bg-zinc-900 px-3 py-2 text-white"
                  href={`/api/meshy/convert?url=${encodeURIComponent(modelUrls.obj)}`}
                >
                  Descarregar STL
                </a>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          Nota: resultados variam com a qualidade e ângulos da foto. Para objectos
          complexos, usar 3–6 imagens melhora a fidelidade. (Versão inicial usa 1 imagem.)
        </p>
      </main>
    </div>
  );
}
