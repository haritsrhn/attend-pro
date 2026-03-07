import { StaffDirectory } from "@/components/dashboard/staff-directory"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"

export default function EmployeesPage() {
  return (
    <DashboardLayout>
      <StaffDirectory />
    </DashboardLayout>
  )
}