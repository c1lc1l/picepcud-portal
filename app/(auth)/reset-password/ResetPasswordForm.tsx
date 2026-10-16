"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AuthField,
  authInputClass,
  describedBy,
} from "@/components/auth/AuthField";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { updatePassword } from "@/app/actions/auth";
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "@/lib/validations/auth";

const PASSWORD_HINT = "At least 8 characters.";

export function ResetPasswordForm({ email }: { email: string }) {
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = (values: ResetPasswordValues) => {
    setServerError(undefined);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, v));
    startTransition(async () => {
      const res = await updatePassword(fd);
      if (res?.error) setServerError(res.error);
    });
  };

  return (
    <>
      <h1 className="font-headline text-6xl leading-none uppercase text-brand-ink">
        Set a new password
      </h1>
      <p className="mt-3 text-muted-foreground">
        For <span className="font-medium text-brand-ink">{email}</span>.
        You&apos;ll be taken to your dashboard once it&apos;s saved.
      </p>
      <hr className="chrome-rule mt-6 mb-8" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
      >
        {/* Lets password managers attach the new password to the account. */}
        <input
          type="email"
          name="username"
          autoComplete="username"
          value={email}
          readOnly
          hidden
        />

        <AuthField
          id="password"
          label="New password"
          hint={PASSWORD_HINT}
          error={errors.password?.message}
        >
          <PasswordInput
            id="password"
            autoComplete="new-password"
            className={authInputClass}
            aria-invalid={!!errors.password}
            aria-describedby={describedBy(
              "password",
              PASSWORD_HINT,
              errors.password?.message,
            )}
            {...register("password")}
          />
        </AuthField>

        <AuthField
          id="confirmPassword"
          label="Confirm new password"
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            className={authInputClass}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={describedBy(
              "confirmPassword",
              undefined,
              errors.confirmPassword?.message,
            )}
            {...register("confirmPassword")}
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
          {pending ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </>
  );
}
