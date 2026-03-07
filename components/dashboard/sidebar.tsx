"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Radio,
  Users,
  FileText,
  BarChart3,
  ChevronLeft,
  LogOut,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/clock", label: "Clock In / Out", icon: Radio },
  { href: "/employees", label: "Employee Directory", icon: Users },
  { href: "/leave", label: "Leave Requests", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
]

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[#0f172a] text-slate-300 transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-20"
      )}
    >
      {/* Bagian Logo & Tombol Tutup (Tampil saat Terbuka) */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        <div className={cn("flex items-center gap-3", !isOpen && "justify-center w-full")}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">AT</span>
          </div>
          {isOpen && (
            <span className="text-lg font-semibold tracking-tight text-white">AttendPro</span>
          )}
        </div>
        {isOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigasi Menu */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
                !isOpen && "justify-center px-0"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {isOpen && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Profil User */}
      <div className="border-t border-slate-800 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-slate-800",
                !isOpen && "justify-center px-0"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white text-xs">
                  AD
                </AvatarFallback>
              </Avatar>
              {isOpen && (
                <div className="flex-1 text-left overflow-hidden">
                  <p className="font-medium text-white truncate">Master Admin</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/login" className="text-red-500 w-full flex items-center cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* FITUR YANG HILANG: Tombol Buka (Tampil saat Tertutup) */}
      {!isOpen && (
        <div className="border-t border-slate-800 p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-full h-9 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center"
          >
            {/* Ikon panah diputar 180 derajat agar menghadap ke kanan */}
            <ChevronLeft className="h-4 w-4 rotate-180" /> 
          </Button>
        </div>
      )}
    </aside>
  )
}