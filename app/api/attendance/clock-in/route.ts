import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

const JAKARTA_TIMEZONE = 'Asia/Jakarta';
const JAKARTA_OFFSET_MINUTES = 7 * 60; // UTC+7, no DST

type ClockInRequestBody = {
  userId?: string;
  location?: string;
};

function getJakartaDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: JAKARTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      partMap[part.type] = part.value;
    }
  }

  const year = Number(partMap.year);
  const month = Number(partMap.month);
  const day = Number(partMap.day);
  const hour = Number(partMap.hour);
  const minute = Number(partMap.minute);
  const second = Number(partMap.second);

  return { year, month, day, hour, minute, second };
}

function getJakartaDayBoundsUtc(date: Date) {
  const { year, month, day } = getJakartaDateParts(date);

  const startOfDayJakartaUtcMs =
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) -
    JAKARTA_OFFSET_MINUTES * 60 * 1000;

  const endOfDayJakartaUtcMs =
    Date.UTC(year, month - 1, day, 23, 59, 59, 999) -
    JAKARTA_OFFSET_MINUTES * 60 * 1000;

  return {
    start: new Date(startOfDayJakartaUtcMs),
    end: new Date(endOfDayJakartaUtcMs),
  };
}

function getAttendanceStatusForJakartaTime(date: Date): AttendanceStatus {
  const { hour, minute, second } = getJakartaDateParts(date);

  // LATE if after 08:00:00 WIB
  const isAfterEight =
    hour > 8 || (hour === 8 && (minute > 0 || second > 0));

  return isAfterEight ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
}

export async function POST(req: NextRequest) {
  try {
    const body: ClockInRequestBody = await req.json();
    const { userId, location } = body;

    if (!userId || !location) {
      return NextResponse.json(
        { message: 'userId and location are required' },
        { status: 400 },
      );
    }

    // Current moment (UTC instant), evaluation done in Asia/Jakarta
    const now = new Date();
    const { start, end } = getJakartaDayBoundsUtc(now);

    // Check if user already clocked in today (WIB day)
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        clockInTime: {
          gte: start,
          lte: end,
        },
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { message: 'Already clocked in today' },
        { status: 400 },
      );
    }

    const status = getAttendanceStatusForJakartaTime(now);

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        clockInTime: now,
        clockInLocation: location,
        status,
      },
    });

    return NextResponse.json(attendance, { status: 200 });
  } catch (error) {
    console.error('Clock-in error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}

