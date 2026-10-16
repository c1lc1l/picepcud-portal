"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { updateOwnProfile } from "@/app/actions/profile";
import { AuthField, describedBy } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { YEAR_LEVEL_LABELS } from "@/lib/members";
import {
  profileSchema,
  type ProfileInput,
  type ProfileValues,
} from "@/lib/validations/auth";

const EMAIL_HINT = "Your email is your login, so it can't be changed here.";

/** "Edit" action for the dashboard's "Your details" card. */
export function EditProfileDialog({
  profile,
  email,
}: {
  profile: { full_name: string; student_id: string; year_level: number };
  email: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const defaults: ProfileInput = {
    fullName: profile.full_name,
    studentId: profile.student_id,
    yearLevel: profile.year_level,
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
  });

  function handleOpenChange(next: boolean) {
    if (pending) return;
    // Every open starts from the saved values.
    if (next) {
      reset(defaults);
      setServerError(undefined);
    }
    setOpen(next);
  }

  const onSubmit = (values: ProfileValues) => {
    setServerError(undefined);
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => fd.append(k, String(v)));
    startTransition(async () => {
      const res = await updateOwnProfile(fd);
      if ("error" in res) {
        setServerError(res.error);
        return;
      }
      toast.success("Your details were updated");
      setOpen(false);
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleOpenChange(true)}
      >
        <PencilIcon />
        Edit
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit your details</DialogTitle>
            <DialogDescription>
              Officers use these to match your payments, so keep them
              accurate.
            </DialogDescription>
          </DialogHeader>

          <form
            id="edit-profile-form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4"
          >
            <AuthField
              id="profile-fullName"
              label="Full name"
              error={errors.fullName?.message}
            >
              <Input
                id="profile-fullName"
                autoComplete="name"
                aria-invalid={!!errors.fullName}
                aria-describedby={describedBy(
                  "profile-fullName",
                  undefined,
                  errors.fullName?.message,
                )}
                {...register("fullName")}
              />
            </AuthField>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <AuthField
                id="profile-studentId"
                label="Student ID"
                error={errors.studentId?.message}
              >
                <Input
                  id="profile-studentId"
                  autoComplete="off"
                  aria-invalid={!!errors.studentId}
                  aria-describedby={describedBy(
                    "profile-studentId",
                    undefined,
                    errors.studentId?.message,
                  )}
                  {...register("studentId")}
                />
              </AuthField>

              <AuthField
                id="profile-yearLevel"
                label="Year level"
                error={errors.yearLevel?.message}
              >
                <select
                  id="profile-yearLevel"
                  aria-invalid={!!errors.yearLevel}
                  aria-describedby={describedBy(
                    "profile-yearLevel",
                    undefined,
                    errors.yearLevel?.message,
                  )}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm"
                  {...register("yearLevel")}
                >
                  {YEAR_LEVEL_LABELS.map((label, i) => (
                    <option key={label} value={i + 1}>
                      {label}
                    </option>
                  ))}
                </select>
              </AuthField>
            </div>

            <AuthField id="profile-email" label="Email" hint={EMAIL_HINT}>
              <Input
                id="profile-email"
                type="email"
                value={email ?? ""}
                readOnly
                aria-describedby="profile-email-hint"
                className="bg-muted text-muted-foreground"
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
          </form>

          <DialogFooter>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-profile-form"
              disabled={pending || !isDirty}
            >
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
