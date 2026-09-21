"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signUp } from "@/app/actions/auth";
import {
  registerSchema,
  type RegisterInput,
  type RegisterValues,
} from "@/lib/validations/auth";

const fields = [
  { name: "fullName", label: "Full Name", type: "text", autoComplete: "name" },
  { name: "studentId", label: "Student ID", type: "text", autoComplete: "off" },
  {
    name: "yearLevel",
    label: "Year Level (1-5)",
    type: "number",
    autoComplete: "off",
  },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
  },
] as const;

export default function RegisterPage() {
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
    <div className="flex flex-1 items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Register for the Picepcud Portal.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="flex flex-col gap-4">
            {fields.map((f) => (
              <div key={f.name} className="flex flex-col gap-1.5">
                <label htmlFor={f.name} className="text-sm font-medium">
                  {f.label}
                </label>
                <Input
                  id={f.name}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  min={f.name === "yearLevel" ? 1 : undefined}
                  max={f.name === "yearLevel" ? 5 : undefined}
                  aria-invalid={!!errors[f.name]}
                  {...register(f.name)}
                />
                {errors[f.name] && (
                  <p className="text-sm text-destructive">
                    {errors[f.name]?.message}
                  </p>
                )}
              </div>
            ))}
            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating account..." : "Register"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already registered?{" "}
              <Link href="/login" className="underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
