import React from 'react';
import { Asset } from '../../types';
import { motion } from 'framer-motion';
import { QrCode, Monitor, ChevronRight, User, CircleDot } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency } from '../../utils';

interface AssetCardProps {
  asset: Asset;
  onClick: () => void;
  onShowQR: (e: React.MouseEvent) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onClick,
  onShowQR,
}) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="p-5 border border-border bg-card/60 hover:bg-card hover:shadow-lg rounded-2xl transition-all cursor-pointer flex flex-col justify-between h-[210px] glass-card select-none"
    >
      {/* Top section: Name & Tag */}
      <div>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Monitor className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-xs text-foreground truncate max-w-[140px] sm:max-w-[180px]">
                {asset.name}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{asset.asset_tag}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowQR(e);
              }}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all cursor-pointer"
              title="Show QR Code Tag"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mid: Specific details */}
        <div className="grid grid-cols-2 gap-2 py-3 border-y border-border/40 my-3 text-[10px] text-muted-foreground">
          <div>
            <span className="block text-muted-foreground/60 text-[9px] uppercase font-display font-semibold tracking-wide">Category</span>
            <span className="font-semibold text-foreground truncate block">{asset.category_name || 'Hardware'}</span>
          </div>
          <div>
            <span className="block text-muted-foreground/60 text-[9px] uppercase font-display font-semibold tracking-wide">Condition</span>
            <span className="font-semibold text-foreground truncate block capitalize">{asset.condition}</span>
          </div>
        </div>
      </div>

      {/* Bottom info section */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground truncate max-w-[100px]">
            {asset.assigned_to_name || 'Unassigned'}
          </span>
        </div>
        
        <StatusBadge status={asset.status} />
      </div>
    </motion.div>
  );
};
