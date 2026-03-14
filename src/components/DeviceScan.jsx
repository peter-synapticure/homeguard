import { useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Camera, Loader, CheckCircle2, AlertTriangle, X, RotateCcw, ChevronRight } from "lucide-react";

const CL = {
  main: "#7c3aed", dark: "#5b21b6", light: "#f5f3ff", mid: "#ede9fe",
  border: "#ddd6fe", ring: "#8b5cf6",
  ok: { main: "#059669", light: "#ecfdf5" },
};

const s = {
  card: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)" },
};

const inp = {
  background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 12,
  padding: "12px 14px", color: "#0f172a", fontSize: 14, width: "100%",
  outline: "none", boxSizing: "border-box",
};

export default function DeviceScan({ homeId, userId, itemId, onComplete, onCancel }) {
  const [phase, setPhase] = useState("idle"); // idle, uploading, scanning, result, error
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [device, setDevice] = useState(null);
  const [photoPath, setPhotoPath] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const scan = async () => {
    if (!file) return;
    try {
      // Upload photo to storage
      setPhase("uploading");
      const fileId = crypto.randomUUID();
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${homeId}/device-scans/${fileId}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("reports")
        .upload(path, file, { contentType: file.type });

      if (upErr) throw new Error("Upload failed: " + upErr.message);
      setPhotoPath(path);

      // Call edge function
      setPhase("scanning");
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("scan-device", {
        body: { photoPath: path, homeId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      if (!res.data?.device) throw new Error("No device data returned");

      setDevice(res.data.device);
      setPhase("result");
    } catch (err) {
      setError(err.message);
      setPhase("error");
    }
  };

  const retry = () => {
    setPhase("idle");
    setFile(null);
    setPreview(null);
    setDevice(null);
    setPhotoPath(null);
    setError(null);
  };

  const accept = () => {
    if (device && photoPath) {
      onComplete(device, photoPath);
    }
  };

  // Idle — file picker
  if (phase === "idle") {
    return (
      <div style={{ ...s.card, marginBottom: 16, border: `1.5px solid ${CL.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            {itemId ? "Scan Device" : "Add Device from Photo"}
          </div>
          <div onClick={onCancel} style={{ cursor: "pointer", color: "#94a3b8" }}>
            <X size={18} />
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleFile}
        />

        {!preview ? (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: "2px dashed #e2e8f0", borderRadius: 14, padding: 40,
              textAlign: "center", cursor: "pointer", background: "#f8fafc",
              transition: "border-color 0.2s",
            }}
          >
            <Camera size={32} color={CL.main} style={{ margin: "0 auto 10px", display: "block" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Take photo or choose file</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
              Aim at the device nameplate or label for best results
            </div>
          </div>
        ) : (
          <div>
            <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 16, background: "#f1f5f9" }}>
              <img src={preview} alt="Device preview" style={{ width: "100%", display: "block", maxHeight: 300, objectFit: "contain" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div
                onClick={() => { setFile(null); setPreview(null); fileRef.current?.click(); }}
                style={{ flex: 1, padding: 12, borderRadius: 12, textAlign: "center", fontWeight: 600, fontSize: 14, cursor: "pointer", background: "#f1f5f9", color: "#64748b" }}
              >
                Retake
              </div>
              <div
                onClick={scan}
                style={{
                  flex: 1, padding: 12, borderRadius: 12, textAlign: "center", fontWeight: 600, fontSize: 14, cursor: "pointer",
                  background: `linear-gradient(135deg,${CL.main},${CL.dark})`, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Camera size={16} />Scan
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Uploading / Scanning
  if (phase === "uploading" || phase === "scanning") {
    return (
      <div style={{ ...s.card, marginBottom: 16, border: `1.5px solid ${CL.border}`, textAlign: "center", padding: 32 }}>
        {preview && (
          <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 16, background: "#f1f5f9", opacity: 0.7 }}>
            <img src={preview} alt="" style={{ width: "100%", display: "block", maxHeight: 200, objectFit: "contain" }} />
          </div>
        )}
        <Loader size={28} color={CL.main} style={{ animation: "spin 1.5s linear infinite", margin: "0 auto 12px", display: "block" }} />
        <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>
          {phase === "uploading" ? "Uploading photo..." : "Analyzing device..."}
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
          {phase === "scanning" ? "AI is reading labels and identifying the device" : "This won't take long"}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // Error
  if (phase === "error") {
    return (
      <div style={{ ...s.card, marginBottom: 16, border: "1.5px solid #bfdbfe", background: "#eff6ff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <AlertTriangle size={18} color="#2563eb" />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#2563eb" }}>Scan failed</span>
          <div onClick={onCancel} style={{ marginLeft: "auto", cursor: "pointer", color: "#94a3b8" }}><X size={16} /></div>
        </div>
        <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 16 }}>
          {error || "Something went wrong"}
        </div>
        <div
          onClick={retry}
          style={{
            padding: 12, borderRadius: 12, textAlign: "center", fontWeight: 600, fontSize: 14, cursor: "pointer",
            background: `linear-gradient(135deg,${CL.main},${CL.dark})`, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <RotateCcw size={16} />Try again
        </div>
      </div>
    );
  }

  // Result
  if (phase === "result" && device) {
    const fields = [
      [device.category, "Category"],
      [device.name, "Device"],
      [device.manufacturer, "Manufacturer"],
      [device.model, "Model"],
      [device.serial, "Serial"],
      [device.year_installed ? (device.year_installed + (device.year_confidence === "est" ? " (est)" : "")) : null, "Installed"],
      [device.condition, "Condition"],
      [device.lifespan_min_years && device.lifespan_max_years ? `${device.lifespan_min_years}–${device.lifespan_max_years} yrs` : null, "Lifespan"],
      [device.cost_min && device.cost_max ? `$${Math.round(device.cost_min).toLocaleString()}–$${Math.round(device.cost_max).toLocaleString()}` : null, "Replacement"],
    ].filter(([v]) => v);

    return (
      <div style={{ ...s.card, marginBottom: 16, border: `1.5px solid ${CL.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={18} color={CL.ok.main} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Device Identified</span>
          </div>
          <div onClick={onCancel} style={{ cursor: "pointer", color: "#94a3b8" }}><X size={16} /></div>
        </div>

        {preview && (
          <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16, background: "#f1f5f9" }}>
            <img src={preview} alt="" style={{ width: "100%", display: "block", maxHeight: 160, objectFit: "contain" }} />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8, marginBottom: 16 }}>
          {fields.map(([v, l], i) => (
            <div key={i} style={{ ...s.card, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{l}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: "#0f172a", textTransform: l === "Condition" ? "capitalize" : "none" }}>{v}</div>
            </div>
          ))}
        </div>

        {device.notes && (
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 16, padding: "10px 14px", background: "#f8fafc", borderRadius: 10 }}>
            {device.notes}
          </div>
        )}

        {device.maintenance?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Maintenance</div>
            {device.maintenance.map((m, i) => (
              <div key={i} style={{ fontSize: 13, color: "#475569", padding: "4px 0", display: "flex", alignItems: "center", gap: 6 }}>
                <ChevronRight size={12} color="#94a3b8" />
                {m.task} — every {m.frequency_months}mo{m.diy ? " (DIY)" : ""}{m.estimated_cost ? ` · $${m.estimated_cost}` : ""}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <div
            onClick={retry}
            style={{ flex: 1, padding: 12, borderRadius: 12, textAlign: "center", fontWeight: 600, fontSize: 14, cursor: "pointer", background: "#f1f5f9", color: "#64748b" }}
          >
            Rescan
          </div>
          <div
            onClick={accept}
            style={{
              flex: 1, padding: 12, borderRadius: 12, textAlign: "center", fontWeight: 600, fontSize: 14, cursor: "pointer",
              background: `linear-gradient(135deg,${CL.main},${CL.dark})`, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <CheckCircle2 size={16} />{itemId ? "Update Item" : "Save Device"}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
