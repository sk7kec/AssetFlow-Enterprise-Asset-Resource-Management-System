import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { organizationService } from '../../services/organization.service';
import { PageHeader } from '../../components/common/PageHeader';
import { EmployeeDrawer } from '../../components/organization/EmployeeDrawer';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import { Employee } from '../../types';
import { Search, Briefcase, Mail, Building, LayoutGrid } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const Employees: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Details drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // Fetch Employees List
  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search, deptFilter],
    queryFn: () =>
      organizationService.listEmployees({
        page,
        page_size: 12,
        search: search.trim() || undefined,
        department_id: deptFilter || undefined,
      }),
  });

  // Fetch Departments for Filters
  const { data: deptsData } = useQuery({
    queryKey: ['departments_list'],
    queryFn: () => organizationService.listDepartments({ page: 1, page_size: 100 }),
  });

  const handleOpenDrawer = (emp: Employee) => {
    setSelectedEmp(emp);
    setDrawerOpen(true);
  };

  const departments = deptsData?.items || [];
  const employees = data?.items || [];

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Employee Directory"
        description="Browse staff roles, active profiles, division allocations, and credentials status."
      />

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card/40 p-4 border border-border rounded-2xl glass-card">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Department Filter */}
        <select
          value={deptFilter}
          onChange={(e) => {
            setDeptFilter(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3.5 border border-border bg-card rounded-xl text-xs text-foreground focus:outline-none cursor-pointer min-w-[160px]"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <CardSkeleton count={6} />
      ) : employees.length === 0 ? (
        <div className="p-12 border border-dashed border-border bg-card/10 rounded-2xl text-center max-w-md mx-auto">
          <LayoutGrid className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display font-semibold text-sm">No employees match filters</h3>
          <p className="text-xs text-muted-foreground mt-1">Try resetting the department filter or typing another search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {employees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => handleOpenDrawer(emp)}
              className="p-5 border border-border bg-card/60 hover:bg-card hover:shadow-lg rounded-2xl transition-all cursor-pointer flex flex-col justify-between h-[180px] glass-card"
            >
              <div className="flex gap-3">
                {/* Avatar Initial */}
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-xs uppercase shrink-0">
                  {emp.full_name[0]}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-xs text-foreground truncate">{emp.full_name}</h3>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{emp.employee_id}</p>
                </div>
              </div>

              {/* Specs */}
              <div className="space-y-1.5 py-3 border-y border-border/40 my-3 text-[11px] text-muted-foreground">
                <p className="flex items-center gap-1.5 truncate">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="capitalize">{emp.role}</span>
                </p>
                <p className="flex items-center gap-1.5 truncate">
                  <Building className="w-3.5 h-3.5" />
                  <span>{emp.department_name || '-'}</span>
                </p>
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground/60">Joined: {new Date(emp.joined_date).toLocaleDateString()}</span>
                <StatusBadge status={emp.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer Profile Details */}
      <EmployeeDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} employee={selectedEmp} />
    </div>
  );
};
