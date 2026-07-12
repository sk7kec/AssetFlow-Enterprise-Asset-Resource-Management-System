import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../../utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBg: 'bg-amber-500/10 text-amber-500 dark:bg-amber-950/30',
          btnBg: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500 text-white',
        };
      case 'info':
        return {
          iconBg: 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-950/30',
          btnBg: 'bg-primary hover:bg-indigo-600 focus:ring-indigo-500 text-white',
        };
      default:
        return {
          iconBg: 'bg-rose-500/10 text-rose-500 dark:bg-rose-950/30',
          btnBg: 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-500 text-white',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Overlay */}
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50"
                />
              </Dialog.Overlay>

              {/* Modal Body */}
              <Dialog.Content asChild>
                <div className="fixed inset-4 max-w-md mx-auto my-auto bg-card border border-border rounded-2xl p-6 shadow-2xl z-50 flex flex-col h-fit glass-panel focus:outline-none select-none">
                  <div className="flex gap-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', styles.iconBg)}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Dialog.Title className="text-sm font-bold text-foreground font-display">
                        {title}
                      </Dialog.Title>
                      <Dialog.Description className="text-xs text-muted-foreground leading-relaxed">
                        {description}
                      </Dialog.Description>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      disabled={isLoading}
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {cancelText}
                    </button>
                    <button
                      disabled={isLoading}
                      onClick={onConfirm}
                      className={cn(
                        'px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
                        styles.btnBg
                      )}
                    >
                      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{confirmText}</span>
                    </button>
                  </div>
                </div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
