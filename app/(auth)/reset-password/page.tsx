import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set a new password | PICE PCUD",
};

/** Reached from the reset email via /auth/callback, which signs the user in. */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) return <ResetPasswordForm email={user.email} />;

  return (
    <>
      <h1 className="font-headline text-6xl leading-none uppercase text-brand-ink">
        Link expired
      </h1>
      <hr className="chrome-rule mt-6 mb-8" />
      <div className="flex gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <TriangleAlertIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
        <p className="text-brand-ink">
          This password reset link is invalid or has expired. Reset links can
          only be used once.
        </p>
      </div>
      <Button
        nativeButton={false}
        render={<Link href="/forgot-password" />}
        className="mt-6 h-11 w-full rounded-md text-base"
      >
        Request a new link
      </Button>
    </>
  );
}
