import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getToken } from 'next-auth/jwt';

const prisma = new PrismaClient();
const JAKARTA_OFFSET_MINUTES = 7 * 60;

function getJakartaDayBoundsUtc(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = formatter.formatToParts(date);
  const p: Record<string, string> = {};
  parts.forEach(part => { if (part.type !== 'literal') p[part.type] = part.value; });
  
  const start = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), 0, 0, 0, 0) - JAKARTA_OFFSET_MINUTES * 60000);
  const end = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), 23, 59, 59, 999) - JAKARTA_OFFSET_MINUTES * 60000);
  return { start, end };
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ 
      req, 
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production'
    });

    if (!token || !token.id) return NextResponse.json({ isClockedIn: false }, { status: 401 });

    const now = new Date();
    const { start, end } = getJakartaDayBoundsUtc(now);

    const attendance = await prisma.attendance.findFirst({
      where: { userId: token.id as string, clockInTime: { gte: start, lte: end } }
    });

    if (attendance) {
      return NextResponse.json({
        isClockedIn: !attendance.clockOutTime, // Nyala jika belum Clock Out
        isFinished: !!attendance.clockOutTime,  // True jika sudah selesai absen hari ini
        clockInTime: attendance.clockInTime
      }, { status: 200 });
    }

    return NextResponse.json({ isClockedIn: false, isFinished: false }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ isClockedIn: false, isFinished: false }, { status: 500 });
  }
}