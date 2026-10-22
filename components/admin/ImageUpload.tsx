"use client";

import { useState } from "react";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/** Upload ảnh lên Cloudinary (unsigned) + nhập URL thủ công. Trả về secure_url. */
export default function ImageUpload({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (url: string) => void;
  label: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const upload = async (file: File) => {
    setErr("");
    if (!CLOUD || !PRESET) {
      setErr("Chưa cấu hình Cloudinary (NEXT_PUBLIC_CLOUDINARY_* trong .env.local).");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", PRESET);
      const r = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
        { method: "POST", body: fd }
      );
      const d = await r.json();
      if (d.secure_url) onChange(d.secure_url);
      else setErr(d.error?.message || "Upload thất bại");
    } catch {
      setErr("Không kết nối được Cloudinary");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="img-upload">
      <label className="field-label">{label}</label>
      <div className="img-upload-row">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="img-preview" src={value} alt="" />
        ) : (
          <div className="img-preview img-preview-empty">No image</div>
        )}
        <div className="img-upload-controls">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
          <input
            type="url"
            className="field-input"
            placeholder="hoặc dán URL ảnh..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          {busy && <span className="img-busy">Đang upload…</span>}
          {err && <span className="img-err">{err}</span>}
        </div>
      </div>
    </div>
  );
}
