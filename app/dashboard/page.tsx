import { Users, UserCheck, Clock, Calendar } from "lucide-react"
import { AttendanceStatus, LeaveRequestStatus, Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { AttendanceTable, type AttendanceRow } from "@/components/dashboard/attendance-table"
import { SummaryCards, type SummaryCardData } from "@/components/dashboard/summary-cards"
import { AttendanceActionCard } from "@/components/dashboard/attendance-action-card"

const JAKARTA_TIMEZONE = "Asia/Jakarta"
const JAKARTA_OFFSET_MINUTES = 7 * 60 // UTC+7, no DST

export const dynamic = "force-dynamic"

function getJakartaDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: JAKARTA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const partMap: Record<string, string> = {}

  for (const part of parts) {
    if (part.type !== "literal") {
      partMap[part.type] = part.value
    }
  }

  const year = Number(partMap.year)
  const month = Number(partMap.month)
  const day = Number(partMap.day)

  return { year, month, day }
}

function getJakartaDayBoundsUtc(date: Date) {
  const { year, month, day } = getJakartaDateParts(date)

  const startOfDayJakartaUtcMs =
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) -
    JAKARTA_OFFSET_MINUTES * 60 * 1000

  const endOfDayJakartaUtcMs =
    Date.UTC(year, month - 1, day, 23, 59, 59, 999) -
    JAKARTA_OFFSET_MINUTES * 60 * 1000

  return {
    start: new Date(startOfDayJakartaUtcMs),
    end: new Date(endOfDayJakartaUtcMs),
  }
}

function formatTimeToJakartaHHmm(date: Date | null) {
  if (!date) return null

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: JAKARTA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

export default async function DashboardOverviewPage() {
  const now = new Date()
  const { start, end } = getJakartaDayBoundsUtc(now)

  const [totalEmployees, presentToday, lateArrivals, onLeaveToday, attendance] =
    await Promise.all([
      prisma.user.count({
        where: {
          role: Role.STAFF,
        },
      }),
      prisma.attendance.count({
        where: {
          status: AttendanceStatus.PRESENT,
          clockInTime: {
            gte: start,
            lte: end,
          },
        },
      }),
      prisma.attendance.count({
        where: {
          status: AttendanceStatus.LATE,
          clockInTime: {
            gte: start,
            lte: end,
          },
        },
      }),
      prisma.leaveRequest.count({
        where: {
          status: LeaveRequestStatus.APPROVED,
          startDate: {
            lte: end,
          },
          endDate: {
            gte: start,
          },
        },
      }),
      prisma.attendance.findMany({
        where: {
          clockInTime: {
            gte: start,
            lte: end,
          },
        },
        include: {
          user: {
            include: {
              site: true,
            },
          },
        },
        orderBy: {
          clockInTime: "asc",
        },
      }),
    ])

  const summaryCards: SummaryCardData[] = [
    {
      title: "Total Employees",
      value: totalEmployees.toString(),
      change: undefined,
      icon: Users,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Present Today",
      value: presentToday.toString(),
      change: undefined,
      icon: UserCheck,
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    {
      title: "Late Arrivals",
      value: lateArrivals.toString(),
      change: undefined,
      icon: Clock,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
    },
    {
      title: "On Leave",
      value: onLeaveToday.toString(),
      change: undefined,
      icon: Calendar,
      iconBg: "bg-chart-4/10",
      iconColor: "text-chart-4",
    },
  ]

  const attendanceRows: AttendanceRow[] = attendance.map((record) => ({
    id: record.id,
    name: record.user.name,
    employeeId: record.user.employeeId,
    timeIn: formatTimeToJakartaHHmm(record.clockInTime) ?? "-",
    timeOut: formatTimeToJakartaHHmm(record.clockOutTime),
    status: record.status,
    location: record.user.site?.name ?? "Unknown",
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">
          Monitor attendance and manage your workforce efficiently
        </p>
      </div>

      <SummaryCards items={summaryCards} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AttendanceActionCard />
        </div>
        <div className="lg:col-span-2">
          <AttendanceTable rows={attendanceRows} />
        </div>
      </div>
    </div>
  )
}

