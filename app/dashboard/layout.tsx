"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Search, Bell } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Menu Samping */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Sisi Kanan (Header & Konten) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Header Atas */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 sticky top-0 z-30">
          <div className="flex w-full max-w-md items-center gap-2 text-muted-foreground bg-slate-100 px-3 py-2 rounded-lg">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Search employees, reports..."
              className="bg-transparent border-none shadow-none text-sm outline-none w-full"
            />
          </div>
          
          <div className="flex items-center gap-5">
            <div className="text-right flex flex-col items-end">
               <p className="text-sm font-semibold text-slate-900">Master Admin</p>
               <p className="text-[11px] text-slate-500">MBG Operations - Medan</p>
            </div>
            <div className="relative">
              <Bell className="h-5 w-5 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
            </div>
          </div>
        </header>

        {/* Area Tempat Dashboard Dimuat */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}