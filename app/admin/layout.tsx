import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = await getCurrentUser();

  if (!user) redirect("/login");
  if (!isAdmin) redirect("/dashboard");

  return (
    <>
      <PortalHeader current="admin" isAdmin tabs={<AdminNav />} />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        {children}
      </main>
    </>
  );
}
