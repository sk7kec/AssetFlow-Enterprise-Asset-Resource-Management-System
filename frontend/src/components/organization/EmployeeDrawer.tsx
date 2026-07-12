import React, { useEffect, useState } from 'react';
import { Employee, Allocation } from '../../types';
import { allocationsService } from '../../services/allocations.service';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Briefcase, Mail, Building, Laptop, ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils';
import { StatusBadge } from '../common/StatusBadge';

interface EmployeeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export const EmployeeDrawer: React.FC<EmployeeDrawerProps> = ({
  isOpen,
  onClose,
  employee,
}) => {
  // Prevent scrolling when drawer is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Query assets assigned to this employee
  const { data: allocationsData, isLoading } = useQuery({
    queryKey: ['employee_allocations', employee?.employee_id],
    queryFn: () =>
      allocationsService.list({
        employee_id: employee?.employee_id,
        status: 'active',
      }),
    enabled: !!employee,
  });

  const activeAllocations = allocationsData?.items || [];

  return (
    <AnimatePresence>
      {isOpen && employee && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 cursor-pointer"
          />

          {/* Drawer Body */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col glass-panel select-none"
          >
            {/* Header info */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-lg uppercase border border-primary/20">
                  {employee.full_name[0]}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground font-display leading-tight">
                    {employee.full_name}
                  </h2>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {employee.employee_id}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile specifications */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Employee Specifications
                </h3>
                
                <div className="space-y-3 border border-border bg-accent/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2.5 text-xs">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground font-semibold">Email:</span>
                    <span className="text-foreground font-mono truncate">{employee.email}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    <Building className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground font-semibold">Department:</span>
                    <span className="text-foreground truncate">{employee.department_name || '-'}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground font-semibold">Job Role:</span>
                    <span className="text-foreground truncate capitalize">{employee.role}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground font-semibold">Joined Date:</span>
                    <span className="text-foreground">{formatDate(employee.joined_date)}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="text-muted-foreground font-semibold">Account State:</span>
                    <StatusBadge status={employee.status} />
                  </div>
                </div>
              </div>

              {/* Assets assigned list */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Assigned Hardware ({activeAllocations.length})
                </h3>

                {isLoading ? (
                  <p className="text-xs text-muted-foreground py-4 animate-pulse">Loading allocations...</p>
                ) : activeAllocations.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4">No active allocations assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {activeAllocations.map((alloc) => (
                      <div
                        key={alloc.id}
                        className="p-3 border border-border bg-card/45 hover:bg-accent/40 rounded-xl flex items-center justify-between transition-all cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Laptop className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{alloc.asset_name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{alloc.asset_tag}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
