import React from 'react';
import { Asset } from '../../types';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download } from 'lucide-react';
import { API_BASE_URL } from '../../constants';

interface QRPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
}

export const QRPreview: React.FC<QRPreviewProps> = ({
  isOpen,
  onClose,
  asset,
}) => {
  if (!asset) return null;

  // Resolve absolute paths for barcode and QR code images
  const qrUrl = asset.qr_code_url ? `${API_BASE_URL.replace('/api/v1', '')}${asset.qr_code_url}` : '';
  const barcodeUrl = asset.barcode_url ? `${API_BASE_URL.replace('/api/v1', '')}${asset.barcode_url}` : '';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>AssetFlow Tag Print - ${asset.asset_tag}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: sans-serif; text-align: center; }
              .tag-card { border: 2px solid #000; padding: 20px; border-radius: 12px; max-width: 320px; margin: auto; page-break-inside: avoid; }
              .tag-title { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
              .tag-sub { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
              .qr-img { width: 140px; height: 140px; margin-bottom: 8px; }
              .tag-code { font-family: monospace; font-size: 14px; font-weight: bold; margin-bottom: 12px; }
              .barcode-img { width: 220px; height: 50px; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="tag-card">
            <div class="tag-title">${asset.name}</div>
            <div class="tag-sub">${asset.category_name || 'Asset Tag'}</div>
            <img src="${qrUrl}" class="qr-img" />
            <div class="tag-code">${asset.asset_tag}</div>
            <img src="${barcodeUrl}" class="barcode-img" />
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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

              {/* Tag Modal Frame */}
              <Dialog.Content asChild>
                <div className="fixed inset-4 max-w-sm mx-auto my-auto bg-card border border-border rounded-2xl p-6 shadow-2xl z-50 flex flex-col h-fit glass-panel focus:outline-none select-none text-center">
                  <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                    <Dialog.Title className="text-xs font-bold text-foreground font-display uppercase tracking-wide">
                      Asset Tag Preview
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Print Tag Template */}
                  <div className="p-5 border border-border rounded-xl bg-accent/10 flex flex-col items-center">
                    <h3 className="font-display font-bold text-sm text-foreground truncate max-w-[240px]">
                      {asset.name}
                    </h3>
                    <span className="text-[9px] text-muted-foreground uppercase font-display tracking-widest font-semibold block mt-0.5">
                      {asset.category_name || 'Hardware'}
                    </span>

                    {/* QR code */}
                    {qrUrl ? (
                      <img src={qrUrl} alt="QR Code" className="w-32 h-32 my-4 border border-border bg-white p-1.5 rounded-lg" />
                    ) : (
                      <div className="w-32 h-32 my-4 bg-muted animate-pulse rounded-lg" />
                    )}

                    <span className="font-mono font-bold text-xs text-foreground block mb-3">
                      {asset.asset_tag}
                    </span>

                    {/* Barcode code */}
                    {barcodeUrl ? (
                      <img src={barcodeUrl} alt="Barcode" className="w-48 h-10 border border-border bg-white p-1 rounded" />
                    ) : (
                      <div className="w-48 h-10 bg-muted animate-pulse rounded" />
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-accent cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-indigo-600 text-white shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Label</span>
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
