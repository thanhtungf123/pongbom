import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";
import "./admin.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin · PongBom",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
