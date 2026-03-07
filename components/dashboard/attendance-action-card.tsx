"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogIn, LogOut, MapPin, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function AttendanceActionCard() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 1. Jalankan jam real-time
    setCurrentTime(new Date())
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // 2. Cek memori browser agar tombol ingat status absen hari ini
    const savedState = localStorage.getItem('attendanceState')
    if (savedState) {
      const parsed = JSON.parse(savedState)
      // Pastikan memori yang disimpan adalah untuk tanggal hari ini
      if (parsed.date === new Date().toLocaleDateString()) {
         setIsClockedIn(parsed.isClockedIn)
         if (parsed.clockInTime) setClockInTime(parsed.clockInTime)
      } else {
         localStorage.removeItem('attendanceState') // Reset jika sudah ganti hari
      }
    }

    return () => clearInterval(timer)
  }, [])

  const handleClockIn = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: 'Kel. Limau Mungkur' })
      })

      if (res.ok) {
        setIsClockedIn(true)
        const now = new Date()
        const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        setClockInTime(timeStr)

        // Simpan memori ke browser
        localStorage.setItem('attendanceState', JSON.stringify({
           isClockedIn: true,
           clockInTime: timeStr,
           date: now.toLocaleDateString()
        }))

        // Refresh tabel database di latar belakang tanpa me-reload penuh browser
        router.refresh(); 
      } else {
        const data = await res.json()
        alert(data.message || "Gagal melakukan absen masuk.")
      }
    } catch (error) {
      console.error(error)
      alert("Terjadi kesalahan jaringan.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClockOut = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clockOutLocation: 'Kel. Limau Mungkur' })
      })

      if (res.ok) {
        setIsClockedIn(false)
        setClockInTime(null)

        // Perbarui memori browser
        localStorage.setItem('attendanceState', JSON.stringify({
           isClockedIn: false,
           clockInTime: null,
           date: new Date().toLocaleDateString()
        }))

        // Refresh tabel database di latar belakang
        router.refresh(); 
      } else {
        const data = await res.json()
        alert(data.message || "Gagal melakukan absen keluar.")
      }
    } catch (error) {
      console.error(error)
      alert("Terjadi kesalahan jaringan.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Attendance Action</CardTitle>
          <Badge
            variant={isClockedIn ? "default" : "secondary"}
            className={isClockedIn ? "bg-success text-success-foreground" : ""}
          >
            {isClockedIn ? (
              <>
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Clocked In
              </>
            ) : (
              "Not Clocked In"
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 bg-secondary/30 rounded-lg">
          <p className="text-3xl font-bold text-foreground tabular-nums tracking-tight">
            {currentTime ? formatTime(currentTime) : "--:--:--"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {currentTime ? currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            }) : "Loading..."}
          </p>
        </div>

        {isClockedIn && clockInTime && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-primary/5 py-2 rounded-md">
            <span>Clocked in at</span>
            <span className="font-semibold text-primary">{clockInTime} WIB</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-2">
          <Button
            size="lg"
            onClick={handleClockIn}
            disabled={isClockedIn || isLoading}
            className="h-14 bg-success hover:bg-success/90 text-success-foreground disabled:opacity-50 transition-all"
          >
            <LogIn className="mr-2 h-5 w-5" />
            {isLoading && !isClockedIn ? "Processing..." : "Clock In"}
          </Button>
          <Button
            size="lg"
            onClick={handleClockOut}
            disabled={!isClockedIn || isLoading}
            variant="destructive"
            className="h-14 disabled:opacity-50 transition-all"
          >
            <LogOut className="mr-2 h-5 w-5" />
            {isLoading && isClockedIn ? "Processing..." : "Clock Out"}
          </Button>
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Your Location</span>
          </div>
          <div className="relative h-32 bg-secondary/50 rounded-lg overflow-hidden border border-border">
            <div className="absolute inset-0 opacity-30">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />
                </div>
                <span className="text-xs font-medium text-foreground bg-background/90 px-2 py-1 rounded shadow-sm border border-border">
                  Kel. Limau Mungkur
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}