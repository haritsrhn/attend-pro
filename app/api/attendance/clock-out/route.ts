import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JAKARTA_TIMEZONE = 'Asia/Jakarta';
const JAKARTA_OFFSET_MINUTES = 7 * 60; // UTC+7, no DST

type ClockOutRequestBody = {
  userId?: string;
  clockOutLocation?: string;
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

  return { year, month, day };
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

async function handleClockOut(req: NextRequest) {
  try {
    const body: ClockOutRequestBody = await req.json();
    const { userId, clockOutLocation } = body;

    if (!userId || !clockOutLocation) {
      return NextResponse.json(
        { message: 'userId and clockOutLocation are required' },
        { status: 400 },
      );
    }

    const now = new Date();
    const { start, end } = getJakartaDayBoundsUtc(now);

    // Find today's attendance record for this user (WIB day)
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        clockInTime: {
          gte: start,
          lte: end,
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { message: 'No clock-in record found for today' },
        { status: 404 },
      );
    }

    if (attendance.clockOutTime) {
      return NextResponse.json(
        { message: 'Already clocked out today' },
        { status: 400 },
      );
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOutTime: now,
        clockOutLocation,
      },
    });

    return NextResponse.json(updatedAttendance, { status: 200 });
  } catch (error) {
    console.error('Clock-out error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return handleClockOut(req);
}

export async function PUT(req: NextRequest) {
  return handleClockOut(req);
}

