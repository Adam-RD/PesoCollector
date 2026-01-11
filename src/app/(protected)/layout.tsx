import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="layout-grid">
      <Sidebar />
      <div className="m-4 flex flex-1 flex-col gap-4">
        <Navbar />
        <div className="content-card flex-1">{children}</div>
      </div>
    </div>
  );
}
