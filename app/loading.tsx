// Loading UI hiển thị khi chuyển trang (áp dụng cho cả PC & mobile).
export default function Loading() {
  return (
    <div className="page-loading" role="status" aria-live="polite">
      <span className="page-loading-spinner" />
      <span className="page-loading-text">Đang tải…</span>
    </div>
  );
}
