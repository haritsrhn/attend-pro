"use client"

import { SummaryCards } from "./summary-cards"
import { AttendanceActionCard } from "./attendance-action-card"
import { AttendanceTable } from "./attendance-table"

export function OverviewSection() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">
          Monitor attendance and manage your workforce efficiently
        </p>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attendance Action Card - Takes 1 column */}
        <div className="lg:col-span-1">
          <AttendanceActionCard />
        </div>

        {/* Live Attendance Table - Takes 2 columns */}
        <div className="lg:col-span-2">
          <AttendanceTable />
        </div>
      </div>
    </div>
  )
}
