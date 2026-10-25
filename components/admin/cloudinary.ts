// Upload ảnh lên Cloudinary (unsigned). Dùng chung cho ImageUpload + RichText.

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/** Trả về secure_url của ảnh đã upload. Ném Error nếu lỗi/chưa cấu hình. */
export async function uploadImageToCloudinary(file: File): Promise<string> {
  if (!CLOUD || !PRESET) {
    throw new Error(
      "Chưa cấu hình Cloudinary (NEXT_PUBLIC_CLOUDINARY_* trong .env.local)."
    );
  }
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", PRESET);
  const r = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
    { method: "POST", body: fd }
  );
  const d = await r.json();
  if (d.secure_url) return d.secure_url as string;
  throw new Error(d.error?.message || "Upload thất bại");
}
