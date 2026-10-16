import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in | PICE PCUD",
  description: "Log in to the PICE PCU–Dasmariñas Student Chapter portal.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { registered } = await searchParams;
  return <LoginForm registered={registered === "1"} />;
}
