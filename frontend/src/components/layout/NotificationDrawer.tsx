import React, { useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CheckCheck, BellOff, Info, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { formatDateTime } from '../../utils';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Prevent parent content scrolling when drawer is open
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

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'danger':
        return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-indigo-500" />;
    }
  };

  const getBorderColor = (type: string, isRead: boolean) => {
    if (isRead) return 'border-border/40';
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-emerald-500 border-y-border/60 border-r-border/60';
      case 'warning':
        return 'border-l-4 border-l-amber-500 border-y-border/60 border-r-border/60';
      case 'danger':
        return 'border-l-4 border-l-rose-500 border-y-border/60 border-r-border/60';
      default:
        return 'border-l-4 border-l-indigo-500 border-y-border/60 border-r-border/60';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Glass Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 cursor-pointer"
          />

          {/* Sliding Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-2xl z-50 flex flex-col glass-panel"
          >
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-display font-bold">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-display text-[10px] font-bold tracking-wide uppercase">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mb-4 text-muted-foreground">
                    <BellOff className="w-5 h-5" />
                  </div>
                  <h3 className="font-display font-medium text-sm">All caught up!</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    You have no notifications. Active system logs will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-xl border bg-card/45 hover:bg-accent/30 transition-all flex gap-3 ${getBorderColor(
                      notif.type,
                      notif.is_read
                    )}`}
                  >
                    <div className="mt-0.5 shrink-0">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-semibold truncate ${notif.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[9px] text-muted-foreground/60 block mt-2">
                        {formatDateTime(notif.created_at)}
                      </span>
                    </div>
                    {!notif.is_read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="p-1 rounded bg-accent/60 hover:bg-accent text-muted-foreground hover:text-foreground shrink-0 cursor-pointer h-fit self-center"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
