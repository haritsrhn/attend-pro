import { NextRequest, NextResponse } from "next/server"
import { AttendanceStatus, LeaveRequestStatus, Prisma, Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"

const JAKARTA_TIMEZONE = "Asia/Jakarta"
const JAKARTA_OFFSET_MINUTES = 7 * 60 // UTC+7, no DST

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const startDateParam = searchParams.get("startDate")
    const endDateParam = searchParams.get("endDate")
    const search = searchParams.get("search") ?? undefined
    const siteParam = searchParams.get("siteId") ?? undefined
    const companyParam = searchParams.get("companyId") ?? undefined

    const now = new Date()

    let rangeStart: Date
    let rangeEnd: Date

    if (startDateParam) {
      const parsed = new Date(startDateParam)
      rangeStart = getJakartaDayBoundsUtc(parsed).start
    } else {
      rangeStart = getJakartaDayBoundsUtc(now).start
    }

    if (endDateParam) {
      const parsed = new Date(endDateParam)
      rangeEnd = getJakartaDayBoundsUtc(parsed).end
    } else {
      rangeEnd = getJakartaDayBoundsUtc(now).end
    }

    if (rangeEnd < rangeStart) {
      ;[rangeStart, rangeEnd] = [rangeEnd, rangeStart]
    }

    const where: Prisma.AttendanceWhereInput = {
      clockInTime: {
        gte: rangeStart,
        lte: rangeEnd,
      },
      user: {
        role: Role.STAFF,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { employeeId: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(companyParam &&
          (isUuid(companyParam)
            ? { companyId: companyParam }
            : {
                company: {
                  name: { contains: companyParam, mode: "insensitive" },
                },
              })),
        ...(siteParam &&
          (isUuid(siteParam)
            ? { siteId: siteParam }
            : {
                site: {
                  name: { contains: siteParam, mode: "insensitive" },
                },
              })),
      },
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          include: {
            company: true,
            site: true,
          },
        },
      },
      orderBy: [
        { clockInTime: "asc" },
        { user: { name: "asc" } },
      ],
    })

    const result = records.map((record) => ({
      id: record.id,
      clockInTime: record.clockInTime,
      clockOutTime: record.clockOutTime,
      status: record.status as AttendanceStatus,
      employeeId: record.user.employeeId,
      employeeName: record.user.name,
      companyName: record.user.company?.name ?? "Unknown",
      siteName: record.user.site?.name ?? "Unknown",
    }))

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Attendance report error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    )
  }
}

