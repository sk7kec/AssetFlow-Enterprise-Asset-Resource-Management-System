import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesService } from '../../services/categories.service';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AssetCategory } from '../../types';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2, FolderOpen, Calendar, HelpCircle, FileCheck2, ShieldCheck, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { FormField, Input } from '../../components/common/FormField';
import toast from 'react-hot-toast';
import { parseApiError } from '../../utils';

const categorySchema = zod.object({
  name: zod.string().min(2, 'Name must be at least 2 characters'),
  code: zod.string().min(2, 'Code must be at least 2 characters').toUpperCase(),
  description: zod.string().optional(),
  depreciation_years: zod.number().min(1, 'Must be at least 1 year').max(50, 'Max 50 years'),
  requires_serial_number: zod.boolean(),
  warranty_months: zod.number().min(0),
  is_bookable: zod.boolean(),
});

type CategoryFormValues = zod.infer<typeof categorySchema>;

export const AssetCategories: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      depreciation_years: 5,
      requires_serial_number: true,
      warranty_months: 12,
      is_bookable: false,
    },
  });

  // Query
  const { data, isLoading } = useQuery({
    queryKey: ['categories', page, pageSize, search],
    queryFn: () =>
      categoriesService.list({
        page: page + 1,
        page_size: pageSize,
        search: search.trim() || undefined,
      }),
  });

  // Mutate create
  const createMutation = useMutation({
    mutationFn: (data: CategoryFormValues) => categoriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
      setCreateOpen(false);
      reset();
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });

  // Mutate delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category removed successfully');
      setDeleteId(null);
    },
    onError: (err) => {
      toast.error(parseApiError(err));
      setDeleteId(null);
    },
  });

  const onSubmit = (values: CategoryFormValues) => {
    createMutation.mutate(values);
  };

  const columns: ColumnDef<AssetCategory>[] = [
    {
      accessorKey: 'name',
      header: 'Category Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
            <FolderOpen className="w-4 h-4" />
          </div>
          <span className="font-semibold text-foreground">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'code',
      header: 'Catalog Code',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.code}</span>,
    },
    {
      accessorKey: 'depreciation_years',
      header: 'Depreciation Life',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.depreciation_years} Years (Linear)</span>
      ),
    },
    {
      accessorKey: 'warranty_months',
      header: 'Warranty Span',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.warranty_months || 0} Months</span>
      ),
    },
    {
      accessorKey: 'is_bookable',
      header: 'Bookable Pool',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
            row.original.is_bookable
              ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
          }`}
        >
          {row.original.is_bookable ? 'Reservable' : 'Fixed Asset'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Action controls',
      cell: ({ row }) => (
        <button
          onClick={() => setDeleteId(row.original.id)}
          className="p-1.5 rounded-lg border border-border text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
          title="Delete Category"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Asset Categories"
        description="Add and configure inventory types, default warranty limits, and asset depreciation values."
      >
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-indigo-600 text-xs font-semibold text-white shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </PageHeader>

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
            placeholder="Search categories by name or code..."
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

      {/* Create Modal Dialog Box */}
      {createOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm cursor-pointer" onClick={() => setCreateOpen(false)} />
          
          <div className="relative max-w-md w-full bg-card border border-border rounded-2xl p-6 shadow-2xl z-50 flex flex-col h-fit glass-panel">
            <h2 className="text-sm font-bold text-foreground font-display pb-4 border-b border-border mb-4">
              Add Asset Category
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Category Name" error={errors.name} required>
                  <Input placeholder="e.g. Laptops" {...register('name')} />
                </FormField>
                <FormField label="Catalog Code" error={errors.code} required>
                  <Input placeholder="e.g. LAP" {...register('code')} />
                </FormField>
              </div>

              <FormField label="Description (Optional)" error={errors.description}>
                <textarea
                  placeholder="Category scope details..."
                  className="w-full min-h-[60px] p-3 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 text-left resize-y"
                  {...register('description')}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Depreciation Span (Years)" error={errors.depreciation_years} required>
                  <Input type="number" {...register('depreciation_years', { valueAsNumber: true })} />
                </FormField>
                <FormField label="Warranty (Months)" error={errors.warranty_months}>
                  <Input type="number" {...register('warranty_months', { valueAsNumber: true })} />
                </FormField>
              </div>

              <div className="flex gap-6 py-2 border-y border-border/40 text-xs">
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" className="rounded bg-accent" {...register('requires_serial_number')} />
                  <span>Requires Serial</span>
                </label>
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
                  <input type="checkbox" className="rounded bg-accent" {...register('is_bookable')} />
                  <span>Pool Reservable</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40 mt-4">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-accent cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-indigo-600 text-white shadow-md cursor-pointer flex items-center gap-1"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Register Type</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dial */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Remove Asset Category"
        description="Are you sure you want to remove this category? Deleting it will error if assets are currently registered under this category."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
