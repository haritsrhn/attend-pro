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
  const [isFinished, setIsFinished] = useState(false)
  const [clockInTime, setClockInTime] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)

    // Langsung cek status ke database saat halaman dimuat
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/attendance/status')
        if (res.ok) {
          const data = await res.json()
          setIsClockedIn(data.isClockedIn)
          setIsFinished(data.isFinished)
          if (data.clockInTime) {
            const dateObj = new Date(data.clockInTime)
            setClockInTime(dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }))
          }
        }
      } catch (error) {
        console.error("Gagal mengambil status absen", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStatus()
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
        setClockInTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }))
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.message || "Gagal melakukan absen masuk.")
      }
    } catch (error) {
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
        setIsFinished(true) // Kunci semua tombol karena sudah selesai
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.message || "Gagal melakukan absen keluar.")
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Attendance Action</CardTitle>
          <Badge
            variant={isClockedIn ? "default" : isFinished ? "outline" : "secondary"}
            className={isClockedIn ? "bg-success text-success-foreground" : ""}
          >
            {isClockedIn ? <><CheckCircle2 className="mr-1 h-3 w-3" /> Clocked In</> : 
             isFinished ? "Completed Today" : "Not Clocked In"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4 bg-secondary/30 rounded-lg">
          <p className="text-3xl font-bold text-foreground tabular-nums tracking-tight">
            {currentTime ? formatTime(currentTime) : "--:--:--"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {currentTime ? currentTime.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }) : "Loading..."}
          </p>
        </div>

        {clockInTime && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-primary/5 py-2 rounded-md">
            <span>Clocked in at</span>
            <span className="font-semibold text-primary">{clockInTime} WIB</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-2">
          <Button
            size="lg"
            onClick={handleClockIn}
            disabled={isClockedIn || isFinished || isLoading}
            className="h-14 bg-success hover:bg-success/90 text-success-foreground disabled:opacity-50 transition-all"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Clock In
          </Button>
          <Button
            size="lg"
            onClick={handleClockOut}
            disabled={!isClockedIn || isFinished || isLoading}
            variant="destructive"
            className="h-14 disabled:opacity-50 transition-all"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Clock Out
          </Button>
        </div>

        {/* ... (Bagian peta lokasi di bawahnya tetap sama, silakan biarkan) ... */}
      </CardContent>
    </Card>
  )
}