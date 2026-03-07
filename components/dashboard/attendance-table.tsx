"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export type AttendanceRow = {
  id: string
  name: string
  employeeId: string
  timeIn: string
  timeOut: string | null
  status: "PRESENT" | "LATE"
  location: string
}

const getStatusStyles = (status: AttendanceRow["status"]) => {
  switch (status) {
    case "PRESENT":
      return "bg-success/10 text-success hover:bg-success/20"
    case "LATE":
      return "bg-warning/10 text-warning hover:bg-warning/20"
    default:
      return "bg-secondary text-secondary-foreground"
  }
}

const formatStatusLabel = (status: AttendanceRow["status"]) => {
  switch (status) {
    case "PRESENT":
      return "Present"
    case "LATE":
      return "Late"
    default:
      return status
  }
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (
    parts[0]!.charAt(0).toUpperCase() + parts[parts.length - 1]!.charAt(0).toUpperCase()
  )
}

interface AttendanceTableProps {
  rows: AttendanceRow[]
}

export function AttendanceTable({ rows }: AttendanceTableProps) {
  const [selectedLocation, setSelectedLocation] = useState("All Sites")

  const locations = useMemo(() => {
    const siteNames = Array.from(new Set(rows.map((row) => row.location))).sort()
    return ["All Sites", ...siteNames]
  }, [rows])

  const filteredData =
    selectedLocation === "All Sites"
      ? rows
      : rows.filter((item) => item.location === selectedLocation)

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">Live Attendance</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter by Site:</span>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-48 bg-secondary/50 border-0">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                <TableHead className="font-semibold text-foreground">
                  Employee Name
                </TableHead>
                <TableHead className="font-semibold text-foreground">Time In</TableHead>
                <TableHead className="font-semibold text-foreground">Time Out</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-secondary/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {employee.employeeId}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.timeIn ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.timeOut ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={getStatusStyles(employee.status)}
                    >
                      {formatStatusLabel(employee.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {employee.location}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No attendance records found for this location.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

