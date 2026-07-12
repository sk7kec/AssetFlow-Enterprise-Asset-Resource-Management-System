import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { searchService, SearchResults } from '../../services/search.service';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, QrCode, Wrench, Users, ArrowRight, CornerDownLeft } from 'lucide-react';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults(null);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.trim().length < 2) {
        setResults(null);
        return;
      }
      setLoading(true);
      try {
        const data = await searchService.global(debouncedQuery);
        setResults(data);
      } catch (error) {
        console.error('Failed to run global search:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [debouncedQuery]);

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  const assetResults = results?.results.assets || [];
  const maintenanceResults = results?.results.maintenance || [];
  const employeeResults = results?.results.employees || [];
  const hasResults = assetResults.length > 0 || maintenanceResults.length > 0 || employeeResults.length > 0;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Glass Overlay backdrop */}
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50"
          />
        </Dialog.Overlay>

        {/* Modal Body */}
        <Dialog.Content asChild>
          <div className="fixed inset-x-4 top-[10%] max-w-2xl mx-auto bg-card border border-border rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden glass-panel max-h-[75vh] focus:outline-none">
            {/* Search Input Box */}
            <div className="flex items-center gap-3 px-4 border-b border-border h-14 shrink-0">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search assets, maintenance records, employees..."
                className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/60"
                autoFocus
              />
              {loading ? (
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              ) : (
                <span className="text-[10px] text-muted-foreground/50 border border-border/80 rounded px-1.5 py-0.5 font-mono select-none">
                  ESC
                </span>
              )}
            </div>

            {/* Results Frame */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {query.trim().length < 2 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p className="text-xs">Type at least 2 characters to trigger search...</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-1">
                    Searches serials, tags, names, descriptions, or email domains.
                  </p>
                </div>
              ) : !loading && !hasResults ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p className="text-xs font-semibold">No records match your query.</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-1">Try searching another query term.</p>
                </div>
              ) : (
                <>
                  {/* Assets */}
                  {assetResults.length > 0 && (
                    <div className="space-y-1.5">
                      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Assets Matching
                      </h3>
                      {assetResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(`/assets/${item.id}`)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-accent/60 transition-all cursor-pointer group text-xs text-foreground font-medium"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                              <QrCode className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{item.tag}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] text-muted-foreground">Go to details</span>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Maintenance Tickets */}
                  {maintenanceResults.length > 0 && (
                    <div className="space-y-1.5">
                      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Maintenance Tickets
                      </h3>
                      {maintenanceResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelect('/maintenance')}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-accent/60 transition-all cursor-pointer group text-xs text-foreground font-medium"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-amber-500/10 flex items-center justify-center text-amber-500">
                              <Wrench className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold truncate max-w-[280px] sm:max-w-md">{item.description}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Asset Ref: {item.tag}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] text-muted-foreground">Open Kanban</span>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Employee Directory */}
                  {employeeResults.length > 0 && (
                    <div className="space-y-1.5">
                      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        Employees
                      </h3>
                      {employeeResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelect('/employees')}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-accent/60 transition-all cursor-pointer group text-xs text-foreground font-medium"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {item.email} &middot; {item.department}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[9px] text-muted-foreground">View cards</span>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer Hint */}
            <div className="px-4 py-2 border-t border-border bg-accent/20 flex justify-between items-center text-[10px] text-muted-foreground/60 select-none">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" /> Select
                </span>
                <span>&uarr;&darr; Navigate</span>
              </div>
              <span>Press ESC to close</span>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
