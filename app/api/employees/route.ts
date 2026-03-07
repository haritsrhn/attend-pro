import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      include: {
        company: true,
        site: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(users, { status: 200 })
  } catch (error) {
    console.error("Employees GET error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name,
      employeeId,
      password,
      role,
      companyId,
      siteId,
    }: {
      name?: string
      employeeId?: string
      password?: string
      role?: Role | string
      companyId?: string
      siteId?: string
    } = body

    if (
      !name ||
      !employeeId ||
      !password ||
      !role ||
      !companyId ||
      !siteId
    ) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 },
      )
    }

    if (!Object.values(Role).includes(role as Role)) {
      return NextResponse.json(
        { message: "Invalid role value" },
        { status: 400 },
      )
    }

    const existing = await prisma.user.findUnique({
      where: { employeeId },
    })

    if (existing) {
      return NextResponse.json(
        { message: "Employee ID already exists" },
        { status: 409 },
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        employeeId,
        passwordHash,
        role: role as Role,
        companyId,
        siteId,
        isActive: true,
      },
      include: {
        company: true,
        site: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Employees POST error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    )
  }
}

