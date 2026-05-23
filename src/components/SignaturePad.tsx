"use client";
import { useEffect, useRef, useState } from "react";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png"];

export function SignaturePad({
  onSave, existing, label = "Signature", required = true,
}: {
  onSave: (dataUrl: string | null) => void;
  existing?: string | null;
  label?: string;
  required?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const [drawing, setDrawing] = useState(false);
  const [empty, setEmpty] = useState(!existing);
  const [pendingSave, setPendingSave] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0a0a0a";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    if (existing) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = existing;
      setEmpty(false);
    }
  }, [existing]);

  function pos(e: React.MouseEvent | React.TouchEvent) {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    if ("touches" in e && e.touches[0]) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    const me = e as React.MouseEvent;
    return { x: me.clientX - rect.left, y: me.clientY - rect.top };
  }
  function start(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const p = pos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath(); ctx.moveTo(p.x, p.y);
    setDrawing(true); setEmpty(false);
  }
  function move(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    e.preventDefault();
    const p = pos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineTo(p.x, p.y); ctx.stroke();
  }
  function end() {
    if (!drawing) return;
    setDrawing(false);
    // Don't auto-save on every mouse-up — wait for explicit Confirm click.
    // Track local "dirty" state so Confirm button can be enabled.
    setPendingSave(true);
  }

  function confirmDraw() {
    if (!canvasRef.current) return;
    onSave(canvasRef.current.toDataURL("image/png"));
    setPendingSave(false);
  }
  function clear() {
    setPendingSave(false);
    const c = canvasRef.current; const ctx = c?.getContext("2d");
    if (c && ctx) {
      const rect = c.getBoundingClientRect();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
    setEmpty(true);
    setUploadErr(null);
    if (fileRef.current) fileRef.current.value = "";
    onSave(null);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadErr(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type) && !/\.(jpe?g|png)$/i.test(file.name)) {
      setUploadErr("Only JPEG or PNG files are allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadErr(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 10 MB.`);
      return;
    }
    // Read as data URL
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      onSave(dataUrl);
      setEmpty(false);
    };
    reader.onerror = () => setUploadErr("Could not read the file.");
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="label mb-0">{label}{required && <span className="text-red-500">*</span>}</label>
        <button type="button" onClick={clear} className="text-xs text-gray-500 hover:text-red-600">Clear</button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-2 p-1 bg-gray-100 rounded-md">
        <button
          type="button"
          onClick={() => { setMode("draw"); setUploadErr(null); }}
          className={`flex-1 text-xs py-1.5 rounded font-medium transition ${
            mode === "draw" ? "bg-white text-primary-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          ✍️ Draw
        </button>
        <button
          type="button"
          onClick={() => { setMode("upload"); }}
          className={`flex-1 text-xs py-1.5 rounded font-medium transition ${
            mode === "upload" ? "bg-white text-primary-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          ⬆ Upload Image
        </button>
      </div>

      {mode === "draw" ? (
        <>
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: 120, background: "white", borderRadius: 8, touchAction: "none" }}
            className={`border cursor-crosshair ${pendingSave ? "border-amber-300 ring-2 ring-amber-100" : "border-gray-300"}`}
            onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
            onTouchStart={start} onTouchMove={move} onTouchEnd={end}
          />
          {empty && <p className="text-xs text-gray-400 mt-1 italic">Draw your signature in the box above. You can lift the pen between strokes.</p>}
          {pendingSave && (
            <div className="mt-2 flex items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <span className="text-xs text-amber-800 flex-1">
                <strong>Done drawing?</strong> Confirm to save — or keep drawing more strokes.
              </span>
              <button
                type="button"
                onClick={confirmDraw}
                className="btn btn-primary text-xs py-1.5 px-3 flex-shrink-0"
              >
                ✓ Confirm signature
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 hover:border-primary-400 transition">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            onChange={handleFile}
            className="block w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-primary-50 file:text-primary-700 file:font-semibold file:cursor-pointer hover:file:bg-primary-100"
          />
          <div className="text-[11px] text-gray-500 mt-2 space-y-0.5">
            <div>📁 <strong>Accepted formats:</strong> JPEG, JPG, PNG only</div>
            <div>📏 <strong>Maximum size:</strong> 10 MB</div>
            <div>💡 Tip: take a photo of your handwritten signature on white paper, or use a stored signature image.</div>
          </div>
          {uploadErr && (
            <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
              ⚠ {uploadErr}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SignatureView({ dataUrl, label, signedAt, name }: { dataUrl: string | null; label: string; signedAt?: Date | string | null; name?: string | null }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      {dataUrl ? (
        <img src={dataUrl} alt={label} className="max-h-16 object-contain" />
      ) : (
        <div className="h-16 flex items-center justify-center text-xs text-gray-300 italic">— unsigned —</div>
      )}
      <div className="flex justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
        <span className="font-medium text-gray-700">{name ?? ""}</span>
        <span>{signedAt ? new Date(signedAt).toLocaleDateString() : ""}</span>
      </div>
    </div>
  );
}
