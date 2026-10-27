"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Category,
  FooterLink,
  Game,
  HomeSection,
  Page,
  SiteSettings,
  SocialLink,
  StatsSummary,
} from "@/lib/types";
import RichText from "./RichText";
import ImageUpload from "./ImageUpload";
import SocialIcon from "@/components/SocialIcon";
import { categorySlug, categoryHref } from "@/lib/slug";
import { CATEGORY_ICONS } from "@/lib/icons";
import { SOCIAL_ICONS, SOCIAL_KEYS } from "@/lib/socialIcons";

/* ----------------------------- helpers ----------------------------- */

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Dùng KHI ĐANG GÕ ô slug: chỉ đổi ký tự không hợp lệ thành "-", GIỮ NGUYÊN gạch
// ngang (kể cả ở cuối) để người dùng gõ được "-". Chuẩn hóa chặt (bỏ gạch thừa ở
// đầu/cuối, gộp gạch liền nhau) chỉ chạy lúc lưu bằng slugify().
function slugifyLive(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
}

function parseIframeSrc(input: string) {
  const m = input.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  return m ? m[1] : input.trim();
}

async function api(url: string, method: string, body?: unknown) {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Có lỗi xảy ra");
  return d;
}

/* ------------------------- small UI pieces ------------------------- */

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {children}
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function Modal({
  children,
  onClose,
  width,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  width?: number;
}) {
  return (
    <div className="admin-overlay" onClick={onClose}>
      <div
        className="admin-modal"
        style={{ maxWidth: width || 560 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ----------------------------- Login ----------------------------- */

function LoginModal({ onSuccess }: { onSuccess: () => void }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/api/auth/login", "POST", { username: u, password: p });
      onSuccess();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal width={400}>
      <h2 className="modal-title">Đăng nhập Admin</h2>
      <form onSubmit={submit}>
        <Field label="Tài khoản">
          <input
            className="field-input"
            value={u}
            onChange={(e) => setU(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Mật khẩu">
          <input
            type="password"
            className="field-input"
            value={p}
            onChange={(e) => setP(e.target.value)}
          />
        </Field>
        {err && <div className="form-err">{err}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
    </Modal>
  );
}

/* -------------------------- SEO fields block -------------------------- */

function SeoFields({
  draft,
  set,
}: {
  draft: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
  return (
    <>
      <Field label="Tiêu đề (thẻ title / SEO)">
        <input
          className="field-input"
          value={(draft.titleTag as string) || ""}
          onChange={(e) => set("titleTag", e.target.value)}
        />
      </Field>
      <Field label="Meta Description">
        <textarea
          className="field-input"
          rows={2}
          value={(draft.metaDescription as string) || ""}
          onChange={(e) => set("metaDescription", e.target.value)}
        />
      </Field>
      <Field label="H1 (tiêu đề hiển thị)">
        <input
          className="field-input"
          value={(draft.h1 as string) || ""}
          onChange={(e) => set("h1", e.target.value)}
        />
      </Field>
      <div className="check-row">
        <Check
          label="robots: index"
          checked={draft.robotsIndex !== false}
          onChange={(v) => set("robotsIndex", v)}
        />
        <Check
          label="robots: follow"
          checked={draft.robotsFollow !== false}
          onChange={(v) => set("robotsFollow", v)}
        />
        <Check
          label="Hiển thị (bật/tắt trang/game)"
          checked={draft.visible !== false}
          onChange={(v) => set("visible", v)}
        />
      </div>
    </>
  );
}

/* --------------------------- Category picker --------------------------- */

/**
 * Chọn category cho game dựa trên các category đã tạo (admin không gõ tay).
 * Bấm vào ô sẽ xổ ra bảng checkbox để tích chọn. Giá trị lưu là label của
 * category (dùng để lọc ở trang danh mục /{slug}).
 */
function CategoryPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [cats, setCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api("/api/categories", "GET")
      .then((r) => setCats(r.categories || []))
      .catch(() => { });
  }, []);

  // Đóng bảng khi bấm ra ngoài.
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const labels = cats.map((c) => c.label);
  // Giữ lại các nhãn cũ đã gắn nhưng không còn trong danh sách category.
  const extra = value.filter((v) => !labels.includes(v));
  const all = [...labels, ...extra];

  const toggle = (label: string) =>
    onChange(
      value.includes(label)
        ? value.filter((x) => x !== label)
        : [...value, label]
    );

  return (
    <div className="cat-picker" ref={ref}>
      <button
        type="button"
        className="field-input cat-picker-btn"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value.length ? "" : "muted"}>
          {value.length ? value.join(", ") : "Chọn category…"}
        </span>
        <span className="cat-picker-caret">▾</span>
      </button>
      {open && (
        <div className="cat-picker-panel">
          {all.length === 0 ? (
            <div className="muted" style={{ padding: 8 }}>
              Chưa có category nào — thêm ở tab Category.
            </div>
          ) : (
            all.map((label) => (
              <label key={label} className="cat-picker-item">
                <input
                  type="checkbox"
                  checked={value.includes(label)}
                  onChange={() => toggle(label)}
                />
                <span>
                  {label}
                  {!labels.includes(label) && (
                    <em className="muted"> (cũ)</em>
                  )}
                </span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Game form ----------------------------- */

function GameForm({
  initial,
  onDone,
  onCancel,
  toast,
}: {
  initial: Game | null; // null = tạo mới
  onDone: () => void;
  onCancel: () => void;
  toast: (m: string) => void;
}) {
  const [d, setD] = useState<Record<string, unknown>>(
    initial
      ? { ...initial }
      : {
        slug: "",
        title: "",
        shortDescription: "",
        iframeUrl: "",
        thumbnail: "",
        categories: [],
        rating: 0, // tự động theo đánh giá của người dùng
        plays: 0, // tự động theo lượt chơi thật của người dùng
        orientation: "auto",
        visible: true,
        robotsIndex: true,
        robotsFollow: true,
      }
  );
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const set = (k: string, v: unknown) => setD((o) => ({ ...o, [k]: v }));
  const isNew = !initial;

  const save = async () => {
    const e: string[] = [];
    const slug = slugify((d.slug as string) || ""); // chuẩn hóa chặt lúc lưu
    if (!(d.title as string)?.trim()) e.push("Tên game không được để trống.");
    if (!slug) e.push("Slug không được để trống.");
    if (!(d.iframeUrl as string)?.trim())
      e.push("Cần nhập URL hoặc mã nhúng <iframe> của game.");
    setErrors(e);
    if (e.length) return;
    setBusy(true);
    try {
      const payload: Game = {
        ...(d as unknown as Game),
        slug,
        iframeUrl: parseIframeSrc((d.iframeUrl as string) || ""),
        rating: Number(d.rating) || 0,
        plays: Number(d.plays) || 0,
      };
      if (isNew) await api("/api/games", "POST", payload);
      else await api(`/api/games/${initial!.slug}`, "PUT", payload);
      toast(isNew ? "Đã thêm game" : "Đã lưu game");
      onDone();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-panel">
      <div className="form-head">
        <h2>{isNew ? "Thêm game" : `Sửa: ${initial!.title}`}</h2>
        <div>
          <button className="btn" onClick={onCancel}>
            Hủy
          </button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="form-err">
          <ul className="err-list">
            {errors.map((er, i) => (
              <li key={i}>{er}</li>
            ))}
          </ul>
        </div>
      )}

      <Field label="Tên game (hiển thị)">
        <input
          className="field-input"
          value={(d.title as string) || ""}
          onChange={(e) => {
            set("title", e.target.value);
            if (isNew && !d.slug) set("slug", slugify(e.target.value));
          }}
        />
      </Field>
      <Field
        label="Slug (đường dẫn /game/...)"
        hint="Chỉ chữ thường, số và dấu gạch ngang. Đổi slug sẽ đổi URL của game."
      >
        <input
          className="field-input"
          value={(d.slug as string) || ""}
          onChange={(e) => set("slug", slugifyLive(e.target.value))}
        />
      </Field>
      <Field
        label="Nhúng game (URL iframe hoặc dán cả mã <iframe…>)"
        hint="Mình sẽ tự tách src nếu bạn dán cả thẻ iframe."
      >
        <textarea
          className="field-input"
          rows={2}
          value={(d.iframeUrl as string) || ""}
          onChange={(e) => set("iframeUrl", e.target.value)}
        />
      </Field>
      <ImageUpload
        label="Thumbnail"
        value={(d.thumbnail as string) || ""}
        onChange={(v) => set("thumbnail", v)}
      />
      <Field
        label="Thumbnail video (URL mp4/webm)"
        hint="Tùy chọn. Dán link video (vd Cloudinary). Khi người dùng rê chuột vào ô game trên PC sẽ phát video xem trước này."
      >
        <input
          className="field-input"
          placeholder="https://… .mp4"
          value={(d.thumbnailVideo as string) || ""}
          onChange={(e) => set("thumbnailVideo", e.target.value)}
        />
      </Field>
      <Field label="Mô tả ngắn">
        <input
          className="field-input"
          value={(d.shortDescription as string) || ""}
          onChange={(e) => set("shortDescription", e.target.value)}
        />
      </Field>
      <Field label="Categories" hint="Bấm để mở bảng chọn từ các category đã có.">
        <CategoryPicker
          value={(d.categories as string[]) || []}
          onChange={(v) => set("categories", v)}
        />
      </Field>
      <div className="auto-meta">
        <span>
          Rating: <b>{Number((d.rating as number) ?? 0).toFixed(1)}</b> / 5 ★
        </span>
        <span>
          Lượt chơi:{" "}
          <b>{Number((d.plays as number) ?? 0).toLocaleString()}</b>
        </span>
        <span className="muted">
          Tự động theo người dùng (chơi &amp; đánh giá) — admin không chỉnh.
        </span>
      </div>
      <Field
        label="Hướng chơi (fullscreen)"
        hint="Khi bấm Let's Play, game hiển thị đúng hướng này: Android khóa xoay hệ thống; iPhone xoay khung game 90° để game ra đúng hướng ngay rồi người dùng xoay máy theo."
      >
        <select
          className="field-input"
          value={(d.orientation as string) || "auto"}
          onChange={(e) => set("orientation", e.target.value)}
        >
          <option value="auto">Tự động (không khóa)</option>
          <option value="landscape">Ngang (landscape)</option>
          <option value="portrait">Dọc (portrait)</option>
        </select>
      </Field>

      <div className="check-row">
        <Check
          label="Ghim nhãn NEW (luôn hiện)"
          checked={Boolean(d.isNew)}
          onChange={(v) => set("isNew", v)}
        />
      </div>
      <p className="field-hint">
        Game mới thêm TỰ ĐỘNG có nhãn NEW và tự mất sau một thời gian/số game mới
        (cấu hình ở Cài đặt website). Chỉ tick ô này nếu muốn GHIM cho game luôn
        hiện NEW, bỏ qua tự động.
      </p>

      <SeoFields draft={d} set={set} />

      <Field label="Nội dung (mô tả dài)">
        <RichText
          value={(d.descriptionHtml as string) || ""}
          onChange={(v) => set("descriptionHtml", v)}
        />
      </Field>
    </div>
  );
}

/* ----------------------------- Page form ----------------------------- */

function PageForm({
  initial,
  onDone,
  onCancel,
  toast,
}: {
  initial: Page | null;
  onDone: () => void;
  onCancel: () => void;
  toast: (m: string) => void;
}) {
  const [d, setD] = useState<Record<string, unknown>>(
    initial
      ? { ...initial }
      : {
        slug: "",
        titleTag: "",
        h1: "",
        contentHtml: "",
        robotsIndex: true,
        robotsFollow: true,
        showInHeader: true,
        visible: true,
      }
  );
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const set = (k: string, v: unknown) => setD((o) => ({ ...o, [k]: v }));
  const isNew = !initial;

  const save = async () => {
    const e: string[] = [];
    const slug = slugify((d.slug as string) || ""); // chuẩn hóa chặt lúc lưu
    if (!(d.h1 as string)?.trim())
      e.push("H1 (tiêu đề hiển thị) không được để trống.");
    if (!slug) e.push("Slug không được để trống.");
    setErrors(e);
    if (e.length) return;
    setBusy(true);
    try {
      const payload = { ...d, slug } as unknown as Page;
      if (isNew) await api("/api/pages", "POST", payload);
      else await api(`/api/pages/${initial!.slug}`, "PUT", payload);
      toast(isNew ? "Đã tạo trang" : "Đã lưu trang");
      onDone();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-panel">
      <div className="form-head">
        <h2>{isNew ? "Tạo trang" : `Sửa trang: ${initial!.h1}`}</h2>
        <div>
          <button className="btn" onClick={onCancel}>
            Hủy
          </button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="form-err">
          <ul className="err-list">
            {errors.map((er, i) => (
              <li key={i}>{er}</li>
            ))}
          </ul>
        </div>
      )}

      <Field label="H1 (tiêu đề hiển thị)">
        <input
          className="field-input"
          value={(d.h1 as string) || ""}
          onChange={(e) => {
            set("h1", e.target.value);
            if (isNew && !d.slug) set("slug", slugify(e.target.value));
          }}
        />
      </Field>
      <Field
        label="Slug (đường dẫn /...)"
        hint="Chỉ chữ thường, số và dấu gạch ngang. Đổi slug sẽ đổi URL của trang."
      >
        <input
          className="field-input"
          value={(d.slug as string) || ""}
          onChange={(e) => set("slug", slugifyLive(e.target.value))}
        />
      </Field>

      <SeoFields draft={d} set={set} />

      <p className="field-hint">
        Muốn trang này xuất hiện ở menu (gần footer)? Vào tab <b>Menu</b> và thêm
        liên kết tới <b>/{(d.slug as string) || "slug"}</b>.
      </p>

      <Field label="Nội dung">
        <RichText
          value={(d.contentHtml as string) || ""}
          onChange={(v) => set("contentHtml", v)}
        />
      </Field>
    </div>
  );
}

/* --------------------- Social links editor (footer) --------------------- */

function SocialLinksEditor({
  value,
  onChange,
}: {
  value: SocialLink[];
  onChange: (v: SocialLink[]) => void;
}) {
  const list = value || [];
  const set = (i: number, patch: Partial<SocialLink>) =>
    onChange(list.map((s, x) => (x === i ? { ...s, ...patch } : s)));
  const add = () => onChange([...list, { url: "", icon: "facebook" }]);
  const remove = (i: number) => onChange(list.filter((_, x) => x !== i));
  const isUrl = (v: string) => /^https?:\/\//i.test(v);

  return (
    <div className="social-editor">
      {list.length === 0 && (
        <p className="field-hint">Chưa có liên kết nào. Bấm “+ Thêm liên kết”.</p>
      )}
      {list.map((s, i) => (
        <div className="social-row" key={i}>
          <span className="social-preview">
            <SocialIcon icon={s.icon} />
          </span>
          <div className="social-row-main">
            {/* Chọn nền tảng có sẵn */}
            <div className="social-pick">
              {SOCIAL_KEYS.map((k) => (
                <button
                  type="button"
                  key={k}
                  className={`social-pick-btn${s.icon === k ? " on" : ""}`}
                  title={SOCIAL_ICONS[k].label}
                  onClick={() => set(i, { icon: k })}
                >
                  <SocialIcon icon={k} />
                </button>
              ))}
            </div>
            <input
              className="field-input"
              placeholder="URL liên kết, vd https://facebook.com/trang-cua-ban"
              value={s.url}
              onChange={(e) => set(i, { url: e.target.value })}
            />
            <input
              className="field-input"
              placeholder="hoặc dán URL ảnh icon tùy chỉnh (png/svg)…"
              value={isUrl(s.icon) ? s.icon : ""}
              onChange={(e) =>
                set(i, { icon: e.target.value || "facebook" })
              }
            />
          </div>
          <button
            type="button"
            className="btn btn-sm btn-danger"
            onClick={() => remove(i)}
          >
            Xóa
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-sm" onClick={add}>
        + Thêm liên kết
      </button>
    </div>
  );
}

/* ----------------------------- Site form ----------------------------- */

function SiteForm({ toast }: { toast: (m: string) => void }) {
  const [d, setD] = useState<SiteSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [sub, setSub] = useState<"header" | "footer">("header");
  const set = (k: string, v: unknown) =>
    setD((o) => (o ? { ...o, [k]: v } : o));

  useEffect(() => {
    api("/api/site", "GET").then((r) => setD(r.site));
  }, []);

  if (!d) return <div className="loading">Đang tải…</div>;

  const save = async () => {
    setBusy(true);
    try {
      await api("/api/site", "PUT", d);
      toast("Đã lưu cài đặt website");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="form-panel">
      <div className="form-head">
        <h2>Cài đặt website</h2>
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? "Đang lưu…" : "Lưu"}
        </button>
      </div>

      <div className="sub-tabs">
        <button
          className={sub === "header" ? "active" : ""}
          onClick={() => setSub("header")}
        >
          Header
        </button>
        <button
          className={sub === "footer" ? "active" : ""}
          onClick={() => setSub("footer")}
        >
          Footer
        </button>
      </div>

      {sub === "header" && (
        <>
          <Field
            label="Tên website"
            hint="Tên chung của site. Dùng làm mặc định khi 2 ô tiêu đề bên dưới để trống."
          >
            <input
              className="field-input"
              value={d.siteName}
              onChange={(e) => set("siteName", e.target.value)}
            />
          </Field>
          <Field
            label="Tiêu đề trang chủ (thẻ title)"
            hint='Thẻ <title> RIÊNG cho trang chủ — có thể để dài cho SEO, vd "Trochoi2nguoi.org - Chơi game 2 người online miễn phí". Để trống sẽ dùng Tên website.'
          >
            <input
              className="field-input"
              placeholder="Tiêu đề hiển thị trên tab khi ở trang chủ"
              value={d.homeTitle || ""}
              onChange={(e) => set("homeTitle", e.target.value)}
            />
          </Field>
          <Field
            label="Meta Description trang chủ (SEO)"
            hint="Mô tả ngắn hiển thị dưới tiêu đề trên Google. Nên ~120–160 ký tự. Để trống sẽ dùng mô tả mặc định."
          >
            <textarea
              className="field-input"
              rows={2}
              placeholder="Vd: Trochoi2nguoi.org - chơi hàng trăm game online 2 người miễn phí..."
              value={d.homeMetaDescription || ""}
              onChange={(e) => set("homeMetaDescription", e.target.value)}
            />
          </Field>
          <Field
            label="Đuôi title (trang game & danh mục)"
            hint='Hiển thị sau dấu "-" ở các trang game/danh mục, vd: "Bomb Pong Online - Trochoi2nguoi.org". Nên để NGẮN GỌN. Để trống sẽ dùng Tên website.'
          >
            <input
              className="field-input"
              placeholder="vd: Trochoi2nguoi.org"
              value={d.titleSuffix || ""}
              onChange={(e) => set("titleSuffix", e.target.value)}
            />
          </Field>
          <Field
            label="Chữ logo"
            hint="Hiển thị khi KHÔNG tải ảnh logo bên dưới."
          >
            <input
              className="field-input"
              value={d.brandText || ""}
              onChange={(e) => set("brandText", e.target.value)}
            />
          </Field>
          <ImageUpload label="Logo (ảnh)" value={d.logoUrl || ""} onChange={(v) => set("logoUrl", v)} />
          <Field
            label="Kích thước logo (px)"
            hint="Để trống = tự động (mặc định cao 78px). Nhập 1 trong 2 để phóng to; nhập cả hai sẽ cố định khung (có thể méo). Chỉ nhập 1 số (vd chiều cao) là ảnh tự co theo tỉ lệ."
          >
            <div className="logo-size-row">
              <input
                type="number"
                min={0}
                className="field-input"
                placeholder="Rộng (auto)"
                value={(d.logoWidth as number) ?? ""}
                onChange={(e) =>
                  set("logoWidth", e.target.value ? Number(e.target.value) : undefined)
                }
              />
              <span className="logo-size-x">×</span>
              <input
                type="number"
                min={0}
                className="field-input"
                placeholder="Cao (auto)"
                value={(d.logoHeight as number) ?? ""}
                onChange={(e) =>
                  set("logoHeight", e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
          </Field>
          <ImageUpload label="Favicon" value={d.faviconUrl || ""} onChange={(v) => set("faviconUrl", v)} />
          <Field
            label="Category ưu tiên"
            hint="Game có gắn các category chọn ở đây (vd 2 Player, 3-4 Players) sẽ tự nổi lên đầu MỌI trang danh mục. Để trống nếu không cần."
          >
            <CategoryPicker
              value={d.priorityCategories || []}
              onChange={(v) => set("priorityCategories", v)}
            />
          </Field>
          <Field
            label="Nhãn NEW — số ngày hiển thị"
            hint="Game thêm trong vòng bao nhiêu ngày thì còn nhãn NEW (vd 30). Đặt 0 để tắt theo ngày."
          >
            <input
              type="number"
              min={0}
              className="field-input"
              value={d.newBadgeDays ?? 30}
              onChange={(e) => set("newBadgeDays", Number(e.target.value))}
            />
          </Field>
          <Field
            label="Nhãn NEW — số game mới nhất"
            hint="Chỉ tối đa bao nhiêu game mới nhất được gắn NEW (vd 12). Khi có game mới hơn chen vào, game cũ tự rụng nhãn. Đặt 0 để tắt."
          >
            <input
              type="number"
              min={0}
              className="field-input"
              value={d.newBadgeCount ?? 12}
              onChange={(e) => set("newBadgeCount", Number(e.target.value))}
            />
          </Field>
        </>
      )}

      {sub === "footer" && (
        <>
          <Field label="Dòng chữ footer" hint="Vd: © 2026 PongBom — bản quyền…">
            <input
              className="field-input"
              value={d.footerText || ""}
              onChange={(e) => set("footerText", e.target.value)}
            />
          </Field>
          <p className="field-hint">
            Các liên kết menu (Home, About…) hiển thị gần footer giờ quản lý ở tab{" "}
            <b>Menu</b> riêng.
          </p>
          <Field
            label="Liên kết mạng xã hội"
            hint="Hiển thị dạng icon DƯỚI menu ở footer (Facebook, YouTube, Instagram…). Chọn 1 icon có sẵn hoặc dán URL ảnh icon riêng, kèm URL liên kết."
          >
            <SocialLinksEditor
              value={(d.socialLinks as SocialLink[]) || []}
              onChange={(v) => set("socialLinks", v)}
            />
          </Field>
        </>
      )}
    </div>
  );
}

/* ----------------------------- Categories ----------------------------- */

function CategoryForm({
  initial,
  onDone,
  onCancel,
  toast,
}: {
  initial: Category | null;
  onDone: () => void;
  onCancel: () => void;
  toast: (m: string) => void;
}) {
  const [d, setD] = useState<Record<string, unknown>>(
    initial
      ? { ...initial }
      : { key: "", label: "", href: "", icon: "monochrome-category-6", visible: true }
  );
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown) => setD((o) => ({ ...o, [k]: v }));
  const isNew = !initial;
  const icon = (d.icon as string) || "";

  const save = async () => {
    if (!(d.label as string)?.trim()) return toast("Nhập tên category");
    const key = (d.key as string) || slugify(d.label as string);
    // Slug URL: dùng slug admin nhập (chuẩn hóa chặt), không thì suy từ tên.
    const raw = (d.slug as string)?.trim();
    const slug = raw ? slugify(raw) : slugify(d.label as string);
    const href = `/${slug}`;
    setBusy(true);
    try {
      const payload = { ...d, key, slug, href };
      if (isNew) await api("/api/categories", "POST", payload);
      else await api(`/api/categories/${initial!.key}`, "PUT", payload);
      toast(isNew ? "Đã thêm category" : "Đã lưu category");
      onDone();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-panel">
      <div className="form-head">
        <h2>{isNew ? "Thêm category" : `Sửa: ${initial!.label}`}</h2>
        <div>
          <button className="btn" onClick={onCancel}>Hủy</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu"}
          </button>
        </div>
      </div>
      <Field label="Tên category">
        <input
          className="field-input"
          value={(d.label as string) || ""}
          onChange={(e) => {
            set("label", e.target.value);
            // Tự điền slug theo tên khi tạo mới & chưa sửa slug thủ công.
            if (isNew && !(d.slug as string)) set("slug", slugify(e.target.value));
          }}
        />
      </Field>
      <Field
        label="Đường dẫn trang danh mục (URL)"
        hint="Chỉ chữ thường, số và dấu gạch ngang. Đổi sẽ đổi URL của chuyên mục. Để trống sẽ tự suy từ tên."
      >
        <input
          className="field-input"
          placeholder={(d.label as string) ? slugify(d.label as string) : "duong-dan"}
          value={(d.slug as string) || ""}
          onChange={(e) => set("slug", slugifyLive(e.target.value))}
        />
        <p className="field-hint">
          URL đầy đủ:{" "}
          <b>
            /
            {categorySlug({
              slug: d.slug as string,
              label: (d.label as string) || "",
            })}
          </b>
        </p>
      </Field>
      <Field
        label="Tiêu đề (thẻ title / SEO)"
        hint='Thẻ <title> của trang chuyên mục. Để trống sẽ dùng "Game {tên}".'
      >
        <input
          className="field-input"
          placeholder={
            (d.label as string) ? `Game ${d.label}` : "Tiêu đề trang chuyên mục"
          }
          value={(d.titleTag as string) || ""}
          onChange={(e) => set("titleTag", e.target.value)}
        />
      </Field>
      <Field
        label="Meta Description (SEO)"
        hint="Mô tả ngắn cho Google (~120–160 ký tự). Để trống sẽ dùng mô tả mặc định."
      >
        <textarea
          className="field-input"
          rows={2}
          value={(d.metaDescription as string) || ""}
          onChange={(e) => set("metaDescription", e.target.value)}
        />
      </Field>
      <Field
        label="Icon"
        hint="Chọn 1 icon từ danh sách bên dưới, hoặc dán 1 emoji vào ô (vd 🎮)."
      >
        <div className="icon-row">
          <input
            className="field-input"
            placeholder="Dán emoji hoặc chọn icon bên dưới"
            value={icon}
            onChange={(e) => set("icon", e.target.value)}
          />
          <span className="icon-preview">
            {icon.startsWith("monochrome-") ? (
              <span className={`cat-icon ${icon}`} />
            ) : (
              <span style={{ fontSize: 24 }}>{icon || "🎲"}</span>
            )}
          </span>
        </div>
        <div className="icon-picker">
          {CATEGORY_ICONS.map(({ icon: cls, name }) => (
            <button
              type="button"
              key={cls}
              className={`icon-picker-item${icon === cls ? " selected" : ""}`}
              title={name}
              onClick={() => set("icon", cls)}
            >
              <span className={`cat-icon ${cls}`} />
              <span className="icon-picker-name">{name}</span>
            </button>
          ))}
        </div>
      </Field>
      <div className="check-row">
        <Check label="Hiển thị" checked={d.visible !== false} onChange={(v) => set("visible", v)} />
      </div>
    </div>
  );
}

function CategoriesTab({
  toast,
  confirm,
}: {
  toast: (m: string) => void;
  confirm: (m: string, fn: () => void) => void;
}) {
  const [cats, setCats] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Category | null | "new">(null);
  const load = useCallback(() => {
    api("/api/categories", "GET").then((r) => setCats(r.categories));
    // Đếm số game đang gắn mỗi category (theo label).
    api("/api/games", "GET")
      .then((r) => {
        const m: Record<string, number> = {};
        ((r.games as Game[]) || []).forEach((g) =>
          (g.categories || []).forEach((c) => {
            m[c] = (m[c] || 0) + 1;
          })
        );
        setCounts(m);
      })
      .catch(() => { });
  }, []);
  useEffect(load, [load]);

  const reorder = async (from: number, to: number) => {
    if (to < 0 || to >= cats.length) return;
    const arr = [...cats];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    setCats(arr);
    await api("/api/categories", "POST", { reorder: arr.map((c) => c.key) });
  };

  if (editing !== null)
    return (
      <CategoryForm
        initial={editing === "new" ? null : editing}
        onCancel={() => setEditing(null)}
        onDone={() => {
          setEditing(null);
          load();
        }}
        toast={toast}
      />
    );

  const toggle = async (c: Category) => {
    await api(`/api/categories/${c.key}`, "PUT", { ...c, visible: !(c.visible !== false) });
    load();
  };

  return (
    <div>
      <div className="list-head">
        <h2>Category trang chủ ({cats.length})</h2>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          + Thêm category
        </button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Thứ tự</th>
            <th>Icon</th>
            <th>Tên</th>
            <th>Số game</th>
            <th>Link</th>
            <th>Hiển thị</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cats.map((c, i) => (
            <tr key={c.key}>
              <td className="reorder">
                <button className="btn btn-xs" onClick={() => reorder(i, i - 1)}>↑</button>
                <button className="btn btn-xs" onClick={() => reorder(i, i + 1)}>↓</button>
              </td>
              <td>
                {c.icon?.startsWith("monochrome-") ? (
                  <span className={`cat-icon ${c.icon}`} style={{ color: "#386a81" }} />
                ) : (
                  <span style={{ fontSize: 20 }}>{c.icon || "🎲"}</span>
                )}
              </td>
              <td>{c.label}</td>
              <td>
                <span className="count-badge">{counts[c.label] || 0}</span>
              </td>
              <td className="muted">{categoryHref(c)}</td>
              <td>
                <button
                  className={`pill ${c.visible !== false ? "pill-on" : "pill-off"}`}
                  onClick={() => toggle(c)}
                >
                  {c.visible !== false ? "Bật" : "Tắt"}
                </button>
              </td>
              <td className="row-actions">
                <button className="btn btn-sm" onClick={() => setEditing(c)}>Sửa</button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() =>
                    confirm(`Xóa category "${c.label}"?`, async () => {
                      await api(`/api/categories/${c.key}`, "DELETE");
                      toast("Đã xóa category");
                      load();
                    })
                  }
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------- Menu ----------------------------- */

/**
 * Quản lý MENU các trang (hiển thị gần footer: Home, About, Test…).
 * Hoàn toàn TÁCH BIỆT với thanh category trên đầu (thanh đó chỉ để lọc game).
 */
function MenuTab({ toast }: { toast: (m: string) => void }) {
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [menu, setMenu] = useState<FooterLink[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      api("/api/site", "GET").then((r) => r.site as SiteSettings),
      api("/api/pages", "GET")
        .then((r) => (r.pages as Page[]) || [])
        .catch(() => [] as Page[]),
    ]).then(([s, ps]) => {
      setSite(s);
      setPages(ps);
      // Đã cấu hình menu -> dùng luôn. Chưa -> gợi ý mặc định (Home + các trang).
      if (Array.isArray(s.menuLinks) && s.menuLinks.length > 0) {
        setMenu(s.menuLinks);
      } else {
        const seed: FooterLink[] = [{ label: "Home", url: "/" }];
        ps
          .filter((p) => p.visible !== false && p.showInHeader)
          .forEach((p) =>
            seed.push({ label: p.headerLabel || p.h1, url: `/${p.slug}` })
          );
        setMenu(seed);
      }
    });
  }, []);

  if (!site) return <div className="loading">Đang tải…</div>;

  const setItem = (i: number, key: keyof FooterLink, val: string) =>
    setMenu(menu.map((m, x) => (x === i ? { ...m, [key]: val } : m)));

  const add = (item: FooterLink = { label: "", url: "" }) =>
    setMenu([...menu, item]);

  const remove = (i: number) => setMenu(menu.filter((_, x) => x !== i));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= menu.length) return;
    const arr = [...menu];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    setMenu(arr);
  };

  const save = async () => {
    setBusy(true);
    try {
      const clean = menu.filter((m) => m.label.trim() && m.url.trim());
      await api("/api/site", "PUT", { ...site, menuLinks: clean });
      setSite({ ...site, menuLinks: clean });
      toast("Đã lưu menu");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Trang chưa có trong menu -> cho thêm nhanh
  const usedUrls = new Set(menu.map((m) => m.url.replace(/\/+$/, "")));
  const addablePages = pages.filter(
    (p) => p.visible !== false && !usedUrls.has(`/${p.slug}`)
  );

  return (
    <div className="form-panel">
      <div className="form-head">
        <h2>Menu (gần footer)</h2>
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? "Đang lưu…" : "Lưu"}
        </button>
      </div>

      <p className="field-hint" style={{ marginBottom: 14 }}>
        Menu này hiển thị ở gần chân trang (Home, About…). Tách biệt hoàn toàn với
        thanh category trên đầu (thanh đó chỉ để lọc game). Nhãn tự nhập, link có
        thể là trang nội bộ (vd <b>/about</b>) hoặc link ngoài (https://…).
      </p>

      <div className="list-head">
        <h3 style={{ margin: 0 }}>Các mục ({menu.length})</h3>
        <button className="btn btn-primary" onClick={() => add()}>
          + Thêm mục
        </button>
      </div>

      {menu.length === 0 && (
        <div className="muted" style={{ marginBottom: 12 }}>
          Chưa có mục nào. Bấm &quot;Thêm mục&quot; hoặc thêm nhanh một trang bên
          dưới.
        </div>
      )}

      {menu.map((m, i) => (
        <div className="link-row-admin" key={i}>
          <div className="reorder">
            <button className="btn btn-xs" onClick={() => move(i, i - 1)}>
              ↑
            </button>
            <button className="btn btn-xs" onClick={() => move(i, i + 1)}>
              ↓
            </button>
          </div>
          <input
            className="field-input"
            placeholder="Nhãn (vd: About)"
            value={m.label}
            onChange={(e) => setItem(i, "label", e.target.value)}
          />
          <input
            className="field-input"
            placeholder="Link (vd: /about hoặc https://…)"
            value={m.url}
            onChange={(e) => setItem(i, "url", e.target.value)}
          />
          <button
            className="btn btn-sm btn-danger"
            onClick={() => remove(i)}
          >
            Xóa
          </button>
        </div>
      ))}

      {addablePages.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <label className="field-label">Thêm nhanh một trang vào menu</label>
          <div className="field-hint" style={{ marginBottom: 6 }}>
            Chọn trang đã tạo để thêm vào menu (có thể sửa nhãn sau).
          </div>
          <div className="quick-add-pages">
            {addablePages.map((p) => (
              <button
                key={p.slug}
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  add({ label: p.headerLabel || p.h1, url: `/${p.slug}` })
                }
              >
                + {p.headerLabel || p.h1}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? "Đang lưu…" : "Lưu"}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- Home ----------------------------- */

function HomeTab({ toast }: { toast: (m: string) => void }) {
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/site", "GET").then((r) => setSite(r.site));
    api("/api/categories", "GET")
      .then((r) => setCats(r.categories || []))
      .catch(() => { });
  }, []);

  if (!site) return <div className="loading">Đang tải…</div>;

  const sections: HomeSection[] = site.homeSections || [];

  const setSections = (arr: HomeSection[]) =>
    setSite({ ...site, homeSections: arr });

  const setField = (i: number, key: keyof HomeSection, val: unknown) =>
    setSections(
      sections.map((s, x) => (x === i ? { ...s, [key]: val } : s))
    );

  const addSection = () =>
    setSections([
      ...sections,
      { title: "", category: "", mode: "top", limit: 14 },
    ]);

  const removeSection = (i: number) =>
    setSections(sections.filter((_, x) => x !== i));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= sections.length) return;
    const arr = [...sections];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    setSections(arr);
  };

  const save = async () => {
    setBusy(true);
    try {
      await api("/api/site", "PUT", site);
      toast("Đã lưu trang chủ");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-panel">
      <div className="form-head">
        <h2>Trang chủ</h2>
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? "Đang lưu…" : "Lưu"}
        </button>
      </div>

      <div className="list-head">
        <h3 style={{ margin: 0 }}>Các khối hiển thị ({sections.length})</h3>
        <button className="btn btn-primary" onClick={addSection}>
          + Thêm khối
        </button>
      </div>
      <p className="field-hint" style={{ marginBottom: 12 }}>
        Mỗi khối: tự nhập tiêu đề, chọn category và kiểu hiển thị (Top = nhiều
        lượt chơi nhất, Mới = game thêm gần đây nhất). Thêm bao nhiêu khối tùy ý.
      </p>

      {sections.length === 0 && (
        <div className="muted" style={{ marginBottom: 12 }}>
          Chưa có khối nào — trang chủ đang hiển thị mặc định &quot;Top
          Games&quot;. Bấm &quot;Thêm khối&quot; để tùy chỉnh.
        </div>
      )}

      {sections.map((s, i) => (
        <div className="home-sec-row" key={i}>
          <div className="reorder">
            <button className="btn btn-xs" onClick={() => move(i, i - 1)}>
              ↑
            </button>
            <button className="btn btn-xs" onClick={() => move(i, i + 1)}>
              ↓
            </button>
          </div>
          <div className="home-sec-fields">
            <Field label="Tiêu đề">
              <input
                className="field-input"
                placeholder="Vd: Top 2 Player Games"
                value={s.title}
                onChange={(e) => setField(i, "title", e.target.value)}
              />
            </Field>
            <Field label="Category">
              <select
                className="field-input"
                value={s.category}
                onChange={(e) => setField(i, "category", e.target.value)}
              >
                <option value="">Tất cả game</option>
                {cats.map((c) => (
                  <option key={c.key} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kiểu">
              <select
                className="field-input"
                value={s.mode}
                onChange={(e) => setField(i, "mode", e.target.value)}
              >
                <option value="top">Top (nhiều lượt chơi)</option>
                <option value="new">Mới (thêm gần đây)</option>
              </select>
            </Field>
            <Field label="Số game">
              <input
                type="number"
                min="1"
                max="60"
                className="field-input"
                value={s.limit}
                onChange={(e) =>
                  setField(i, "limit", Number(e.target.value) || 14)
                }
              />
            </Field>
          </div>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => removeSection(i)}
          >
            Xóa
          </button>
        </div>
      ))}

      <div style={{ marginTop: 24 }}>
        <label className="field-label">Nội dung cuối trang chủ</label>
        <div className="field-hint" style={{ marginBottom: 6 }}>
          Đoạn giới thiệu/mô tả hiển thị dưới cùng trang chủ.
        </div>
        <RichText
          value={site.homeContentHtml || ""}
          onChange={(v) => setSite({ ...site, homeContentHtml: v })}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <button className="btn btn-primary" onClick={save} disabled={busy}>
          {busy ? "Đang lưu…" : "Lưu"}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- Stats ----------------------------- */

function StatsTab() {
  const [s, setS] = useState<StatsSummary | null>(null);
  useEffect(() => {
    api("/api/stats", "GET").then((r) => setS(r.stats)).catch(() => { });
  }, []);
  if (!s) return <div className="loading">Đang tải…</div>;

  return (
    <div>
      <div className="list-head">
        <h2>Thống kê truy cập</h2>
      </div>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-num">{s.totalViews.toLocaleString()}</div>
          <div className="stat-label">Tổng lượt xem</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{s.totalPlays.toLocaleString()}</div>
          <div className="stat-label">Tổng lượt chơi</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{s.today.views.toLocaleString()}</div>
          <div className="stat-label">Lượt xem hôm nay</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{s.today.plays.toLocaleString()}</div>
          <div className="stat-label">Lượt chơi hôm nay</div>
        </div>
      </div>

      <h3 className="stat-h3">14 ngày gần đây</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Lượt xem</th>
            <th>Lượt chơi</th>
          </tr>
        </thead>
        <tbody>
          {s.daily.length === 0 && (
            <tr>
              <td colSpan={3} className="muted">
                Chưa có dữ liệu.
              </td>
            </tr>
          )}
          {s.daily.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{d.views}</td>
              <td>{d.plays}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="stat-h3">Top game (theo lượt chơi)</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Game</th>
            <th>Lượt chơi</th>
            <th>Lượt xem</th>
          </tr>
        </thead>
        <tbody>
          {s.topGames.length === 0 && (
            <tr>
              <td colSpan={3} className="muted">
                Chưa có dữ liệu.
              </td>
            </tr>
          )}
          {s.topGames.map((g) => (
            <tr key={g.slug}>
              <td>{g.title}</td>
              <td>{g.plays}</td>
              <td>{g.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------- Lists ----------------------------- */

function GamesTab({
  toast,
  confirm,
}: {
  toast: (m: string) => void;
  confirm: (m: string, fn: () => void) => void;
}) {
  const [games, setGames] = useState<Game[]>([]);
  const [editing, setEditing] = useState<Game | null | "new">(null);

  const load = useCallback(() => {
    api("/api/games", "GET").then((r) => setGames(r.games));
  }, []);
  useEffect(load, [load]);

  if (editing !== null)
    return (
      <GameForm
        initial={editing === "new" ? null : editing}
        onCancel={() => setEditing(null)}
        onDone={() => {
          setEditing(null);
          load();
        }}
        toast={toast}
      />
    );

  const toggle = async (g: Game) => {
    await api(`/api/games/${g.slug}`, "PUT", { ...g, visible: !(g.visible !== false) });
    load();
  };

  return (
    <div>
      <div className="list-head">
        <h2>Games ({games.length})</h2>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          + Thêm game
        </button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th></th>
            <th>Tên</th>
            <th>Slug</th>
            <th>Hiển thị</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => (
            <tr key={g.slug}>
              <td>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="row-thumb" src={g.thumbnail} alt="" />
              </td>
              <td>{g.title}</td>
              <td className="muted">{g.slug}</td>
              <td>
                <button
                  className={`pill ${g.visible !== false ? "pill-on" : "pill-off"}`}
                  onClick={() => toggle(g)}
                >
                  {g.visible !== false ? "Bật" : "Tắt"}
                </button>
              </td>
              <td className="row-actions">
                <button className="btn btn-sm" onClick={() => setEditing(g)}>
                  Sửa
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() =>
                    confirm(`Xóa game "${g.title}"?`, async () => {
                      await api(`/api/games/${g.slug}`, "DELETE");
                      toast("Đã xóa game");
                      load();
                    })
                  }
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PagesTab({
  toast,
  confirm,
}: {
  toast: (m: string) => void;
  confirm: (m: string, fn: () => void) => void;
}) {
  const [pages, setPages] = useState<Page[]>([]);
  const [editing, setEditing] = useState<Page | null | "new">(null);

  const load = useCallback(() => {
    api("/api/pages", "GET").then((r) => setPages(r.pages));
  }, []);
  useEffect(load, [load]);

  const reorder = async (from: number, to: number) => {
    if (to < 0 || to >= pages.length) return;
    const arr = [...pages];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    setPages(arr);
    await api("/api/pages", "POST", { reorder: arr.map((p) => p.slug) });
  };

  if (editing !== null)
    return (
      <PageForm
        initial={editing === "new" ? null : editing}
        onCancel={() => setEditing(null)}
        onDone={() => {
          setEditing(null);
          load();
        }}
        toast={toast}
      />
    );

  const toggle = async (p: Page) => {
    await api(`/api/pages/${p.slug}`, "PUT", { ...p, visible: !p.visible });
    load();
  };

  return (
    <div>
      <div className="list-head">
        <h2>Trang ({pages.length})</h2>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>
          + Tạo trang
        </button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Thứ tự</th>
            <th>Tiêu đề</th>
            <th>Slug</th>
            <th>Hiển thị</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p, i) => (
            <tr key={p.slug}>
              <td className="reorder">
                <button className="btn btn-xs" onClick={() => reorder(i, i - 1)}>
                  ↑
                </button>
                <button className="btn btn-xs" onClick={() => reorder(i, i + 1)}>
                  ↓
                </button>
              </td>
              <td>{p.h1 || p.titleTag}</td>
              <td className="muted">/{p.slug}</td>
              <td>
                <button
                  className={`pill ${p.visible ? "pill-on" : "pill-off"}`}
                  onClick={() => toggle(p)}
                >
                  {p.visible ? "Bật" : "Tắt"}
                </button>
              </td>
              <td className="row-actions">
                <button className="btn btn-sm" onClick={() => setEditing(p)}>
                  Sửa
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() =>
                    confirm(`Xóa trang "${p.h1}"?`, async () => {
                      await api(`/api/pages/${p.slug}`, "DELETE");
                      toast("Đã xóa trang");
                      load();
                    })
                  }
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------- Root ----------------------------- */

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<
    "games" | "categories" | "pages" | "menu" | "home" | "site" | "stats"
  >("games");
  const [toastMsg, setToastMsg] = useState("");
  const [confirmState, setConfirmState] = useState<{
    msg: string;
    fn: () => void;
  } | null>(null);

  const toast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(""), 2500);
  };
  const confirm = (msg: string, fn: () => void) => setConfirmState({ msg, fn });

  useEffect(() => {
    api("/api/auth/me", "GET").then((r) => setAuthed(r.authed));
  }, []);

  if (authed === null)
    return <div className="admin-app admin-center">Đang tải…</div>;

  if (!authed)
    return (
      <div className="admin-app admin-center">
        <LoginModal onSuccess={() => setAuthed(true)} />
      </div>
    );

  const logout = async () => {
    await api("/api/auth/logout", "POST");
    setAuthed(false);
  };

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand">Admin Dashboard</div>
        <nav>
          <button
            className={tab === "games" ? "active" : ""}
            onClick={() => setTab("games")}
          >
            Games
          </button>
          <button
            className={tab === "categories" ? "active" : ""}
            onClick={() => setTab("categories")}
          >
            Category
          </button>
          <button
            className={tab === "pages" ? "active" : ""}
            onClick={() => setTab("pages")}
          >
            Trang (Pages)
          </button>
          <button
            className={tab === "menu" ? "active" : ""}
            onClick={() => setTab("menu")}
          >
            Menu
          </button>
          <button
            className={tab === "home" ? "active" : ""}
            onClick={() => setTab("home")}
          >
            Trang chủ
          </button>
          <button
            className={tab === "stats" ? "active" : ""}
            onClick={() => setTab("stats")}
          >
            Thống kê
          </button>
          <button
            className={tab === "site" ? "active" : ""}
            onClick={() => setTab("site")}
          >
            Cài đặt website
          </button>
        </nav>
        <div className="admin-sidebar-foot">
          <a href="/" target="_blank" rel="noreferrer">
            ↗ Xem website
          </a>
          <button className="btn btn-sm" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-container">
          {tab === "games" && <GamesTab toast={toast} confirm={confirm} />}
          {tab === "categories" && <CategoriesTab toast={toast} confirm={confirm} />}
          {tab === "pages" && <PagesTab toast={toast} confirm={confirm} />}
          {tab === "menu" && <MenuTab toast={toast} />}
          {tab === "home" && <HomeTab toast={toast} />}
          {tab === "stats" && <StatsTab />}
          {tab === "site" && <SiteForm toast={toast} />}
        </div>
      </main>

      {toastMsg && <div className="admin-toast">{toastMsg}</div>}

      {confirmState && (
        <Modal width={380} onClose={() => setConfirmState(null)}>
          <h2 className="modal-title">Xác nhận</h2>
          <p className="modal-text">{confirmState.msg}</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setConfirmState(null)}>
              Hủy
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                confirmState.fn();
                setConfirmState(null);
              }}
            >
              Xóa
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
