import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset password | PICE PCUD",
  description: "Request a password reset link for the PICE PCUD portal.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/forgot-password">) {
  const { expired } = await searchParams;
  return <ForgotPasswordForm expired={expired === "1"} />;
}
