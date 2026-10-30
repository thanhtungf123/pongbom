"use client";

/**
 * Ô "load more" trên MOBILE — nằm NGAY TRONG lưới game như một ô game nữa
 * (ô vuông cùng cỡ card), có dấu "+" lớn và chữ "load more" (giống
 * m.twoplayergames.org). PC ẩn ô này (dùng phân trang / carousel) qua CSS.
 */
export default function LoadMoreTile({
  onClick,
  loading = false,
  error = false,
}: {
  onClick: () => void;
  loading?: boolean;
  error?: boolean;
}) {
  return (
    <li className="load-more-cell">
      <button
        type="button"
        className="load-more-tile"
        onClick={onClick}
        disabled={loading}
        aria-label="Xem thêm game"
      >
        <span className="load-more-tile-inner">
          {loading ? (
            <span className="load-more-spinner" />
          ) : (
            <span className="load-more-plus" aria-hidden="true">
              +
            </span>
          )}
          <span className="load-more-text">
            {error ? "Thử lại" : "Xem thêm"}
          </span>
        </span>
      </button>
    </li>
  );
}
