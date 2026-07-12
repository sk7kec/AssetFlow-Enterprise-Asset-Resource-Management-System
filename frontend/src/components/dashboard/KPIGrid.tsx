import React from 'react';
import { KPICard } from '../common/KPICard';
import { DashboardKPIs } from '../../types';
import {
  Boxes,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  FileX2,
  CalendarCheck,
  ShieldAlert,
} from 'lucide-react';

interface KPIGridProps {
  kpis: DashboardKPIs['kpis'];
}

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
      <KPICard
        title="Total Asset Records"
        value={kpis.total_assets}
        icon={Boxes}
        color="primary"
        subtext="Tracked database catalog"
      />
      <KPICard
        title="Available Assets"
        value={kpis.assets_available}
        icon={CheckCircle}
        color="success"
        subtext="Available in active inventory"
      />
      <KPICard
        title="Allocated Assets"
        value={kpis.assets_allocated}
        icon={FileSpreadsheet}
        color="info"
        subtext="Currently assigned to staff"
      />
      <KPICard
        title="Under Maintenance"
        value={kpis.assets_under_maintenance}
        icon={AlertTriangle}
        color="warning"
        subtext="Tickets currently unresolved"
      />
    </div>
  );
};
