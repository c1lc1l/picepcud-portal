"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AuthField,
  authInputClass,
  describedBy,
} from "@/components/auth/AuthField";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { YEAR_LEVEL_LABELS } from "@/lib/members";
import { cn } from "@/lib/utils";
import { signUp } from "@/app/actions/auth";
import {
  registerSchema,
  type RegisterInput,
  type RegisterValues,
} from "@/lib/validations/auth";

const PASSWORD_HINT = "At least 8 characters.";
const EMAIL_HINT = "Accounts use your PCU school email.";

function FieldGroup({
  legend,
  children,
}: {
  legend: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-4 font-wide text-[0.6rem] uppercase tracking-[0.14em] text-brand-violet">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

export function RegisterForm() {
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (values: RegisterValues) => {
    setServerError(undefined);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, String(v)));
    startTransition(async () => {
      const res = await signUp(fd);
      if (res?.error) setServerError(res.error);
    });
  };

  return (
    <>
      <h1 className="font-headline text-6xl leading-none uppercase text-brand-ink">
        Join the chapter
      </h1>
      <p className="mt-3 text-muted-foreground">
        Create your account, then settle your membership fee from your dashboard. An officer
        reviews each payment and emails you once it&apos;s approved.
      </p>
      <hr className="chrome-rule mt-6 mb-8" />

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-8"
      >
        <FieldGroup legend="Student details">
          <AuthField
            id="fullName"
            label="Full name"
            error={errors.fullName?.message}
          >
            <Input
              id="fullName"
              autoComplete="name"
              className={authInputClass}
              aria-invalid={!!errors.fullName}
              aria-describedby={describedBy(
                "fullName",
                undefined,
                errors.fullName?.message,
              )}
              {...register("fullName")}
            />
          </AuthField>

          <div className="grid gap-5 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <AuthField
              id="studentId"
              label="Student ID"
              error={errors.studentId?.message}
            >
              <Input
                id="studentId"
                autoComplete="off"
                className={authInputClass}
                aria-invalid={!!errors.studentId}
                aria-describedby={describedBy(
                  "studentId",
                  undefined,
                  errors.studentId?.message,
                )}
                {...register("studentId")}
              />
            </AuthField>

            <AuthField
              id="yearLevel"
              label="Year level"
              error={errors.yearLevel?.message}
            >
              <select
                id="yearLevel"
                defaultValue=""
                aria-invalid={!!errors.yearLevel}
                aria-describedby={describedBy(
                  "yearLevel",
                  undefined,
                  errors.yearLevel?.message,
                )}
                className={cn(
                  "w-full rounded-lg border border-input text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm",
                  authInputClass,
                )}
                {...register("yearLevel")}
              >
                <option value="" disabled>
                  Select year
                </option>
                {YEAR_LEVEL_LABELS.map((label, i) => (
                  <option key={label} value={i + 1}>
                    {label}
                  </option>
                ))}
              </select>
            </AuthField>
          </div>
        </FieldGroup>

        <FieldGroup legend="Account">
          <AuthField
            id="email"
            label="PCU email"
            hint={EMAIL_HINT}
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
                EMAIL_HINT,
                errors.email?.message,
              )}
              {...register("email")}
            />
          </AuthField>

          <AuthField
            id="password"
            label="Password"
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
        </FieldGroup>

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
          className="h-11 w-full rounded-md text-base"
        >
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-sm text-muted-foreground">
        Already a member?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-indigo underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </>
  );
}
