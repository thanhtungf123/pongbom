import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bảng màu lấy trực tiếp từ CSS của twoplayergames.org (theme sáng, vui nhộn)
        site: {
          sky: "#d6f7ff", // --site-main-color
          skyTop: "#e5feff", // đỉnh trời
          grass: "#96c665", // dải cỏ xanh dưới header
          grassLine: "#7bb04f",
          grassDark: "#4c823a", // nền ô tìm kiếm
          panel: "#ffffff",
          cream: "#eef7e9", // nền vùng nội dung (xấp xỉ hoa văn)
          ink: "#333333",
          red: "#eb0000", // logo / tiêu đề đỏ
          newBadge: "#cf4248", // pill "NEW"
          coral: "#e66062", // hover
          teal: "#386a81", // icon category
          orange: "#dc5a00",
        },
      },
      fontFamily: {
        // Varela Round = chữ ký hình ảnh của twoplayergames
        round: ["var(--font-varela)", "Varela Round", "system-ui", "sans-serif"],
      },
      boxShadow: {
        tile: "0 3px 0 0 rgba(0,0,0,0.12), 0 4px 10px -4px rgba(0,0,0,0.25)",
        panel: "0 2px 8px rgba(0,0,0,0.12)",
      },
      borderRadius: {
        tile: "14px",
      },
    },
  },
  plugins: [],
  // Tắt preflight để không đè lên reset/CSS gốc của giao diện mirror.
  corePlugins: { preflight: false },
};

export default config;
