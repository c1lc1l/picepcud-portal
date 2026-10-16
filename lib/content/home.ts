/**
 * Homepage copy, kept separate so text changes need no component edits.
 *
 * `tagline` and `about` are the chapter's own lines (supplied 2026-10-16).
 * `membership` is portal-written copy describing the actual dues flow.
 */
export const homeContent = {
  tagline: "Forged in clarity, built out of impact.",
  about:
    "PICE – Philippine Christian University – Dasmariñas Student Chapter is a student-led organization committed to developing future civil engineers through technical training, leadership, and professional growth.",
  membership: {
    heading: "Becoming a member",
    intro:
      "Membership is open to civil engineering students of PCU–Dasmariñas.",
    steps: [
      {
        title: "Register",
        body: "Create an account with your student ID and year level.",
      },
      {
        title: "Pay your dues",
        body: "Send your dues through GCash and upload the receipt from your dashboard.",
      },
      {
        title: "Get verified",
        body: "An officer reviews your receipt. You'll receive an email once it's approved.",
      },
    ],
  },
} as const;
