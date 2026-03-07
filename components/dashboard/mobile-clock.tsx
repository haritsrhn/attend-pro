"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Camera,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Clock,
  LogIn,
  LogOut,
  RefreshCw,
  Loader2,
  CalendarDays,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const SITES = [
  { name: "Kel. Limau Mungkur", lat: 3.5952, lng: 98.6722 },
  { name: "Binjai Barat", lat: 3.6005, lng: 98.4863 },
  { name: "Batang Kuis", lat: 3.4728, lng: 98.8397 },
  { name: "Garuda", lat: 3.5734, lng: 98.6857 },
  { name: "Beringin", lat: 3.7016, lng: 98.7253 },
  { name: "Sei Sikambing B", lat: 3.6085, lng: 98.6391 },
  { name: "Sunggal", lat: 3.5838, lng: 98.6294 },
  { name: "Hamparan Perak", lat: 3.6915, lng: 98.5612 },
]

const ALLOWED_RADIUS_KM = 0.5

type ClockStatus = "idle" | "clocked-in" | "clocked-out"

type Coordinates = {
  lat: number
  lng: number
}

interface AttendanceRecord {
  day: string
  date: string
  clockIn: string | null
  clockOut: string | null
  status: "present" | "late" | "absent" | "leave"
  site: string | null
}

const WEEK_RECORDS: AttendanceRecord[] = [
  { day: "Monday", date: "Mar 3", clockIn: "08:02", clockOut: "17:05", status: "present", site: "Sei Sikambing B" },
  { day: "Tuesday", date: "Mar 4", clockIn: "08:31", clockOut: "17:00", status: "late", site: "Sei Sikambing B" },
  { day: "Wednesday", date: "Mar 5", clockIn: "07:58", clockOut: "17:03", status: "present", site: "Sei Sikambing B" },
  { day: "Thursday", date: "Mar 6", clockIn: "08:05", clockOut: "17:10", status: "present", site: "Sei Sikambing B" },
  { day: "Friday", date: "Mar 7", clockIn: null, clockOut: null, status: "absent", site: null },
]

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getStatusColor(status: AttendanceRecord["status"]) {
  switch (status) {
    case "present": return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "late": return "bg-amber-100 text-amber-700 border-amber-200"
    case "absent": return "bg-red-100 text-red-700 border-red-200"
    case "leave": return "bg-blue-100 text-blue-700 border-blue-200"
  }
}

function haversineDistanceKm(a: Coordinates, b: Coordinates) {
  const R = 6371 // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lng - a.lng)
  const lat1Rad = toRad(a.lat)
  const lat2Rad = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}

