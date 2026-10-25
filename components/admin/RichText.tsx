"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { uploadImageToCloudinary } from "./cloudinary";

/** Editor rich text đơn giản (contentEditable + thanh công cụ). Lưu ra HTML. */
export default function RichText({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Lưu vùng chọn (caret) để chèn ảnh đúng chỗ sau khi upload / mở hộp thoại file.
  const savedRange = useRef<Range | null>(null);
  const [busy, setBusy] = useState(false);
  // Trạng thái định dạng đang áp dụng tại vị trí con trỏ (để tô đậm nút).
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [block, setBlock] = useState<string>("");

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  // Con trỏ có đang nằm trong vùng soạn thảo không.
  const selInEditor = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !ref.current) return false;
    return ref.current.contains(sel.anchorNode);
  }, []);

  // Cập nhật trạng thái các nút theo vị trí con trỏ hiện tại.
  const refreshState = useCallback(() => {
    if (!selInEditor()) return;
    try {
      setActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
      });
      const b = (document.queryCommandValue("formatBlock") || "").toLowerCase();
      setBlock(b);
    } catch {
      /* một số trình duyệt có thể ném lỗi khi không có selection */
    }
  }, [selInEditor]);

  // Theo dõi thay đổi vùng chọn trên toàn trang nhưng chỉ xử lý khi ở trong editor.
  useEffect(() => {
    const h = () => refreshState();
    document.addEventListener("selectionchange", h);
    return () => document.removeEventListener("selectionchange", h);
  }, [refreshState]);

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && selInEditor()) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreRange = () => {
    const sel = window.getSelection();
    if (!sel) return;
    ref.current?.focus();
    if (savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    ref.current?.focus();
    onChange(ref.current?.innerHTML || "");
    refreshState();
  };

  // Chèn ảnh (theo URL) tại vị trí con trỏ đã lưu.
  const insertImage = (url: string) => {
    restoreRange();
    document.execCommand("insertImage", false, url);
    onChange(ref.current?.innerHTML || "");
  };

  const doUpload = async (file: File) => {
    setBusy(true);
    try {
      const url = await uploadImageToCloudinary(file);
      insertImage(url);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Dán ảnh trực tiếp từ clipboard.
  const onPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of Array.from(items)) {
      if (it.type.startsWith("image/")) {
        const file = it.getAsFile();
        if (file) {
          e.preventDefault();
          saveRange();
          doUpload(file);
          return;
        }
      }
    }
  };

  const btn = (
    label: string,
    cmd: string,
    arg?: string,
    title?: string,
    activeKey?: string
  ) => {
    const isActive = activeKey
      ? activeKey.startsWith("block:")
        ? block === activeKey.slice(6)
        : active[activeKey]
      : false;
    return (
      <button
        type="button"
        title={title || label}
        className={`rt-btn${isActive ? " rt-btn-active" : ""}`}
        onMouseDown={(e) => {
          e.preventDefault();
          exec(cmd, arg);
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="rt">
      <div className="rt-toolbar">
        {btn("H2", "formatBlock", "H2", "Tiêu đề 2", "block:h2")}
        {btn("H3", "formatBlock", "H3", "Tiêu đề 3", "block:h3")}
        {btn("P", "formatBlock", "P", "Đoạn văn", "block:p")}
        <span className="rt-sep" />
        {btn("B", "bold", undefined, "In đậm", "bold")}
        {btn("I", "italic", undefined, "In nghiêng", "italic")}
        {btn("U", "underline", undefined, "Gạch chân", "underline")}
        <span className="rt-sep" />
        {btn("• List", "insertUnorderedList", undefined, "Danh sách", "insertUnorderedList")}
        {btn("1. List", "insertOrderedList", undefined, "Danh sách số", "insertOrderedList")}
        <span className="rt-sep" />
        <button
          type="button"
          className="rt-btn"
          title="Chèn liên kết"
          onMouseDown={(e) => {
            e.preventDefault();
            const url = prompt("Nhập URL liên kết:");
            if (url) exec("createLink", url);
          }}
        >
          Link
        </button>
        <button
          type="button"
          className="rt-btn"
          title="Chèn ảnh (từ máy). Bạn cũng có thể dán ảnh trực tiếp vào vùng soạn thảo."
          onMouseDown={(e) => {
            e.preventDefault();
            saveRange();
            fileRef.current?.click();
          }}
        >
          🖼 Ảnh
        </button>
        {btn("Clear", "removeFormat", undefined, "Xóa định dạng")}
        {busy && <span className="rt-busy">Đang tải ảnh…</span>}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) doUpload(f);
            e.target.value = ""; // cho phép chọn lại cùng 1 file
          }}
        />
      </div>
      <div
        ref={ref}
        className="rt-area"
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          onChange(ref.current?.innerHTML || "");
          refreshState();
        }}
        onKeyUp={refreshState}
        onMouseUp={refreshState}
        onFocus={refreshState}
        onPaste={onPaste}
      />
    </div>
  );
}
