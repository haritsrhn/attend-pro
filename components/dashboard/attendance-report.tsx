"use client"

import { useState, useMemo } from "react"
import { format, subDays, isWithinInterval, parseISO } from "date-fns"
import { CalendarIcon, Download, Search, ChevronLeft, ChevronRight } from "lucide-react"
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

const locations = [
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

const statuses = ["All Status", "Present", "Late", "Absent", "Leave"]

const shifts = ["Morning (06:00-14:00)", "Day (08:00-17:00)", "Evening (14:00-22:00)", "Night (22:00-06:00)"]

// Generate mock attendance data
const generateMockData = () => {
  const employees = [
    { id: "EMP001", name: "Sarah Johnson" },
    { id: "EMP002", name: "Michael Chen" },
    { id: "EMP003", name: "Emily Rodriguez" },
    { id: "EMP004", name: "David Kim" },
    { id: "EMP005", name: "Jessica Taylor" },
    { id: "EMP006", name: "Robert Wilson" },
    { id: "EMP007", name: "Amanda Martinez" },
    { id: "EMP008", name: "James Brown" },
    { id: "EMP009", name: "Lisa Anderson" },
    { id: "EMP010", name: "William Garcia" },
    { id: "EMP011", name: "Jennifer Lee" },
    { id: "EMP012", name: "Christopher Moore" },
    { id: "EMP013", name: "Ashley Davis" },
    { id: "EMP014", name: "Matthew Jackson" },
    { id: "EMP015", name: "Stephanie White" },
  ]

  const statusOptions = ["Present", "Late", "Absent", "Leave"]
  const data: Array<{
    id: number
    date: string
    employeeId: string
    employeeName: string
    site: string
    shift: string
    clockIn: string
    clockOut: string
    totalHours: string
    status: string
  }> = []

  let id = 1
  for (let i = 0; i < 30; i++) {
    const date = subDays(new Date(), i)
    employees.forEach((emp) => {
      const statusIndex = Math.floor(Math.random() * 100)
      let status: string
      if (statusIndex < 70) status = "Present"
      else if (statusIndex < 85) status = "Late"
      else if (statusIndex < 95) status = "Absent"
      else status = "Leave"

      const site = locations[Math.floor(Math.random() * (locations.length - 1)) + 1]
      const shift = shifts[Math.floor(Math.random() * shifts.length)]

      let clockIn = "-"
      let clockOut = "-"
      let totalHours = "-"

      if (status === "Present") {
        clockIn = `08:${String(Math.floor(Math.random() * 30)).padStart(2, "0")} AM`
        clockOut = `05:${String(Math.floor(Math.random() * 30)).padStart(2, "0")} PM`
        totalHours = `${8 + Math.floor(Math.random() * 2)}h ${Math.floor(Math.random() * 60)}m`
      } else if (status === "Late") {
        clockIn = `09:${String(Math.floor(Math.random() * 30) + 15).padStart(2, "0")} AM`
        clockOut = `05:${String(Math.floor(Math.random() * 30) + 30).padStart(2, "0")} PM`
        totalHours = `${7 + Math.floor(Math.random() * 2)}h ${Math.floor(Math.random() * 60)}m`
      }

      data.push({
        id: id++,
        date: format(date, "yyyy-MM-dd"),
        employeeId: emp.id,
        employeeName: emp.name,
        site,
        shift,
        clockIn,
        clockOut,
        totalHours,
        status,
      })
    })
  }

  return data
}

const attendanceData = generateMockData()

const getStatusStyles = (status: string) => {
  switch (status) {
    case "Present":
      return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "Late":
      return "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
    case "Absent":
      return "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
    case "Leave":
      return "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

const ITEMS_PER_PAGE = 15

export function AttendanceReport() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("All Status")
  const [selectedSite, setSelectedSite] = useState("All Sites")
  const [currentPage, setCurrentPage] = useState(1)

  // Filter data based on all criteria
  const filteredData = useMemo(() => {
    return attendanceData.filter((item) => {
      // Date range filter
      if (dateRange?.from && dateRange?.to) {
        const itemDate = parseISO(item.date)
        if (!isWithinInterval(itemDate, { start: dateRange.from, end: dateRange.to })) {
          return false
        }
      }

      // Search filter (name or ID)
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !item.employeeName.toLowerCase().includes(query) &&
          !item.employeeId.toLowerCase().includes(query)
        ) {
          return false
        }
      }

      // Status filter
      if (selectedStatus !== "All Status" && item.status !== selectedStatus) {
        return false
      }

      // Site filter
      if (selectedSite !== "All Sites" && item.site !== selectedSite) {
        return false
      }

      return true
    })
  }, [dateRange, searchQuery, selectedStatus, selectedSite])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  // Export to CSV
  const handleExport = () => {
    const headers = ["Date", "Employee ID", "Employee Name", "Site", "Shift", "Clock In", "Clock Out", "Total Hours", "Status"]
    const csvContent = [
      headers.join(","),
      ...filteredData.map((row) =>
        [
          row.date,
          row.employeeId,
          `"${row.employeeName}"`,
          `"${row.site}"`,
          `"${row.shift}"`,
          row.clockIn,
          row.clockOut,
          row.totalHours,
          row.status,
        ].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `attendance-report-${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monthly Attendance Report</h1>
          <p className="text-muted-foreground mt-1">
            View and export detailed attendance records
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
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range)
                  handleFilterChange()
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Export Button */}
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export to CSV
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
                placeholder="Search by Name or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  handleFilterChange()
                }}
                className="pl-9 bg-secondary/50 border-0"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                setSelectedStatus(value)
                handleFilterChange()
              }}
            >
              <SelectTrigger className="bg-secondary/50 border-0">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Site Filter */}
            <Select
              value={selectedSite}
              onValueChange={(value) => {
                setSelectedSite(value)
                handleFilterChange()
              }}
            >
              <SelectTrigger className="bg-secondary/50 border-0">
                <SelectValue placeholder="Filter by site" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Results count */}
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filteredData.length}</span>
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
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">Date</TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">Employee Name</TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">Site</TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">Shift</TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">Clock In</TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">Clock Out</TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">Total Hours</TableHead>
                  <TableHead className="font-semibold text-foreground whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((record) => (
                    <TableRow
                      key={record.id}
                      className="hover:bg-secondary/20 transition-colors cursor-pointer"
                    >
                      <TableCell className="font-medium text-foreground whitespace-nowrap">
                        {format(parseISO(record.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{record.employeeName}</span>
                          <span className="text-xs text-muted-foreground">{record.employeeId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {record.site}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {record.shift}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {record.clockIn}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {record.clockOut}
                      </TableCell>
                      <TableCell className="font-medium text-foreground whitespace-nowrap">
                        {record.totalHours}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn("font-medium", getStatusStyles(record.status))}>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-muted-foreground">No records found matching your filters.</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSearchQuery("")
                            setSelectedStatus("All Status")
                            setSelectedSite("All Sites")
                            setDateRange({
                              from: subDays(new Date(), 7),
                              to: new Date(),
                            })
                          }}
                        >
                          Clear all filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-foreground">
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}
                </span>{" "}
                of <span className="font-medium text-foreground">{filteredData.length}</span> results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "ghost"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
