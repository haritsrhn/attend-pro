"use client"

import { useEffect, useMemo, useState } from "react"
import { format, subDays } from "date-fns"
import { CalendarIcon, Download, Search } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ReportRow = {
  id: string
  clockInTime: string
  clockOutTime: string | null
  status: "PRESENT" | "LATE"
  employeeId: string
  employeeName: string
  companyName: string
  siteName: string
}

const siteOptions = [
  "All Sites",
  "Kel. Limau Mungkur",
  "Binjai Barat",
  "Batang Kuis",
  "Garuda",
  "Beringin",
  "Sei Sikambing B",
  "Sunggal",
  "Hamparan Perak",
]

const companyOptions = [
  "All Companies",
  "Yayasan Alexandria Mahesa Raya",
  "CV Pesona Tiga Saudara",
  "PT Amanah Solusi Sejahtera",
]

const getStatusStyles = (status: ReportRow["status"]) => {
  switch (status) {
    case "PRESENT":
      return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "LATE":
      return "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

function formatDateJakarta(date: Date) {
  return date.toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  })
}

function formatTimeJakarta(date: Date | null) {
  if (!date) return "-"
  return date.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [siteFilter, setSiteFilter] = useState("All Sites")
  const [companyFilter, setCompanyFilter] = useState("All Companies")
  const [data, setData] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return

    const controller = new AbortController()

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        params.set("startDate", dateRange.from.toISOString())
        params.set("endDate", dateRange.to.toISOString())
        if (searchQuery.trim()) params.set("search", searchQuery.trim())
        if (siteFilter !== "All Sites") params.set("siteId", siteFilter)
        if (companyFilter !== "All Companies")
          params.set("companyId", companyFilter)

        const res = await fetch(
          `/api/reports/attendance?${params.toString()}`,
          {
            signal: controller.signal,
          },
        )

        if (!res.ok) {
          throw new Error("Failed to load attendance reports")
        }

        const json = (await res.json()) as ReportRow[]
        setData(json)
      } catch (err) {
        if ((err as any).name === "AbortError") return
        setError(
          (err as Error).message ??
            "Unable to load attendance data. Please try again.",
        )
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => controller.abort()
  }, [dateRange, searchQuery, siteFilter, companyFilter])

  const handleDownloadCsv = () => {
    if (!dateRange?.from || !dateRange?.to || data.length === 0) return

    const startStr = format(dateRange.from, "yyyy-MM-dd")
    const endStr = format(dateRange.to, "yyyy-MM-dd")

    const headers = [
      "Date",
      "Employee Name",
      "Employee ID",
      "Company",
      "Site",
      "Clock In",
      "Clock Out",
      "Status",
    ]

    const escapeCsv = (value: string | number | null | undefined) => {
      const str = value == null ? "" : String(value)
      const escaped = str.replace(/"/g, '""')
      return `"${escaped}"`
    }

    const rows = data.map((row) => {
      const clockIn = row.clockInTime
        ? new Date(row.clockInTime)
        : null
      const clockOut = row.clockOutTime
        ? new Date(row.clockOutTime)
        : null

      const dateLabel = clockIn
        ? formatDateJakarta(clockIn)
        : ""

      return [
        dateLabel,
        row.employeeName,
        row.employeeId,
        row.companyName,
        row.siteName,
        formatTimeJakarta(clockIn),
        formatTimeJakarta(clockOut),
        row.status,
      ]
        .map(escapeCsv)
        .join(",")
    })

    const csv = [headers.map(escapeCsv).join(","), ...rows].join("\r\n")
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute(
      "download",
      `Attendance_Report_${startStr}_to_${endStr}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const totalRecords = data.length

  const dateRangeLabel =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "LLL dd, y")} - ${format(
          dateRange.to,
          "LLL dd, y",
        )}`
      : "Pick a date range"

  const tableRows = useMemo(
    () =>
      data.map((row) => {
        const clockIn = row.clockInTime
          ? new Date(row.clockInTime)
          : null
        const clockOut = row.clockOutTime
          ? new Date(row.clockOutTime)
          : null

        return {
          ...row,
          dateLabel: clockIn ? format(clockIn, "MMM dd, yyyy") : "-",
          clockInLabel: formatTimeJakarta(clockIn),
          clockOutLabel: formatTimeJakarta(clockOut),
        }
      }),
    [data],
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Attendance Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze historical attendance and export records as CSV.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[280px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Export Button */}
          <Button
            onClick={handleDownloadCsv}
            className="gap-2"
            disabled={loading || data.length === 0}
          >
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by Employee Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary/50 border-0"
              />
            </div>

            {/* Site Filter */}
            <Select
              value={siteFilter}
              onValueChange={(value) => setSiteFilter(value)}
            >
              <SelectTrigger className="bg-secondary/50 border-0">
                <SelectValue placeholder="Filter by site" />
              </SelectTrigger>
              <SelectContent>
                {siteOptions.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Company Filter */}
            <Select
              value={companyFilter}
              onValueChange={(value) => setCompanyFilter(value)}
            >
              <SelectTrigger className="bg-secondary/50 border-0">
                <SelectValue placeholder="Filter by company" />
              </SelectTrigger>
              <SelectContent>
                {companyOptions.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Results count */}
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {totalRecords}
              </span>
              <span className="ml-1">records found</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">
                    Date
                  </TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">
                    Employee Name
                  </TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">
                    Employee ID
                  </TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">
                    Company
                  </TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">
                    Site
                  </TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">
                    Clock In
                  </TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">
                    Clock Out
                  </TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Loading attendance records...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-destructive"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : tableRows.length > 0 ? (
                  tableRows.map((record) => (
                    <TableRow
                      key={record.id}
                      className="hover:bg-secondary/20 transition-colors"
                    >
                      <TableCell className="font-medium text-foreground whitespace-nowrap">
                        {record.dateLabel}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">
                          {record.employeeName}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {record.employeeId}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {record.companyName}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {record.siteName}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {record.clockInLabel}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {record.clockOutLabel}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-medium",
                            getStatusStyles(record.status),
                          )}
                        >
                          {record.status === "PRESENT" ? "Present" : "Late"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No records found for the selected filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

