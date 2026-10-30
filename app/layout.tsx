import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Missed Call Text-Back",
  description: "Never lose a job to a missed call. $49/mo.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: 760, margin: "0 auto", padding: 24 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
