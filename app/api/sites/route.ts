import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const sites = await prisma.site.findMany({
      orderBy: { name: "asc" },
    })
    return NextResponse.json(
      sites.map((s) => ({
        id: s.id,
        name: s.name,
        companyId: s.companyId,
      })),
      { status: 200 },
    )
  } catch (error) {
    console.error("Sites GET error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    )
  }
}

