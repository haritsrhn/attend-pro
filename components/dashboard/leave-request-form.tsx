"use client"

import { useState, useCallback, useRef } from "react"
import { format, subDays } from "date-fns"
import {
  CalendarIcon,
  Upload,
  FileText,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

// --- Types ---
type LeaveStatus = "Pending" | "Approved" | "Rejected"

interface UploadedFile {
  name: string
  size: number
  type: string
  id: string
}

interface LeaveRequest {
  id: string
  dateRange: string
  leaveType: string
  reason: string
  status: LeaveStatus
  submittedAt: string
  duration: string
}

// --- Mock history data ---
const initialHistory: LeaveRequest[] = [
  {
    id: "LR-0045",
    dateRange: "Feb 10 – Feb 12, 2025",
    leaveType: "Annual Leave",
    reason: "Family vacation trip planned.",
    status: "Approved",
    submittedAt: "Feb 5, 2025",
    duration: "3 days",
  },
  {
    id: "LR-0044",
    dateRange: "Jan 22, 2025",
    leaveType: "Sick Leave",
    reason: "High fever and doctor recommended rest.",
    status: "Approved",
    submittedAt: "Jan 22, 2025",
    duration: "1 day",
  },
  {
    id: "LR-0043",
    dateRange: "Jan 6 – Jan 7, 2025",
    leaveType: "Official Duty",
    reason: "Attending regional operations briefing in Medan.",
    status: "Approved",
    submittedAt: "Jan 3, 2025",
    duration: "2 days",
  },
  {
    id: "LR-0042",
    dateRange: "Dec 24 – Dec 25, 2024",
    leaveType: "Annual Leave",
    reason: "Year-end holiday.",
    status: "Rejected",
    submittedAt: "Dec 20, 2024",
    duration: "2 days",
  },
  {
    id: "LR-0041",
    dateRange: "Dec 9, 2024",
    leaveType: "Unpaid Leave",
    reason: "Personal matter.",
    status: "Rejected",
    submittedAt: "Dec 8, 2024",
    duration: "1 day",
  },
]

// --- Status badge config ---
const statusConfig: Record<LeaveStatus, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  Pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  Approved: {
    label: "Approved",
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  Rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-red-100 text-red-700 border-red-200",
  },
}

