import { signOut } from "@/app/actions/auth";
import { GcashUploadDialog } from "@/components/payments/GcashUploadDialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">Signed in as {user?.email}</p>
      {user && <GcashUploadDialog userId={user.id} />}
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Log out
        </Button>
      </form>
    </div>
  );
}
