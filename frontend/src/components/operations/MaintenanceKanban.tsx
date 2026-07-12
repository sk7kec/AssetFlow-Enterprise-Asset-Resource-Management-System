import React from 'react';
import { MaintenanceRequest } from '../../types';
import { MaintenanceStatus, MAINTENANCE_PRIORITY_COLORS } from '../../constants';
import { motion } from 'framer-motion';
import { Wrench, User, Calendar, ShieldAlert, ArrowRightCircle } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface KanbanProps {
  tickets: MaintenanceRequest[];
  onStatusChange: (id: string, newStatus: string) => void;
  onAssignTechnician: (id: string) => void;
  isManager: boolean;
}

export const MaintenanceKanban: React.FC<KanbanProps> = ({
  tickets,
  onStatusChange,
  onAssignTechnician,
  isManager,
}) => {
  // Columns structure matching MaintenanceStatus
  const columns: { label: string; status: MaintenanceStatus }[] = [
    { label: 'Pending Review', status: MaintenanceStatus.PENDING },
    { label: 'Approved Tickets', status: MaintenanceStatus.APPROVED },
    { label: 'Assigned Tasks', status: MaintenanceStatus.ASSIGNED },
    { label: 'In Progress', status: MaintenanceStatus.IN_PROGRESS },
    { label: 'Resolved Tickets', status: MaintenanceStatus.RESOLVED },
  ];

  const getTicketsForStatus = (status: MaintenanceStatus) => {
    return tickets.filter((t) => t.status === status);
  };

  const getPriorityStyles = (priority: any) => {
    return MAINTENANCE_PRIORITY_COLORS[priority as keyof typeof MAINTENANCE_PRIORITY_COLORS] || {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
    };
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 select-none min-h-[500px]">
      {columns.map((col) => {
        const colTickets = getTicketsForStatus(col.status);

        return (
          <div
            key={col.status}
            className="flex-1 min-w-[280px] max-w-[320px] bg-accent/25 border border-border rounded-2xl p-4 flex flex-col glass-panel"
          >
            {/* Column Header */}
            <div className="flex justify-between items-center pb-3 border-b border-border mb-4">
              <h3 className="text-xs font-bold text-foreground font-display uppercase tracking-wide">
                {col.label}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-border text-muted-foreground text-[10px] font-bold">
                {colTickets.length}
              </span>
            </div>

            {/* Column Body Cards list */}
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[440px] pr-1">
              {colTickets.length === 0 ? (
                <div className="h-28 border border-dashed border-border/75 rounded-xl flex items-center justify-center text-center p-4">
                  <p className="text-[10px] text-muted-foreground/60 leading-normal">
                    No tickets in this state.
                  </p>
                </div>
              ) : (
                colTickets.map((t) => {
                  const pri = getPriorityStyles(t.priority);

                  return (
                    <motion.div
                      key={t.id}
                      whileHover={{ y: -2 }}
                      className="p-4 border border-border bg-card/65 rounded-xl space-y-3 hover:shadow-md transition-all relative group"
                    >
                      {/* Priority pill */}
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wide uppercase border ${pri.bg} ${pri.text} ${pri.border}`}>
                          {t.priority}
                        </span>
                        
                        {/* Quick state advances */}
                        {isManager && t.status !== MaintenanceStatus.RESOLVED && (
                          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                            <select
                              onChange={(e) => onStatusChange(t.id, e.target.value)}
                              defaultValue={t.status}
                              className="h-6 text-[10px] border border-border bg-card rounded-md px-1.5 focus:outline-none cursor-pointer"
                            >
                              <option value="pending">Review</option>
                              <option value="approved">Approve</option>
                              <option value="assigned">Assign</option>
                              <option value="in_progress">Start</option>
                              <option value="resolved">Resolve</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Info details */}
                      <div>
                        <h4 className="font-semibold text-foreground text-xs leading-normal line-clamp-2">
                          {t.issue_description}
                        </h4>
                        <p className="text-[9px] text-muted-foreground/80 mt-1 font-mono">
                          Ref: {t.asset_name} ({t.asset_tag})
                        </p>
                      </div>

                      {/* Footer technician details */}
                      <div className="pt-2.5 border-t border-border/40 flex justify-between items-center text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          {t.technician_name ? (
                            <span className="truncate">{t.technician_name}</span>
                          ) : isManager ? (
                            <button
                              onClick={() => onAssignTechnician(t.id)}
                              className="text-primary hover:underline font-semibold"
                            >
                              Assign
                            </button>
                          ) : (
                            <span>Unassigned</span>
                          )}
                        </div>
                        
                        {t.cost && (
                          <span className="font-semibold text-foreground">${t.cost}</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
