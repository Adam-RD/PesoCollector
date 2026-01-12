import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="layout-grid">
        <Sidebar />
        <div className="m-2 flex flex-1 flex-col gap-4 md:m-4">
          <div className="content-card flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
