"use client";

import { useState } from "react";
import { uploadImageToCloudinary } from "./cloudinary";

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
    setBusy(true);
    try {
      onChange(await uploadImageToCloudinary(file));
    } catch (e) {
      setErr((e as Error).message);
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
