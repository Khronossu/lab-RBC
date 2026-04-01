import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RBC Lab",
  description: "Red Blood Cell Counting System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="border-b bg-white px-6 py-4 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">RBC Lab</h1>
          <p className="text-sm text-gray-500">Red Blood Cell Counting System</p>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
