"use client";

import { useEffect, useRef } from "react";

/** Editor rich text đơn giản (contentEditable + thanh công cụ). Lưu ra HTML. */
export default function RichText({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    ref.current?.focus();
    onChange(ref.current?.innerHTML || "");
  };

  const btn = (label: string, cmd: string, arg?: string, title?: string) => (
    <button
      type="button"
      title={title || label}
      className="rt-btn"
      onMouseDown={(e) => {
        e.preventDefault();
        exec(cmd, arg);
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="rt">
      <div className="rt-toolbar">
        {btn("H2", "formatBlock", "H2")}
        {btn("H3", "formatBlock", "H3")}
        {btn("P", "formatBlock", "P", "Đoạn văn")}
        <span className="rt-sep" />
        {btn("B", "bold", undefined, "In đậm")}
        {btn("I", "italic", undefined, "In nghiêng")}
        {btn("U", "underline", undefined, "Gạch chân")}
        <span className="rt-sep" />
        {btn("• List", "insertUnorderedList")}
        {btn("1. List", "insertOrderedList")}
        <span className="rt-sep" />
        <button
          type="button"
          className="rt-btn"
          onMouseDown={(e) => {
            e.preventDefault();
            const url = prompt("Nhập URL liên kết:");
            if (url) exec("createLink", url);
          }}
        >
          Link
        </button>
        {btn("Clear", "removeFormat", undefined, "Xóa định dạng")}
      </div>
      <div
        ref={ref}
        className="rt-area"
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML || "")}
      />
    </div>
  );
}
