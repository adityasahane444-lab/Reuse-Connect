import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { UserProvider } from "@/lib/UserContext";
import PWARegister from "@/components/PWARegister";

export const viewport = {
  themeColor: "#166534",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Reuse & Connect",
  description: "Reuse more. Waste less. A community platform for food, resources, travel gear and events.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "Reuse & Connect",
    statusBarStyle: "default",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#F7FAF7] text-[#1F2937]">
        <UserProvider>
          <PWARegister />
          <Navbar />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
