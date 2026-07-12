import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '../../services/organization.service';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { DepartmentModal } from '../../components/organization/DepartmentModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Department } from '../../types';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2, Search, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Departments: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // TanStack Query
  const { data, isLoading } = useQuery({
    queryKey: ['departments', page, pageSize, search],
    queryFn: () =>
      organizationService.listDepartments({
        page: page + 1,
        page_size: pageSize,
        search: search.trim() || undefined,
      }),
  });

  // Mutate Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => organizationService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted successfully');
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to delete department');
      setDeleteId(null);
    },
  });

  const handleEdit = (dept: Department) => {
    setSelectedDept(dept);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedDept(null);
    setModalOpen(true);
  };

  // Define Columns
  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: 'name',
      header: 'Department Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="font-semibold text-foreground">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'code',
      header: 'Department Code',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.code}</span>
      ),
    },
    {
      accessorKey: 'manager_name',
      header: 'Department Manager',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.manager_name || 'Not assigned'}</span>
      ),
    },
    {
      accessorKey: 'parent_department_name',
      header: 'Parent Division',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.parent_department_name || '-'}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 select-none">
          <button
            onClick={() => handleEdit(row.original)}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
            title="Edit department"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteId(row.original.id)}
            className="p-1.5 rounded-lg border border-border text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
            title="Delete department"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Departments"
        description="Configure organization divisions, manager user roles, and storage sectors."
      >
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-indigo-600 text-xs font-semibold text-white shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </PageHeader>

      {/* Filter and Search */}
      <div className="flex items-center gap-3 max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0); // reset page index
            }}
            placeholder="Search by name or code..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {/* TanStack Data Table */}
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

      {/* Modify/Register Modal */}
      <DepartmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        department={selectedDept}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['departments'] })}
      />

      {/* Delete Confirmation Dial */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Division Record"
        description="Are you sure you want to delete this department? This action cannot be undone, and will break references for employees in this division."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
