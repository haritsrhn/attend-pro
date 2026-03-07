"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  UserX,
  Mail,
  Phone,
  MapPin,
  Building2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserMinus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const ENTITIES = [
  "All Entities",
  "Yayasan Alexandria Mahesa Raya",
  "CV Pesona Tiga Saudara",
  "PT Amanah Solusi Sejahtera",
];

const SITES = [
  "All Sites",
  "Kel. Limau Mungkur",
  "Binjai Barat",
  "Batang Kuis",
  "Garuda",
  "Beringin",
  "Sei Sikambing B",
  "Sunggal",
  "Hamparan Perak",
];

const ENTITY_COLORS: Record<string, string> = {
  "Yayasan Alexandria Mahesa Raya":
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "CV Pesona Tiga Saudara":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "PT Amanah Solusi Sejahtera":
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const ENTITY_ABBR: Record<string, string> = {
  "Yayasan Alexandria Mahesa Raya": "YAMR",
  "CV Pesona Tiga Saudara": "CPTS",
  "PT Amanah Solusi Sejahtera": "PASS",
};

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-cyan-500",
];

type Employee = {
  id: string;
  name: string;
  jobTitle: string;
  entity: string;
  site: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  avatarColor: string;
  rawEmployeeId: string;
  rawRole: "ADMIN" | "STAFF";
  rawCompanyId: string;
  rawSiteId: string;
};

const EMPLOYEES: Employee[] = [];

const ENTITY_BY_NAME: Record<string, string> = {
  "Yayasan Alexandria Mahesa Raya": "Yayasan Alexandria Mahesa Raya",
  "CV Pesona Tiga Saudara": "CV Pesona Tiga Saudara",
  "PT Amanah Solusi Sejahtera": "PT Amanah Solusi Sejahtera",
};

