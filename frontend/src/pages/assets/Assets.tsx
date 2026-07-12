import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService } from '../../services/assets.service';
import { categoriesService } from '../../services/categories.service';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../constants';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { AssetCard } from '../../components/assets/AssetCard';
import { AssetFilters } from '../../components/assets/AssetFilters';
import { QRPreview } from '../../components/assets/QRPreview';
import { CardSkeleton } from '../../components/common/SkeletonLoader';
import { Asset } from '../../types';
import { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  Plus,
  SlidersHorizontal,
  Grid,
  List,
  Search,
  ScanLine,
  RotateCcw,
  Edit2,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Assets: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role;
  const isManager = role === UserRole.ADMIN || role === UserRole.ASSET_MANAGER;

  // Layout view mode
  const [isGridView, setIsGridView] = useState(true);

  // Filter conditions
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [condFilter, setCondFilter] = useState('');
  const [sharedFilter, setSharedFilter] = useState('');

  // Sidebar and Dialog toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // TanStack Query
  const { data, isLoading } = useQuery({
    queryKey: ['assets', page, pageSize, search, catFilter, statusFilter, condFilter, sharedFilter],
    queryFn: () =>
      assetsService.list({
        page: page + 1,
        page_size: pageSize,
        search: search.trim() || undefined,
        category_id: catFilter || undefined,
        status: statusFilter || undefined,
        condition: condFilter || undefined,
        is_shared: sharedFilter === 'true' ? true : sharedFilter === 'false' ? false : undefined,
      }),
  });

  const { data: deptsData } = useQuery({
    queryKey: ['categories_list'],
    queryFn: () => categoriesService.list({ page: 1, page_size: 100 }),
  });

  const resetFilters = () => {
    setStatusFilter('');
    setCondFilter('');
    setSharedFilter('');
    setCatFilter('');
    setSearch('');
    setPage(0);
    toast.success('Filters cleared');
  };

  const handleShowQR = (asset: Asset, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAsset(asset);
    setQrOpen(true);
  };

  const handleScanMock = () => {
    // Mock QR Scan input box
    const tag = window.prompt('Scan/Enter Asset Tag Code (e.g. AF-000001):');
    if (!tag) return;
    
    toast.promise(
      assetsService.getByTag(tag),
      {
        loading: 'Locating scanned asset...',
        success: (asset) => {
          navigate(`/assets/${asset.id}`);
          return `Asset found: ${asset.name}`;
        },
        error: 'Scanned tag code does not exist in databases.',
      }
    );
  };

  const handleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/assets/${id}/edit`);
  };

  const categories = deptsData?.items || [];
  const assets = data?.items || [];

  // Table columns definition
  const columns: ColumnDef<Asset>[] = [
    {
      accessorKey: 'name',
      header: 'Asset Name',
      cell: ({ row }) => (
        <div className="flex flex-col select-none">
          <span className="font-semibold text-foreground">{row.original.name}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">{row.original.asset_tag}</span>
        </div>
      ),
    },
    {
      accessorKey: 'category_name',
      header: 'Category',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.category_name || '-'}</span>,
    },
    {
      accessorKey: 'condition',
      header: 'Condition',
      cell: ({ row }) => <span className="capitalize text-muted-foreground">{row.original.condition}</span>,
    },
    {
      accessorKey: 'assigned_to_name',
      header: 'Assigned User',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.assigned_to_name || 'Unassigned'}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status State',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 select-none">
          <button
            onClick={(e) => handleShowQR(row.original, e)}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all cursor-pointer"
            title="Show QR Code Tag"
          >
            <ScanLine className="w-3.5 h-3.5" />
          </button>
          {isManager && (
            <button
              onClick={(e) => handleEdit(row.original.id, e)}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all cursor-pointer"
              title="Edit asset details"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => navigate(`/assets/${row.original.id}`)}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Asset Catalog"
        description="Search global enterprise inventories, check allocation status records, scan qr stamps."
      >
        <button
          onClick={handleScanMock}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card/65 text-xs font-semibold text-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
        >
          <ScanLine className="w-4 h-4" />
          <span>Scan Code Tag</span>
        </button>

        {isManager && (
          <button
            onClick={() => navigate('/assets/new')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-indigo-600 text-xs font-semibold text-white shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Asset</span>
          </button>
        )}
      </PageHeader>

      {/* Catalog Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card/45 p-4 border border-border rounded-2xl glass-card">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by name, serial, tag..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Action button bar */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Categories dropdown */}
          <select
            value={catFilter}
            onChange={(e) => {
              setCatFilter(e.target.value);
              setPage(0);
            }}
            className="h-10 px-3.5 border border-border bg-card rounded-xl text-xs text-foreground focus:outline-none cursor-pointer min-w-[150px]"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Advanced filter toggler */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all cursor-pointer relative"
            title="Advanced Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {(statusFilter || condFilter || sharedFilter) && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-1 ring-card" />
            )}
          </button>

          {/* View mode buttons */}
          <div className="flex border border-border rounded-xl overflow-hidden shrink-0">
            <button
              onClick={() => setIsGridView(true)}
              className={`p-2.5 transition-all cursor-pointer ${
                isGridView ? 'bg-primary text-white' : 'bg-card text-muted-foreground hover:text-foreground hover:bg-accent/60'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsGridView(false)}
              className={`p-2.5 transition-all cursor-pointer ${
                !isGridView ? 'bg-primary text-white' : 'bg-card text-muted-foreground hover:text-foreground hover:bg-accent/60'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Catalog Render Grid/Table */}
      {isLoading ? (
        isGridView ? (
          <CardSkeleton count={8} />
        ) : (
          <DataTable
            columns={columns}
            data={[]}
            loading={true}
            pageCount={1}
            pageIndex={0}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )
      ) : assets.length === 0 ? (
        <div className="p-16 border border-dashed border-border bg-card/10 rounded-2xl text-center max-w-lg mx-auto">
          <SlidersHorizontal className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display font-bold text-sm">No Assets Registered</h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            There are no hardware assets matching your filter requirements. Modify parameters or reset defaults.
          </p>
          <button
            onClick={resetFilters}
            className="mt-6 px-4 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Search</span>
          </button>
        </div>
      ) : isGridView ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onClick={() => navigate(`/assets/${asset.id}`)}
                onShowQR={(e) => handleShowQR(asset, e)}
              />
            ))}
          </div>
          {/* Custom paginator for grid view */}
          <div className="flex items-center justify-between border-t border-border/55 pt-4 text-xs text-muted-foreground">
            <span>
              Page {page + 1} of {data?.total_pages || 1}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                Prev
              </button>
              <button
                disabled={page >= (data?.total_pages || 1) - 1}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={assets}
          loading={false}
          pageCount={data?.total_pages || 1}
          pageIndex={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Advanced Filters Sliding Drawer Overlay */}
      <AssetFilters
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        status={statusFilter}
        setStatus={setStatusFilter}
        condition={condFilter}
        setCondition={setCondFilter}
        isShared={sharedFilter}
        setIsShared={setSharedFilter}
        onReset={resetFilters}
      />

      {/* QR tag preview dialog */}
      <QRPreview isOpen={qrOpen} onClose={() => setQrOpen(false)} asset={selectedAsset} />
    </div>
  );
};
