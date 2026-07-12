import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '../../services/organization.service';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { User } from '../../types';
import { ColumnDef } from '@tanstack/react-table';
import { Shield, UserX, UserCheck, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export const Roles: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  // Fetch Users
  const { data, isLoading } = useQuery({
    queryKey: ['users_list', page, pageSize, search],
    queryFn: () =>
      organizationService.listUsers({
        page: page + 1,
        page_size: pageSize,
        search: search.trim() || undefined,
      }),
  });

  // Mutate Role
  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      organizationService.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users_list'] });
      toast.success('User authorization role updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to update role');
    },
  });

  // Mutate Toggle Status
  const toggleMutation = useMutation({
    mutationFn: (id: string) => organizationService.toggleUserActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users_list'] });
      toast.success('User login status changed');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to toggle status');
    },
  });

  const handleRoleChange = (id: string, newRole: string) => {
    roleMutation.mutate({ id, role: newRole });
  };

  const handleToggleStatus = (id: string) => {
    toggleMutation.mutate(id);
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'full_name',
      header: 'Full Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-xs uppercase">
            {row.original.full_name[0]}
          </div>
          <span className="font-semibold text-foreground">{row.original.full_name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email Address',
      cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: 'role',
      header: 'System Permissions Role',
      cell: ({ row }) => (
        <select
          value={row.original.role}
          onChange={(e) => handleRoleChange(row.original.id, e.target.value)}
          className="h-8 px-2.5 border border-border bg-card rounded-lg text-xs text-foreground focus:outline-none cursor-pointer focus:border-primary"
        >
          <option value="admin">System Admin</option>
          <option value="asset_manager">Asset Manager</option>
          <option value="department_head">Department Head</option>
          <option value="employee">Standard Employee</option>
        </select>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Auth Status',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
            row.original.is_active
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}
        >
          {row.original.is_active ? 'Active Logins' : 'Suspended'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Action controls',
      cell: ({ row }) => (
        <button
          onClick={() => handleToggleStatus(row.original.id)}
          className={`p-1.5 rounded-lg border border-border transition-all flex items-center gap-1 cursor-pointer text-xs font-semibold ${
            row.original.is_active
              ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-500/10'
              : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10'
          }`}
        >
          {row.original.is_active ? (
            <>
              <UserX className="w-3.5 h-3.5" />
              <span>Suspend</span>
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5" />
              <span>Activate</span>
            </>
          )}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Access Control & User Roles"
        description="Review system user accounts, toggle employee login permissions, and alter admin capabilities."
      />

      {/* Filter and Search */}
      <div className="flex items-center gap-3 max-w-md">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search users by name or email domain..."
            className="w-full h-10 px-4 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        loading={isLoading}
        pageCount={data?.total_pages || 1}
        pageIndex={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};