const ITEMS_PER_PAGE = 12;

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function EmployeeCard({
  employee,
  onEdit,
  onToggleStatus,
}: {
  employee: Employee;
  onEdit: (emp: Employee) => void;
  onToggleStatus: (emp: Employee) => void;
}) {
  return (
    <Card
      className={cn(
        "group relative border border-border/60 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30",
        employee.status === "inactive" && "opacity-60",
      )}
    >
      <CardContent className="p-5">
        {/* Status dot */}
        <span
          className={cn(
            "absolute top-4 right-4 h-2.5 w-2.5 rounded-full ring-2 ring-background",
            employee.status === "active" ? "bg-emerald-500" : "bg-slate-400",
          )}
        />

        {/* Avatar + Name */}
        <div className="flex flex-col items-center text-center mb-4">
          <Avatar
            className={cn(
              "h-16 w-16 text-white text-lg font-semibold mb-3",
              employee.avatarColor,
            )}
          >
            <AvatarFallback
              className={cn(
                "text-white font-semibold text-base",
                employee.avatarColor,
              )}
            >
              {getInitials(employee.name)}
            </AvatarFallback>
          </Avatar>
          <p className="font-semibold text-foreground text-sm leading-tight">
            {employee.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {employee.jobTitle}
          </p>
          <p className="text-xs text-muted-foreground/70 font-mono mt-0.5">
            {employee.rawEmployeeId}
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-4">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium px-2 py-0.5",
              ENTITY_COLORS[employee.entity],
            )}
          >
            {ENTITY_ABBR[employee.entity]}
          </Badge>
          <Badge
            variant="secondary"
            className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5"
          >
            <MapPin className="h-2.5 w-2.5 mr-1 inline-block" />
            {employee.site}
          </Badge>
        </div>

        {/* Contact info */}
        <div className="space-y-1.5 mb-4 border-t border-border/60 pt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0 text-muted-foreground/60" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0 text-muted-foreground/60" />
            <span>{employee.phone}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 border-t border-border/60 pt-3">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs gap-1.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                  onClick={() => onEdit(employee)}
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit Profile</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 h-8 text-xs gap-1.5 transition-colors",
                    employee.status === "active"
                      ? "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                      : "hover:bg-emerald-500 hover:text-white hover:border-emerald-500",
                  )}
                  onClick={() => onToggleStatus(employee)}
                >
                  {employee.status === "active" ? (
                    <>
                      <UserX className="h-3 w-3" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3 w-3" />
                      Activate
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {employee.status === "active"
                  ? "Deactivate Account"
                  : "Activate Account"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}

export function StaffDirectory() {
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [search, setSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("All Entities");
  const [selectedSite, setSelectedSite] = useState("All Sites");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState<Employee | null>(null);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [sites, setSites] = useState<
    { id: string; name: string; companyId: string }[]
  >([]);
  const [formState, setFormState] = useState<{
    name: string;
    employeeId: string;
    password: string;
    role: "ADMIN" | "STAFF";
    companyId: string;
    siteId: string;
  }>({
    name: "",
    employeeId: "",
    password: "",
    role: "STAFF",
    companyId: "",
    siteId: "",
  });

  const loadReferenceData = async () => {
    const [companiesRes, sitesRes] = await Promise.all([
      fetch("/api/companies").catch(() => null),
      fetch("/api/sites").catch(() => null),
    ]);

    if (companiesRes?.ok) {
      const c = (await companiesRes.json()) as { id: string; name: string }[];
      setCompanies(c);
    }
    if (sitesRes?.ok) {
      const s = (await sitesRes.json()) as {
        id: string;
        name: string;
        companyId: string;
      }[];
      setSites(s);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error();
      const json = await res.json();
      const mapped: Employee[] = (json as any[]).map((u, idx) => ({
        id: u.id,
        name: u.name,
        jobTitle: u.role === "ADMIN" ? "Administrator" : "Staff",
        entity: u.company?.name ?? "Unknown Entity",
        site: u.site?.name ?? "Unknown Site",
        email: `${u.employeeId}@example.com`,
        phone: "-",
        status: u.isActive ? "active" : "inactive",
        avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
        rawEmployeeId: u.employeeId,
        rawRole: u.role,
        rawCompanyId: u.companyId,
        rawSiteId: u.siteId,
      }));
      setEmployees(mapped);
    } catch {
      toast({
        title: "Failed to load employees",
        description: "Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadReferenceData();
    loadEmployees();
  }, []);

  const filtered = useMemo(() => {
    return employees.filter((emp) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !emp.name.toLowerCase().includes(q) &&
          !emp.id.toLowerCase().includes(q)
        )
          return false;
      }
      if (selectedEntity !== "All Entities" && emp.entity !== selectedEntity)
        return false;
      if (selectedSite !== "All Sites" && emp.site !== selectedSite)
        return false;
      return true;
    });
  }, [employees, search, selectedEntity, selectedSite]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const resetPage = () => setCurrentPage(1);

  const handleEditClick = (emp: Employee) => {
    // 1. Isi form dengan data karyawan yang dipilih
    setFormState({
      name: emp.name,
      employeeId: emp.rawEmployeeId,
      password: "", // Dikosongkan agar password lama tidak tertimpa jika tidak diedit
      role: emp.rawRole,
      companyId: emp.rawCompanyId || "",
      siteId: emp.rawSiteId || "",
    });
    // 2. Buka jendela dialog
    setEditTarget(emp);
  };

  const handleToggleStatus = (emp: Employee) => {
    setConfirmTarget(emp);
  };

  const confirmToggle = () => {
    if (!confirmTarget) return;
    const target = confirmTarget;
    const newStatus = target.status === "active" ? false : true;
    setIsSubmitting(true);
    fetch(`/api/employees/${target.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: newStatus }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        toast({
          title: newStatus ? "Employee reactivated" : "Employee deactivated",
        });
        return loadEmployees();
      })
      .catch(() => {
        toast({
          title: "Update failed",
          description: "Could not update employee status.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
        setConfirmTarget(null);
      });
  };

  const activeCount = employees.filter((e) => e.status === "active").length;
  const inactiveCount = employees.filter((e) => e.status === "inactive").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Staff Directory
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage employee profiles across all entities and sites
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {activeCount} Active
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              {inactiveCount} Inactive
            </span>
            <span className="text-xs text-muted-foreground">
              {employees.length} Total
            </span>
          </div>
        </div>
        <Button
          className="gap-2 shrink-0"
          onClick={() => {
            setFormState({
              name: "",
              employeeId: "",
              password: "",
              role: "STAFF",
              companyId: "",
              siteId: "",
            });
            setEditTarget({} as Employee);
          }}
        >
          <Plus className="h-4 w-4" />
          Add New Employee
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by Employee Name or ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                className="pl-9 bg-secondary/50 border-0"
              />
            </div>

            {/* Entity filter */}
            <Select
              value={selectedEntity}
              onValueChange={(v) => {
                setSelectedEntity(v);
                resetPage();
              }}
            >
              <SelectTrigger className="bg-secondary/50 border-0">
                <Building2 className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Company Entity" />
              </SelectTrigger>
              <SelectContent>
                {ENTITIES.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Site filter */}
            <Select
              value={selectedSite}
              onValueChange={(v) => {
                setSelectedSite(v);
                resetPage();
              }}
            >
              <SelectTrigger className="bg-secondary/50 border-0">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Assigned Site" />
              </SelectTrigger>
              <SelectContent>
                {SITES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results summary */}
          {(search ||
            selectedEntity !== "All Entities" ||
            selectedSite !== "All Sites") && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {filtered.length}
                </span>{" "}
                employees found
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setSearch("");
                  setSelectedEntity("All Entities");
                  setSelectedSite("All Sites");
                  resetPage();
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Grid */}
      {paginated.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onEdit={handleEditClick}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-4">
              <UserMinus className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No employees found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filter criteria.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setSelectedEntity("All Entities");
                setSelectedSite("All Sites");
                resetPage();
              }}
            >
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {filtered.length}
            </span>{" "}
            staff
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2)
                  pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Deactivate / Activate Confirmation Dialog */}
      <Dialog
        open={!!confirmTarget}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.status === "active"
                ? "Deactivate Account"
                : "Activate Account"}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.status === "active"
                ? `Are you sure you want to deactivate ${confirmTarget?.name}? They will no longer be able to clock in or out.`
                : `Are you sure you want to reactivate ${confirmTarget?.name}? They will regain access to the attendance system.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={
                confirmTarget?.status === "active" ? "destructive" : "default"
              }
              className={
                confirmTarget?.status === "inactive"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : ""
              }
              onClick={confirmToggle}
              disabled={isSubmitting}
            >
              {confirmTarget?.status === "active" ? "Deactivate" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Employee Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editTarget && "id" in editTarget && (editTarget as Employee).id
                ? "Edit Employee Profile"
                : "Add New Employee"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4 mt-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              try {
                const payload = {
                  name: formState.name,
                  employeeId: formState.employeeId,
                  password: formState.password || undefined,
                  role: formState.role,
                  companyId: formState.companyId,
                  siteId: formState.siteId,
                };

                const isEdit = !!(editTarget && editTarget.id);

                const res = await fetch(
                  isEdit ? `/api/employees/${editTarget.id}` : "/api/employees",
                  {
                    method: isEdit ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(
                      isEdit
                        ? {
                            name: payload.name,
                            employeeId: payload.employeeId,
                            role: payload.role,
                            companyId: payload.companyId,
                            siteId: payload.siteId,
                          }
                        : payload,
                    ),
                  },
                );

                const data = await res.json().catch(() => null);

                if (!res.ok) {
                  toast({
                    title: "Save failed",
                    description:
                      (data as any)?.message ??
                      "Unable to save employee. Please try again.",
                    variant: "destructive",
                  });
                  return;
                }

                toast({
                  title: isEdit
                    ? "Employee updated successfully"
                    : "Employee created successfully",
                });
                await loadEmployees();
                setEditTarget(null);
              } catch {
                toast({
                  title: "Save failed",
                  description: "Unexpected error. Please try again.",
                  variant: "destructive",
                });
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="emp-name">Name</Label>
                <Input
                  id="emp-name"
                  value={formState.name}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emp-id">Employee ID</Label>
                <Input
                  id="emp-id"
                  value={formState.employeeId}
                  onChange={(e) =>
                    setFormState((s) => ({
                      ...s,
                      employeeId: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              {!editTarget?.id && (
                <div className="grid gap-2">
                  <Label htmlFor="emp-password">Password</Label>
                  <Input
                    id="emp-password"
                    type="password"
                    value={formState.password}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        password: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={formState.role}
                  onValueChange={(value: "ADMIN" | "STAFF") =>
                    setFormState((s) => ({ ...s, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Company</Label>
                <Select
                  value={formState.companyId}
                  onValueChange={(value) =>
                    setFormState((s) => ({
                      ...s,
                      companyId: value,
                      siteId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Assigned Site</Label>
                <Select
                  value={formState.siteId}
                  onValueChange={(value) =>
                    setFormState((s) => ({
                      ...s,
                      siteId: value,
                    }))
                  }
                  disabled={!formState.companyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites
                      .filter((s) => s.companyId === formState.companyId)
                      .map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Needed for the placeholder dialog icon
function Users({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
