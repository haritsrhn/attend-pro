"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Sembunyi di HP, Tampil di Laptop */}
      <div className="hidden lg:block">
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>

      {/* Background Gelap saat Sidebar Terbuka di HP */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden",
          isSidebarOpen ? "block" : "hidden"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Versi Mobile (HP) */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          isOpen={true}
          onToggle={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Area Konten Utama */}
      <div
        className={cn(
          "transition-all duration-300 flex flex-col min-h-screen",
          isSidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="p-4 md:p-6 bg-[#f8fafc] flex-1">{children}</main>
      </div>
    </div>
  )
}