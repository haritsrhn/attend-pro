import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
    })
    return NextResponse.json(
      companies.map((c) => ({ id: c.id, name: c.name })),
      { status: 200 },
    )
  } catch (error) {
    console.error("Companies GET error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    )
  }
}