export function MobileClock() {
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id as string | undefined
  const siteId = (session?.user as any)?.siteId as string | undefined

  const [now, setNow] = useState<Date | null>(null)
  const [clockStatus, setClockStatus] = useState<ClockStatus>("idle")
  const [clockInTime, setClockInTime] = useState<string | null>(null)
  const [clockOutTime, setClockOutTime] = useState<string | null>(null)
  const [locationVerified, setLocationVerified] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [detectedSite, setDetectedSite] = useState<string | null>(null)
  const [coords, setCoords] = useState<Coordinates | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [photoTaken, setPhotoTaken] = useState(false)
  const [isClockingIn, setIsClockingIn] = useState(false)
  const [isClockingOut, setIsClockingOut] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Live clock
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Real geolocation + placeholder radius verification against known SPPG sites
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not available",
        description: "Geolocation is not supported by this device.",
        variant: "destructive",
      })
      return
    }

    setLocationLoading(true)
    setLocationVerified(false)
    setDetectedSite(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentCoords: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setCoords(currentCoords)

        let nearestSite = SITES[0]
        let nearestDistance = Number.POSITIVE_INFINITY

        for (const site of SITES) {
          const distance = haversineDistanceKm(currentCoords, {
            lat: site.lat,
            lng: site.lng,
          })
          if (distance < nearestDistance) {
            nearestDistance = distance
            nearestSite = site
          }
        }

        const withinRadius = nearestDistance <= ALLOWED_RADIUS_KM
        setLocationVerified(withinRadius)

        setDetectedSite(
          `${nearestSite.name} (${nearestDistance.toFixed(2)} km)`,
        )

        if (!withinRadius) {
          toast({
            title: "Location not verified",
            description:
              "You appear to be outside the allowed radius of your operational site.",
            variant: "destructive",
          })
        }

        setLocationLoading(false)
      },
      (error) => {
        setLocationLoading(false)
        toast({
          title: "Unable to get location",
          description: error.message || "Please enable GPS and try again.",
          variant: "destructive",
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    )
  }, [])

  // Camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraActive(true)
    } catch {
      // Fallback: treat as active with placeholder
      setCameraActive(true)
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
  }, [])

  const takePhoto = useCallback(() => {
    setPhotoTaken(true)
    stopCamera()
  }, [stopCamera])

  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  const canAct = locationVerified && photoTaken

  // Attempt to detect location when the page loads
  useEffect(() => {
    detectLocation()
  }, [detectLocation])

  const handleClockIn = async () => {
    if (!userId) {
      toast({
        title: "Not authenticated",
        description: "Please sign in again to clock in.",
        variant: "destructive",
      })
      return
    }

    if (!locationVerified || !coords) {
      toast({
        title: "Location not verified",
        description: "Verify your GPS location before clocking in.",
        variant: "destructive",
      })
      return
    }

    setIsClockingIn(true)
    try {
      const response = await fetch("/api/attendance/clock-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          location: `${coords.lat},${coords.lng}`,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          (data as any)?.message ??
          (response.status === 400
            ? "Already clocked in today"
            : "Failed to clock in.")

        toast({
          title: "Clock In Failed",
          description: message,
          variant: "destructive",
        })
        return
      }

      const clockInIso = (data as any)?.clockInTime
      const clockInDate = clockInIso ? new Date(clockInIso) : new Date()

      setClockInTime(formatTime(clockInDate))
      setClockStatus("clocked-in")

      toast({
        title: "Clocked In Successfully",
        description: "Have a productive day!",
      })
    } catch {
      toast({
        title: "Clock In Failed",
        description: "Unexpected error, please try again.",
        variant: "destructive",
      })
    } finally {
      setIsClockingIn(false)
    }
  }

  const handleClockOut = async () => {
    if (!userId) {
      toast({
        title: "Not authenticated",
        description: "Please sign in again to clock out.",
        variant: "destructive",
      })
      return
    }

    if (!locationVerified || !coords) {
      toast({
        title: "Location not verified",
        description: "Verify your GPS location before clocking out.",
        variant: "destructive",
      })
      return
    }

    setIsClockingOut(true)
    try {
      const response = await fetch("/api/attendance/clock-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          clockOutLocation: `${coords.lat},${coords.lng}`,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const message =
          (data as any)?.message ??
          (response.status === 404
            ? "No clock-in record found for today."
            : response.status === 400
              ? "Already clocked out today."
              : "Failed to clock out.")

        toast({
          title: "Clock Out Failed",
          description: message,
          variant: "destructive",
        })
        return
      }

      const clockOutIso = (data as any)?.clockOutTime
      const clockOutDate = clockOutIso ? new Date(clockOutIso) : new Date()

      setClockOutTime(formatTime(clockOutDate))
      setClockStatus("clocked-out")

      toast({
        title: "Clocked Out Successfully",
        description: "See you next time!",
      })
    } catch {
      toast({
        title: "Clock Out Failed",
        description: "Unexpected error, please try again.",
        variant: "destructive",
      })
    } finally {
      setIsClockingOut(false)
    }
  }

  const todayRecord = WEEK_RECORDS[WEEK_RECORDS.length - 1]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 px-5 pt-6 pb-5 shadow-sm">
        <div className="max-w-md mx-auto">
          <p className="text-sm text-slate-500 font-medium">Good morning,</p>
          <h1 className="text-xl font-bold text-slate-800 mt-0.5">
            {(session?.user as any)?.name ?? "Employee"}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{now ? formatDate(now) : "Loading..."}</p>

          {/* Digital Clock */}
          <div className="mt-4 bg-slate-900 rounded-2xl px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Current Time</p>
              <p className="text-4xl font-mono font-bold text-white mt-1 tabular-nums tracking-tight">
                {now ? formatTime(now) : "--:--:--"}
              </p>
            </div>
            <div className="text-right">
              <div className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
                clockStatus === "idle" && "bg-slate-700 text-slate-300",
                clockStatus === "clocked-in" && "bg-emerald-500/20 text-emerald-400",
                clockStatus === "clocked-out" && "bg-blue-500/20 text-blue-400",
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  clockStatus === "idle" && "bg-slate-500",
                  clockStatus === "clocked-in" && "bg-emerald-400 animate-pulse",
                  clockStatus === "clocked-out" && "bg-blue-400",
                )} />
                {clockStatus === "idle" && "Not Clocked In"}
                {clockStatus === "clocked-in" && "Clocked In"}
                {clockStatus === "clocked-out" && "Shift Done"}
              </div>
              {clockInTime && (
                <p className="text-xs text-slate-400 mt-1.5">In: <span className="text-white font-mono">{clockInTime}</span></p>
              )}
              {clockOutTime && (
                <p className="text-xs text-slate-400">Out: <span className="text-white font-mono">{clockOutTime}</span></p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 max-w-md mx-auto w-full pb-44 space-y-4">

        {/* Selfie Verification Card */}
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">Selfie Verification</span>
            </div>
            {photoTaken && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Captured
              </Badge>
            )}
          </div>
          <CardContent className="p-0">
            {/* Camera Viewport */}
            <div className="relative bg-slate-900 aspect-[4/3] flex items-center justify-center">
              {cameraActive && !photoTaken ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {/* Face guide overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-36 h-44 border-2 border-white/60 rounded-full" />
                  </div>
                  <button
                    onClick={takePhoto}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full border-4 border-white/50 shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    <div className="w-10 h-10 bg-white rounded-full border-2 border-slate-300" />
                  </button>
                </>
              ) : photoTaken ? (
                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex flex-col items-center justify-center gap-3">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                  <p className="text-white text-sm font-medium">Photo Verified</p>
                  <button
                    onClick={() => { setPhotoTaken(false); startCamera() }}
                    className="text-xs text-slate-400 underline underline-offset-2"
                  >
                    Retake
                  </button>
                </div>
              ) : (
                /* Placeholder when camera not started */
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-800">
                  <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center">
                    <Camera className="h-9 w-9 text-slate-400" />
                  </div>
                  <p className="text-slate-400 text-sm text-center px-6">
                    Take a selfie to verify your identity
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    Open Camera
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location & Site Card */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">GPS Location</span>
            </div>
            {locationVerified ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                <AlertCircle className="h-3 w-3 mr-1" /> Not Verified
              </Badge>
            )}
          </div>
          <CardContent className="p-4 space-y-3">
            {/* Map Placeholder */}
            <div className="relative rounded-xl overflow-hidden bg-slate-100 h-32 border border-slate-200">
              {/* Simulated map tiles */}
              <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 opacity-30">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={cn("border border-slate-300", i % 3 === 0 && "bg-slate-200")} />
                ))}
              </div>
              {/* Simulated roads */}
              <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 200 100">
                <line x1="0" y1="50" x2="200" y2="50" stroke="#64748b" strokeWidth="3" />
                <line x1="100" y1="0" x2="100" y2="100" stroke="#64748b" strokeWidth="3" />
                <line x1="0" y1="25" x2="150" y2="75" stroke="#64748b" strokeWidth="2" />
                <line x1="50" y1="0" x2="200" y2="80" stroke="#64748b" strokeWidth="1.5" />
              </svg>
              {locationVerified ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-8 h-8 bg-blue-500 rounded-full border-3 border-white shadow-md flex items-center justify-center animate-pulse">
                      <div className="w-3 h-3 bg-white rounded-full" />
                    </div>
                    <div className="absolute -inset-2 bg-blue-400/30 rounded-full animate-ping" />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-slate-400 rounded-full border-2 border-white shadow-md flex items-center justify-center opacity-40">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Detected site */}
            <div className={cn(
              "rounded-xl px-4 py-3 flex items-center gap-3 border",
              locationVerified
                ? "bg-emerald-50 border-emerald-200"
                : "bg-slate-50 border-slate-200"
            )}>
              <MapPin className={cn("h-4 w-4 shrink-0", locationVerified ? "text-emerald-600" : "text-slate-400")} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 font-medium">Detected Location</p>
                <p className={cn(
                  "text-sm font-semibold truncate mt-0.5",
                  locationVerified ? "text-emerald-700" : "text-slate-400"
                )}>
                  {locationVerified && detectedSite ? detectedSite : "Location not detected"}
                </p>
              </div>
              <button
                onClick={detectLocation}
                disabled={locationLoading}
                className="shrink-0 p-1.5 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                aria-label="Refresh location"
              >
                <RefreshCw className={cn("h-4 w-4 text-slate-500", locationLoading && "animate-spin")} />
              </button>
            </div>

            {!locationVerified && (
              <Button
                onClick={detectLocation}
                disabled={locationLoading}
                variant="outline"
                className="w-full rounded-xl border-slate-300 text-slate-700 font-medium"
              >
                {locationLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Detecting Location...</>
                ) : (
                  <><MapPin className="h-4 w-4 mr-2" /> Detect My Location</>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Verification Checklist */}
        <div className="flex gap-3">
          <div className={cn(
            "flex-1 flex items-center gap-2.5 rounded-2xl px-4 py-3 border",
            photoTaken ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
          )}>
            <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0",
              photoTaken ? "bg-emerald-500" : "bg-slate-200"
            )}>
              <Camera className={cn("h-3.5 w-3.5", photoTaken ? "text-white" : "text-slate-400")} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Selfie</p>
              <p className={cn("text-xs", photoTaken ? "text-emerald-600" : "text-slate-400")}>
                {photoTaken ? "Verified" : "Pending"}
              </p>
            </div>
          </div>
          <div className={cn(
            "flex-1 flex items-center gap-2.5 rounded-2xl px-4 py-3 border",
            locationVerified ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"
          )}>
            <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0",
              locationVerified ? "bg-emerald-500" : "bg-slate-200"
            )}>
              <MapPin className={cn("h-3.5 w-3.5", locationVerified ? "text-white" : "text-slate-400")} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Location</p>
              <p className={cn("text-xs", locationVerified ? "text-emerald-600" : "text-slate-400")}>
                {locationVerified ? "Verified" : "Pending"}
              </p>
            </div>
          </div>
        </div>

        {/* Weekly History */}
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3.5 shadow-sm hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">This Week&apos;s Attendance</span>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">5 days</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", historyOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2">
              {WEEK_RECORDS.map((record) => (
                <div
                  key={record.day}
                  className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{record.day}</p>
                      <p className="text-xs text-slate-400">{record.date}</p>
                    </div>
                    <span className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full border capitalize",
                      getStatusColor(record.status)
                    )}>
                      {record.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <LogIn className="h-3 w-3" /> Clock In
                      </p>
                      <p className={cn("text-sm font-mono font-bold mt-0.5", record.clockIn ? "text-slate-800" : "text-slate-300")}>
                        {record.clockIn ?? "--:--"}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <LogOut className="h-3 w-3" /> Clock Out
                      </p>
                      <p className={cn("text-sm font-mono font-bold mt-0.5", record.clockOut ? "text-slate-800" : "text-slate-300")}>
                        {record.clockOut ?? "--:--"}
                      </p>
                    </div>
                  </div>
                  {record.site && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="h-3 w-3" />
                      {record.site}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Spacer for fixed buttons */}
        <div className="h-4" />
      </div>

      {/* ── Fixed Action Buttons ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-5 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-md mx-auto">
          {!canAct && (
            <p className="text-xs text-center text-slate-400 mb-3 flex items-center justify-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              Complete selfie and location verification to proceed
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleClockIn}
              disabled={
                !canAct ||
                clockStatus === "clocked-in" ||
                clockStatus === "clocked-out" ||
                isClockingIn
              }
              className={cn(
                "flex items-center justify-center gap-2.5 h-14 rounded-2xl text-white font-bold text-base transition-all duration-200 shadow-sm",
                canAct && clockStatus === "idle"
                  ? "bg-emerald-500 hover:bg-emerald-600 active:scale-95 shadow-emerald-200 shadow-md"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {isClockingIn && clockStatus === "idle" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Clock In
                </>
              )}
            </button>
            <button
              onClick={handleClockOut}
              disabled={!canAct || clockStatus !== "clocked-in" || isClockingOut}
              className={cn(
                "flex items-center justify-center gap-2.5 h-14 rounded-2xl text-white font-bold text-base transition-all duration-200 shadow-sm",
                canAct && clockStatus === "clocked-in"
                  ? "bg-red-500 hover:bg-red-600 active:scale-95 shadow-red-200 shadow-md"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {isClockingOut && clockStatus === "clocked-in" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogOut className="h-5 w-5" />
                  Clock Out
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
