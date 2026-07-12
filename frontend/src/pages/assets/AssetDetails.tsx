import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService } from '../../services/assets.service';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../constants';
import { PageHeader } from '../../components/common/PageHeader';
import { DetailsSkeleton } from '../../components/common/SkeletonLoader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AssetTimeline } from '../../components/assets/AssetTimeline';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { QRPreview } from '../../components/assets/QRPreview';
import {
  Calendar,
  Building,
  User,
  Wrench,
  QrCode,
  DollarSign,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  PackageCheck,
  History,
  FileText,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  Laptop,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils';
import toast from 'react-hot-toast';

export const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role;
  const isManager = role === UserRole.ADMIN || role === UserRole.ASSET_MANAGER;

  // Modals state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  // Queries
  const { data: asset, isLoading, error } = useQuery({
    queryKey: ['asset_details', id],
    queryFn: () => assetsService.getById(id!),
    enabled: !!id,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['asset_history', id],
    queryFn: () => assetsService.getHistory(id!),
    enabled: !!id,
  });

  // Mutate delete
  const deleteMutation = useMutation({
    mutationFn: () => assetsService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset record removed successfully');
      navigate('/assets');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to remove asset');
    },
  });

  if (isLoading) {
    return <DetailsSkeleton />;
  }

  if (error || !asset) {
    return (
      <div className="text-center py-12 select-none">
        <h3 className="text-sm font-bold text-foreground font-display">Asset Profile Not Found</h3>
        <p className="text-xs text-muted-foreground mt-1">This record does not exist or has been deleted.</p>
        <button
          onClick={() => navigate('/assets')}
          className="mt-6 px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white cursor-pointer"
        >
          Back to catalog
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Title */}
      <PageHeader title={asset.name} description={`Tag Serial: ${asset.asset_tag} | Status State: `}>
        <div className="flex items-center gap-1.5 mt-1 sm:mt-0 mr-auto sm:mr-0">
          <StatusBadge status={asset.status} />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Show QR */}
          <button
            onClick={() => setQrOpen(true)}
            className="flex items-center gap-1 px-4 py-2 rounded-xl border border-border bg-card/65 text-xs font-semibold text-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Label tag</span>
          </button>

          {/* Edit details */}
          {isManager && (
            <>
              <button
                onClick={() => navigate(`/assets/${asset.id}/edit`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card/65 text-xs font-semibold text-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
                <span>Modify</span>
              </button>

              <button
                onClick={() => setDeleteOpen(true)}
                className="p-2 rounded-xl border border-border text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
                title="Remove Asset"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </PageHeader>

      {/* Main Grid specs details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: specs summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 border border-border rounded-2xl bg-card/65 glass-panel space-y-6">
            <h3 className="text-sm font-bold text-foreground font-display border-b border-border/40 pb-3 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-indigo-500" />
              <span>Asset Specifications</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs leading-normal">
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground/60 uppercase font-semibold">Department Store</p>
                  <p className="font-semibold text-foreground">{asset.department_name || '-'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground/60 uppercase font-semibold">Purchase Date</p>
                  <p className="font-semibold text-foreground">{formatDate(asset.purchase_date)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground/60 uppercase font-semibold">Purchase Cost</p>
                  <p className="font-semibold text-foreground">{formatCurrency(asset.purchase_cost)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground/60 uppercase font-semibold">Warranty Expiration</p>
                  <p className="font-semibold text-foreground">
                    {asset.warranty_expiry ? formatDate(asset.warranty_expiry) : 'No warranty'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground/60 uppercase font-semibold">Location Address</p>
                  <p className="font-semibold text-foreground">
                    {asset.location.building || '-'} &bull; {asset.location.room || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground/60 uppercase font-semibold">Model Number</p>
                  <p className="font-semibold text-foreground font-mono">{asset.model_number || '-'}</p>
                </div>
              </div>
            </div>

            {asset.description && (
              <div className="pt-4 border-t border-border/40 text-xs">
                <p className="text-[10px] text-muted-foreground/60 uppercase font-semibold mb-1">Additional description</p>
                <p className="text-muted-foreground/80 leading-relaxed">{asset.description}</p>
              </div>
            )}
          </div>

          {/* Allocation states details */}
          <div className="p-6 border border-border rounded-2xl bg-card/65 glass-panel space-y-4">
            <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              <span>Current Allocation details</span>
            </h3>

            <div className="p-4 border border-border rounded-xl bg-accent/15 flex justify-between items-center text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold">
                  {asset.assigned_to_name ? asset.assigned_to_name[0] : '?'}
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {asset.assigned_to_name || 'No employee assigned'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {asset.assigned_to_name ? 'Individual assignment' : 'Pool shared stock'}
                  </p>
                </div>
              </div>

              {/* Allocation actions shortcut */}
              {isManager && !asset.assigned_to_id && asset.status === 'available' && (
                <button
                  onClick={() => navigate('/allocations')}
                  className="px-3 py-1.5 rounded-lg bg-primary hover:bg-indigo-600 text-xs text-white cursor-pointer"
                >
                  Allocate Now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right column: timeline logs */}
        <div className="space-y-6">
          <div className="p-6 border border-border rounded-2xl bg-card/65 glass-panel space-y-6">
            <h3 className="text-sm font-bold text-foreground font-display border-b border-border/40 pb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              <span>Audit Trail Timeline</span>
            </h3>

            <AssetTimeline history={historyData?.items || []} loading={historyLoading} />
          </div>
        </div>

      </div>

      {/* Delete confirm dialog */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Remove Asset Record"
        description="Are you sure you want to delete this hardware asset record? Deleting this asset will break historical records and logs references."
        isLoading={deleteMutation.isPending}
      />

      {/* QR tag preview dialog */}
      <QRPreview isOpen={qrOpen} onClose={() => setQrOpen(false)} asset={asset} />
    </div>
  );
};
