import type { SVGProps } from "react";
import { LinkIcon } from "lucide-react";

// Brand marks in lucide's stroke style (lucide v1 dropped brand icons).
type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function LinkedinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function GithubIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

/** Picks a brand icon from a link's hostname, falling back to a link icon. */
export function LinkHostIcon({ url, ...props }: IconProps & { url: string }) {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {}
  if (host.endsWith("facebook.com") || host === "fb.com") {
    return <FacebookIcon {...props} />;
  }
  if (host.endsWith("instagram.com")) return <InstagramIcon {...props} />;
  if (host.endsWith("linkedin.com")) return <LinkedinIcon {...props} />;
  if (host.endsWith("github.com")) return <GithubIcon {...props} />;
  return <LinkIcon aria-hidden {...props} />;
}

export const CHAPTER_SOCIALS = [
  {
    label: "PICE PCUD on Facebook",
    href: "https://www.facebook.com/picepcudstudentchapter",
    Icon: FacebookIcon,
  },
  {
    label: "PICE PCUD on Instagram",
    href: "https://www.instagram.com/picepcudsc",
    Icon: InstagramIcon,
  },
];
