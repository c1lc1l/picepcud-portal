import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const { profile } = await getCurrentUser();
  const supabase = await createClient();

  const [members, pending, events] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  const metrics = [
    {
      title: "Total Members",
      description: "Registered profiles",
      value: members.count,
    },
    {
      title: "Pending Payments",
      description: "Awaiting review",
      value: pending.count,
    },
    {
      title: "Active Events",
      description: "Currently published",
      value: events.count,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.full_name}.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {metrics.map((m) => (
          <Card key={m.title}>
            <CardHeader>
              <CardDescription>{m.title}</CardDescription>
              <CardTitle className="text-3xl">{m.value ?? "--"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {m.description}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
