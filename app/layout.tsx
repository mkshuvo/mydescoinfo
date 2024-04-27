import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from "../components/Sidebar";
import Navbar from "@/components/Navbar";

import "./globals.css";

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
      <body className="bg-black">
      <Navbar />
      <div className="flex">
        {/*<Sidebar />*/}
        <main className="flex-grow p-4">{children}</main>
      </div>
      </body>
      </html>
  );
}
