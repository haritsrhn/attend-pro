"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, LogIn, Clock, ShieldCheck, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [employeeId, setEmployeeId] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>("")
  const [currentDate, setCurrentDate] = useState<string>("")
  const [errors, setErrors] = useState<{ employeeId?: string; password?: string }>({})

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      )
      setCurrentDate(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const validate = () => {
    const errs: { employeeId?: string; password?: string } = {}
    if (!employeeId.trim()) errs.employeeId = "Employee ID or Email is required."
    if (!password) errs.password = "Password is required."
    else if (password.length < 6) errs.password = "Password must be at least 6 characters."
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    
    setErrors({})
    setIsLoading(true)

    // MENGHUBUNGI DATABASE VIA NEXT-AUTH
    const res = await signIn("credentials", {
      employeeId: employeeId,
      password: password,
      redirect: false, // Kita atur redirect secara manual
    })

    setIsLoading(false)

    if (res?.error) {
      // Jika salah password atau ID tidak ditemukan
      setErrors({ employeeId: "ID Karyawan atau Password salah!" })
    } else {
      // Hard redirect agar seluruh sistem me-refresh status auth-nya
      window.location.href = "/dashboard"
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      {/* ── Left: Auth Form ─────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 md:w-1/2 min-h-screen px-6 py-10 sm:px-10 md:px-14 lg:px-20 justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-sm flex-shrink-0">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-foreground tracking-tight">AttendPro</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              Attendance System
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-md mx-auto md:mx-0 py-10">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground text-balance leading-tight">
              Welcome Back
            </h1>
            <p className="text-muted-foreground mt-2 leading-relaxed text-sm">
              Sign in to your account to access the attendance portal.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Employee ID */}
            <div className="space-y-1.5">
              <Label htmlFor="employeeId" className="text-sm font-medium text-foreground">
                Employee ID / Email
              </Label>
              <Input
                id="employeeId"
                type="text"
                placeholder="e.g. EMP-0042 or employee@company.com"
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(e.target.value)
                  if (errors.employeeId) setErrors((p) => ({ ...p, employeeId: undefined }))
                }}
                className={cn(
                  "h-11 rounded-xl border-border bg-white text-sm transition-shadow focus-visible:shadow-sm",
                  errors.employeeId && "border-destructive focus-visible:ring-destructive"
                )}
                autoComplete="username"
                aria-describedby={errors.employeeId ? "employeeId-error" : undefined}
              />
              {errors.employeeId && (
                <p id="employeeId-error" className="text-xs text-destructive mt-1" role="alert">
                  {errors.employeeId}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Link
                  href="#"
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                  }}
                  className={cn(
                    "h-11 rounded-xl border-border bg-white text-sm pr-11 transition-shadow focus-visible:shadow-sm",
                    errors.password && "border-destructive focus-visible:ring-destructive"
                  )}
                  autoComplete="current-password"
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-destructive mt-1" role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2.5 pt-1">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(Boolean(v))}
                className="rounded-md border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                Remember me for 30 days
              </Label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </span>
              )}
            </Button>
          </form>

          {/* Security Note */}
          <div className="mt-6 flex items-start gap-2 rounded-xl bg-secondary border border-border px-4 py-3">
            <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your connection is secure. This portal is for authorized personnel only.
              Unauthorized access is strictly prohibited.
            </p>
          </div>
        </div>

        {/* Footer Branding */}
        <footer className="pt-4 border-t border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
              Managed Entities
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
            Yayasan Alexandria Mahesa Raya&nbsp;&nbsp;|&nbsp;&nbsp;
            CV Pesona Tiga Saudara&nbsp;&nbsp;|&nbsp;&nbsp;
            PT Amanah Solusi Sejahtera
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-2">
            &copy; {new Date().getFullYear()} AttendPro. All rights reserved.
          </p>
        </footer>
      </div>

      {/* ── Right: Brand Panel ──────────────────────────────────────── */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden flex-col items-center justify-center">
        {/* Background image */}
        <Image
          src="/images/login-brand.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          aria-hidden="true"
        />

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.22 0.07 250 / 0.90) 0%, oklch(0.35 0.12 230 / 0.85) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Decorative grid dots */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 px-12 lg:px-16 text-center text-white">
          {/* Icon badge */}
          <div className="mx-auto mb-8 h-20 w-20 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
            <Clock className="h-10 w-10 text-white" />
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold text-white text-balance leading-tight mb-4">
            Smart Attendance,<br />Seamless Workforce
          </h2>
          <p className="text-white/70 text-sm lg:text-base leading-relaxed max-w-sm mx-auto mb-10">
            Track employee hours, manage leave requests, and generate comprehensive
            attendance reports — all from one unified platform.
          </p>

          {/* Live clock */}
          <div className="inline-flex flex-col items-center gap-1 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm px-8 py-5 shadow-lg">
            <p className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">
              System Time
            </p>
            <p className="text-3xl font-bold text-white tabular-nums tracking-tight font-mono">
              {currentTime || "──:──:──"}
            </p>
            <p className="text-xs text-white/60">{currentDate}</p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-10">
            {["GPS Verified Clock-In", "Live Monitoring", "Auto Reports", "Multi-Site"].map(
              (feat) => (
                <span
                  key={feat}
                  className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs text-white/80 font-medium"
                >
                  {feat}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
