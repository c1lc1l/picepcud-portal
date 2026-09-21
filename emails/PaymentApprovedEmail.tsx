import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface PaymentApprovedEmailProps {
  studentName: string;
  studentId: string;
  referenceNo: string;
  amount: string;
  dateApproved: string;
}

const darkModeCss = `
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  @media (prefers-color-scheme: dark) {
    .body { background-color: #0a0a0a !important; }
    .card { background-color: #171717 !important; border-color: #2e2e2e !important; }
    .text { color: #f5f5f5 !important; }
    .muted { color: #a3a3a3 !important; }
    .divider { border-color: #2e2e2e !important; }
    .banner { background-color: #14532d !important; }
    .banner-text { color: #dcfce7 !important; }
  }
`;

export default function PaymentApprovedEmail({
  studentName,
  studentId,
  referenceNo,
  amount,
  dateApproved,
}: PaymentApprovedEmailProps) {
  const rows: [string, string][] = [
    ["Student", `${studentName} (${studentId})`],
    ["Reference No.", referenceNo],
    ["Amount", amount],
    ["Date Approved", dateApproved],
  ];

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{darkModeCss}</style>
      </Head>
      <Preview>PICE PCUD Payment Approved - Ref {referenceNo}</Preview>
      <Body className="body" style={styles.body}>
        <Container className="card" style={styles.card}>
          <Section className="banner" style={styles.banner}>
            <Heading as="h1" className="banner-text" style={styles.bannerText}>
              PICE PCUD Payment Approved
            </Heading>
          </Section>
          <Section style={styles.content}>
            <Text className="text" style={styles.text}>
              Hi {studentName},
            </Text>
            <Text className="text" style={styles.text}>
              Your payment has been reviewed and approved. Keep this email as
              your receipt.
            </Text>
            <Hr className="divider" style={styles.hr} />
            {rows.map(([label, value]) => (
              <table key={label} width="100%" style={styles.row}>
                <tbody>
                  <tr>
                    <td className="muted" style={styles.label}>
                      {label}
                    </td>
                    <td className="text" style={styles.value}>
                      {value}
                    </td>
                  </tr>
                </tbody>
              </table>
            ))}
            <Hr className="divider" style={styles.hr} />
            <Text className="muted" style={styles.footer}>
              This is an automated message from the PICE PCUD Portal. Please do
              not reply.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

PaymentApprovedEmail.PreviewProps = {
  studentName: "Juan Dela Cruz",
  studentId: "2021-00123",
  referenceNo: "PCUD-000123",
  amount: "PHP 500.00",
  dateApproved: "September 21, 2026",
} satisfies PaymentApprovedEmailProps;

const styles = {
  body: {
    backgroundColor: "#f4f4f5",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    margin: 0,
    padding: "24px 0",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e4e4e7",
    borderRadius: "8px",
    maxWidth: "560px",
    overflow: "hidden",
  },
  banner: { backgroundColor: "#16a34a", padding: "20px 32px" },
  bannerText: {
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: 600,
    margin: 0,
  },
  content: { padding: "24px 32px" },
  text: { color: "#18181b", fontSize: "15px", lineHeight: "24px" },
  hr: { borderColor: "#e4e4e7", margin: "20px 0" },
  row: { marginBottom: "8px" },
  label: { color: "#71717a", fontSize: "14px", width: "40%" },
  value: { color: "#18181b", fontSize: "14px", fontWeight: 600 },
  footer: { color: "#71717a", fontSize: "12px", lineHeight: "18px" },
} as const;