function StatusBadge({ status }: { status: LeaveStatus }) {
  const config = statusConfig[status]
  const Icon = config.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// --- Main Component ---
export function LeaveRequestForm() {
  // Form state
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [leaveType, setLeaveType] = useState("")
  const [reason, setReason] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(true)
  const [history, setHistory] = useState<LeaveRequest[]>(initialHistory)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Compute duration label
  const getDurationLabel = (range?: DateRange): string => {
    if (!range?.from) return ""
    if (!range.to || range.from.toDateString() === range.to.toDateString()) return "1 day"
    const diff = Math.round((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return `${diff} days`
  }

  // File handling
  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return
    const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      id: `${f.name}-${Date.now()}-${Math.random()}`,
    }))
    setUploadedFiles((prev) => [...prev, ...newFiles])
  }, [])

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      addFiles(e.dataTransfer.files)
    },
    [addFiles]
  )

  // Validation
  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!dateRange?.from) newErrors.dateRange = "Please select a date range."
    if (!leaveType) newErrors.leaveType = "Please select a leave type."
    if (!reason.trim()) newErrors.reason = "Please provide a reason."
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 1200))

    const rangeLabel =
      dateRange?.from && dateRange.to && dateRange.from.toDateString() !== dateRange.to.toDateString()
        ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
        : dateRange?.from
        ? format(dateRange.from, "MMM d, yyyy")
        : ""

    const newRequest: LeaveRequest = {
      id: `LR-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      dateRange: rangeLabel,
      leaveType,
      reason,
      status: "Pending",
      submittedAt: format(new Date(), "MMM d, yyyy"),
      duration: getDurationLabel(dateRange),
    }

    setHistory((prev) => [newRequest, ...prev])
    setSubmitSuccess(true)
    setIsSubmitting(false)

    // Reset form
    setTimeout(() => {
      setDateRange(undefined)
      setLeaveType("")
      setReason("")
      setUploadedFiles([])
      setErrors({})
      setSubmitSuccess(false)
    }, 2500)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Submit Leave Request</h1>
        <p className="text-muted-foreground mt-1">
          Fill in the form below and your request will be reviewed by your supervisor.
        </p>
      </div>

      {/* Form Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Success banner */}
            {submitSuccess && (
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-700">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">
                  Your leave request has been submitted successfully and is pending approval.
                </p>
              </div>
            )}

            {/* Date Range */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Leave Date Range <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10 rounded-xl",
                      !dateRange && "text-muted-foreground",
                      errors.dateRange && "border-destructive"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {dateRange?.from ? (
                      dateRange.to && dateRange.from.toDateString() !== dateRange.to.toDateString() ? (
                        <>
                          {format(dateRange.from, "LLL dd, yyyy")} &mdash; {format(dateRange.to, "LLL dd, yyyy")}
                          <span className="ml-auto text-xs text-muted-foreground font-normal">
                            {getDurationLabel(dateRange)}
                          </span>
                        </>
                      ) : (
                        <>
                          {format(dateRange.from, "LLL dd, yyyy")}
                          <span className="ml-auto text-xs text-muted-foreground font-normal">1 day</span>
                        </>
                      )
                    ) : (
                      "Select start and end date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range)
                      setErrors((e) => ({ ...e, dateRange: "" }))
                    }}
                    numberOfMonths={2}
                    disabled={{ before: new Date() }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dateRange && (
                <p className="text-xs text-destructive">{errors.dateRange}</p>
              )}
            </div>

            {/* Leave Type */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Leave Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={leaveType}
                onValueChange={(v) => {
                  setLeaveType(v)
                  setErrors((e) => ({ ...e, leaveType: "" }))
                }}
              >
                <SelectTrigger
                  className={cn(
                    "h-10 rounded-xl",
                    errors.leaveType && "border-destructive"
                  )}
                >
                  <SelectValue placeholder="Select leave type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sick Leave">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-400 shrink-0" />
                      Sick Leave
                    </span>
                  </SelectItem>
                  <SelectItem value="Annual Leave">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                      Annual Leave
                    </span>
                  </SelectItem>
                  <SelectItem value="Unpaid Leave">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                      Unpaid Leave
                    </span>
                  </SelectItem>
                  <SelectItem value="Official Duty">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
                      Official Duty
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.leaveType && (
                <p className="text-xs text-destructive">{errors.leaveType}</p>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Reason / Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="Describe the reason for your leave request..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value)
                  setErrors((er) => ({ ...er, reason: "" }))
                }}
                rows={4}
                className={cn(
                  "rounded-xl resize-none",
                  errors.reason && "border-destructive"
                )}
              />
              <div className="flex items-center justify-between">
                {errors.reason ? (
                  <p className="text-xs text-destructive">{errors.reason}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-muted-foreground ml-auto">{reason.length} / 500</p>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Supporting Documents{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>

              {/* Drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 transition-colors",
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-secondary/40"
                )}
              >
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                  isDragOver ? "bg-primary/10" : "bg-secondary"
                )}>
                  <Upload className={cn("h-5 w-5", isDragOver ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Drag & drop files here, or{" "}
                    <span className="text-primary underline-offset-2 hover:underline">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supports PDF, JPG, PNG — max 10 MB per file
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="sr-only"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>

              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {uploadedFiles.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center gap-3 rounded-xl border bg-secondary/30 px-3 py-2"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Paperclip className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full h-12 rounded-2xl text-base font-semibold gap-2"
              disabled={isSubmitting || submitSuccess}
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Submitting...
                </>
              ) : submitSuccess ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Request Submitted
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Request
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Requests History */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <FileText className="h-5 w-5 text-primary" />
              Recent Requests
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHistoryExpanded((v) => !v)}
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              {historyExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" /> Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" /> Expand
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {historyExpanded && (
          <CardContent className="pt-0 px-6 pb-6">
            <Separator className="mb-4" />
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No leave requests submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((req, index) => (
                  <div
                    key={req.id}
                    className={cn(
                      "flex flex-col gap-2 rounded-2xl border p-4 transition-colors hover:bg-secondary/30 sm:flex-row sm:items-start sm:gap-4",
                      index === 0 && req.status === "Pending" && "border-amber-200 bg-amber-50/50"
                    )}
                  >
                    {/* Left: type color dot + info */}
                    <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {req.leaveType}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">{req.id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{req.dateRange}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {req.reason}
                      </p>
                    </div>

                    {/* Right: duration + status + submitted */}
                    <div className="flex shrink-0 items-start gap-3 sm:flex-col sm:items-end">
                      <StatusBadge status={req.status} />
                      <div className="text-right">
                        <p className="text-xs font-medium text-foreground">{req.duration}</p>
                        <p className="text-xs text-muted-foreground">Submitted {req.submittedAt}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
