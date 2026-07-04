import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CollabCode — Real-time Collaborative Code Editor",
  description:
    "A browser-based code editor where multiple users can join the same room and edit code simultaneously. Real-time sync with zero conflicts.",
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: "#0d1117", color: "#e6edf3" }}
      >
        {children}
        <Toaster
          theme="dark"
          toastOptions={{
            style: {
              background: "#161b22",
              border: "1px solid #30363d",
              color: "#e6edf3",
            },
          }}
        />
      </body>
    </html>
  );
}