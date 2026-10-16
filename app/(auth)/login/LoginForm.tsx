"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon } from "lucide-react";
import {
  AuthField,
  authInputClass,
  describedBy,
} from "@/components/auth/AuthField";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/app/actions/auth";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";

export function LoginForm({ registered }: { registered: boolean }) {
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (values: LoginValues) => {
    setServerError(undefined);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, String(v)));
    startTransition(async () => {
      const res = await signIn(fd);
      if (res?.error) setServerError(res.error);
    });
  };

  return (
    <>
      <h1 className="font-headline text-6xl leading-none uppercase text-brand-ink">
        Log in
      </h1>
      <p className="mt-3 text-muted-foreground">
        Pay your dues, track your payments, and see chapter events.
      </p>
      <hr className="chrome-rule mt-6 mb-8" />

      {registered && (
        <div
          role="status"
          className="mb-6 flex gap-3 rounded-md border border-brand-periwinkle/40 bg-white p-4 text-sm"
        >
          <MailCheckIcon className="mt-0.5 size-5 shrink-0 text-brand-violet" />
          <p className="text-brand-ink">
            <span className="font-semibold">Account created.</span> Check your
            email for a confirmation link, then log in here.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
      >
        <AuthField id="email" label="PCU email" error={errors.email?.message}>
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

        <AuthField
          id="password"
          label="Password"
          error={errors.password?.message}
          labelAction={
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-brand-indigo underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            className={authInputClass}
            aria-invalid={!!errors.password}
            aria-describedby={describedBy(
              "password",
              undefined,
              errors.password?.message,
            )}
            {...register("password")}
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
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-8 text-sm text-muted-foreground">
        Not a member yet?{" "}
        <Link
          href="/register"
          className="font-semibold text-brand-indigo underline-offset-4 hover:underline"
        >
          Join the chapter
        </Link>
      </p>
    </>
  );
}
