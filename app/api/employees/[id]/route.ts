import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

type PatchBody = {
  name?: string
  employeeId?: string
  role?: Role | string
  companyId?: string
  siteId?: string
  isActive?: boolean
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const userId = params.id
    const body: PatchBody = await req.json()

    const updateData: PatchBody = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.employeeId !== undefined) updateData.employeeId = body.employeeId
    if (body.companyId !== undefined) updateData.companyId = body.companyId
    if (body.siteId !== undefined) updateData.siteId = body.siteId
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    if (body.role !== undefined) {
      if (!Object.values(Role).includes(body.role as Role)) {
        return NextResponse.json({ message: "Invalid role value" }, { status: 400 })
      }
      updateData.role = body.role as Role
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No valid fields to update" }, { status: 400 })
    }

    if (updateData.employeeId) {
      const existing = await prisma.user.findUnique({
        where: { employeeId: updateData.employeeId },
      })
      if (existing && existing.id !== userId) {
        return NextResponse.json({ message: "Employee ID already exists" }, { status: 409 })
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        company: true,
        site: true,
      },
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (error) {
    console.error("Employees PATCH error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}