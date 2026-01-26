import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlasmicRootProvider } from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "@/lib/plasmic";
import 'katex/dist/katex.min.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kanban Pro - Supabase Demo",
  description: "A modern Kanban board built with Next.js and Supabase showcasing real-time collaboration, authentication, and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <PlasmicRootProvider loader={PLASMIC}>
            {children}
          </PlasmicRootProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
