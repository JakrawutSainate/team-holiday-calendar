import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SideNavBar from "@/src/components/SideNavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HolidayHQ - Team Holiday Calendar",
  description: "Team Shift & Token Calendar System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex bg-background text-on-surface custom-scrollbar">
        <SideNavBar />
        <div className="flex-1 flex flex-col min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
