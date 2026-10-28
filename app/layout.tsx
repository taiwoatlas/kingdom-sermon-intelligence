import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kingdom Sermon Intelligence",
  description: "Turn sermons into faithful, editable resources for your church.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}