import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAdmin } = await getCurrentUser();

  if (!user) redirect("/login");
  if (!isAdmin) redirect("/");

  return <>{children}</>;
}
