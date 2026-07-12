import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../constants';
import { motion } from 'framer-motion';
import { PlusCircle, UserPlus, CalendarPlus, AlertOctagon, ClipboardCopy } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;

  // Configuration of quick shortcuts by roles
  const actions = [
    {
      label: 'Register Asset',
      icon: PlusCircle,
      onClick: () => navigate('/assets'),
      roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER],
    },
    {
      label: 'Allocate Asset',
      icon: UserPlus,
      onClick: () => navigate('/allocations'),
      roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER],
    },
    {
      label: 'Book Room / Vehicle',
      icon: CalendarPlus,
      onClick: () => navigate('/bookings'),
      roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD, UserRole.EMPLOYEE],
    },
    {
      label: 'Raise Ticket',
      icon: AlertOctagon,
      onClick: () => navigate('/maintenance'),
      roles: [UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.DEPARTMENT_HEAD, UserRole.EMPLOYEE],
    },
    {
      label: 'Trigger Audit',
      icon: ClipboardCopy,
      onClick: () => navigate('/audits'),
      roles: [UserRole.ADMIN],
    },
  ];

  return (
    <div className="p-6 border border-border rounded-2xl bg-card/60 flex flex-col justify-between glass-card h-full select-none">
      <h3 className="text-sm font-bold text-foreground font-display mb-6 uppercase tracking-wide">
        Quick Action Shortcuts
      </h3>

      <div className="grid grid-cols-2 gap-3.5 flex-1">
        {actions.map((act, idx) => {
          if (act.roles && role && !act.roles.includes(role)) return null;
          const ActionIcon = act.icon;

          return (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={act.onClick}
              className="p-3.5 border border-border/80 rounded-xl bg-card/45 hover:bg-accent/60 transition-all text-xs font-semibold text-foreground flex flex-col gap-2 items-start justify-between cursor-pointer select-none text-left"
            >
              <ActionIcon className="w-5 h-5 text-indigo-500 shrink-0" />
              <span>{act.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
