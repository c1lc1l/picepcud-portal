import type { Metadata } from "next";
import { safeNextPath } from "@/lib/safe-next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in | PICE PCUD",
  description: "Log in to the PICE PCU–Dasmariñas Student Chapter portal.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { registered, next } = await searchParams;
  return (
    <LoginForm
      registered={registered === "1"}
      next={safeNextPath(typeof next === "string" ? next : undefined)}
    />
  );
}
