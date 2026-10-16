import type { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Join | PICE PCUD",
  description:
    "Create an account with the PICE PCU–Dasmariñas Student Chapter portal.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
