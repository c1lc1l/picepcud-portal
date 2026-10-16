"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, MailCheckIcon, TriangleAlertIcon } from "lucide-react";
import {
  AuthField,
  authInputClass,
  describedBy,
} from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/app/actions/auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from "@/lib/validations/auth";

export function ForgotPasswordForm({ expired }: { expired: boolean }) {
  const [serverError, setServerError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (values: ForgotPasswordValues) => {
    setServerError(undefined);
    const fd = new FormData();
    fd.append("email", values.email);
    startTransition(async () => {
      const res = await requestPasswordReset(fd);
      if (res?.error) setServerError(res.error);
      else setSentTo(values.email);
    });
  };

  return (
    <>
      <h1 className="font-headline text-6xl leading-none uppercase text-brand-ink">
        Reset password
      </h1>
      <p className="mt-3 text-muted-foreground">
        Enter the email you registered with and we&apos;ll send you a link to
        set a new password.
      </p>
      <hr className="chrome-rule mt-6 mb-8" />

      {sentTo ? (
        <div
          role="status"
          className="flex gap-3 rounded-md border border-brand-periwinkle/40 bg-white p-4 text-sm"
        >
          <MailCheckIcon className="mt-0.5 size-5 shrink-0 text-brand-violet" />
          <div className="text-brand-ink">
            <p>
              If an account exists for{" "}
              <span className="font-semibold break-all">{sentTo}</span>,
              we&apos;ve sent a reset link to it.
            </p>
            <p className="mt-2 text-muted-foreground">
              The link expires after a while. Check your spam folder if it
              doesn&apos;t arrive in a few minutes.
            </p>
          </div>
        </div>
      ) : (
        <>
          {expired && (
            <div
              role="status"
              className="mb-6 flex gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm"
            >
              <TriangleAlertIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
              <p className="text-brand-ink">
                That reset link is invalid or has expired. Request a new one
                below.
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-5"
          >
            <AuthField
              id="email"
              label="PCU email"
              error={errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="yourname@pcu.edu.ph"
                className={authInputClass}
                aria-invalid={!!errors.email}
                aria-describedby={describedBy(
                  "email",
                  undefined,
                  errors.email?.message,
                )}
                {...register("email")}
              />
            </AuthField>

            {serverError && (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
              >
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="mt-1 h-11 w-full rounded-md text-base"
            >
              {pending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </>
      )}

      <Link
        href="/login"
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-indigo underline-offset-4 hover:underline"
      >
        <ArrowLeftIcon className="size-4" />
        Back to log in
      </Link>
    </>
  );
}
