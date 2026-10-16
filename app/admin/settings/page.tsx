import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FeaturedPostForm } from "@/components/admin/FeaturedPostForm";
import { GcashSettingsForm } from "@/components/admin/GcashSettingsForm";
import { eventDateFormat } from "@/lib/events";
import { getFeaturedPost } from "@/lib/featured";
import { getGcashSettings } from "@/lib/payments/gcash";

export const metadata: Metadata = { title: "Settings | Admin | PICE PCUD" };

function LoadError({ what, message }: { what: string; message?: string }) {
  return (
    <p role="alert" className="text-sm text-destructive">
      Couldn&apos;t load {what}
      {message ? `: ${message}` : ". Run the latest database migration."}
    </p>
  );
}

export default async function AdminSettingsPage() {
  const [{ settings, error }, { post, error: featuredError }] =
    await Promise.all([getGcashSettings(), getFeaturedPost()]);

  return (
    <>
      <AdminPageHeader
        title="Settings"
        description="Chapter details used across the portal."
      />
      <div className="flex max-w-3xl flex-col gap-6">
        {error || !settings ? (
          <LoadError what="payment settings" message={error?.message} />
        ) : (
          <GcashSettingsForm
            initial={{
              accountName: settings.account_name,
              accountRole: settings.account_role,
              accountNumber: settings.account_number,
              qrUrl: settings.qr_path
                ? `/payments/gcash-qr?v=${encodeURIComponent(settings.updated_at)}`
                : null,
              updatedAt:
                settings.account_number || settings.qr_path
                  ? eventDateFormat.format(new Date(settings.updated_at))
                  : null,
            }}
          />
        )}

        {featuredError || !post ? (
          <LoadError
            what="the featured post"
            message={featuredError?.message}
          />
        ) : (
          <FeaturedPostForm
            initial={{
              isVisible: post.is_visible,
              title: post.title,
              eyebrow: post.eyebrow,
              body: post.body,
              imageUrl: post.image_url,
              imageAlt: post.image_alt,
              linkUrl: post.link_url ?? "",
              linkLabel: post.link_label,
            }}
          />
        )}
      </div>
    </>
  );
}
