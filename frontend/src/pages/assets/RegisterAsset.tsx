import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsService } from '../../services/assets.service';
import { categoriesService } from '../../services/categories.service';
import { PageHeader } from '../../components/common/PageHeader';
import { FormField, Input, Select } from '../../components/common/FormField';
import { AssetCondition, AssetStatus } from '../../constants';
import { Loader2, ArrowLeft, ArrowRight, Save, Image, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { uploadsService } from '../../services/uploads.service';
import toast from 'react-hot-toast';
import { parseApiError } from '../../utils';

const assetFormSchema = zod.object({
  name: zod.string().min(2, 'Asset name must be at least 2 characters'),
  description: zod.string().optional(),
  category_id: zod.string().min(1, 'Category is required'),
  serial_number: zod.string().optional(),
  model_number: zod.string().optional(),
  manufacturer: zod.string().optional(),
  purchase_date: zod.string().min(1, 'Purchase date is required'),
  purchase_cost: zod.number().min(0, 'Purchase cost cannot be negative'),
  condition: zod.string(),
  location: zod.object({
    building: zod.string().optional(),
    floor: zod.string().optional(),
    room: zod.string().optional(),
  }),
  supplier: zod.string().optional(),
  warranty_expiry: zod.string().optional().nullable(),
  is_shared: zod.boolean(),
  image_urls: zod.array(zod.string()),
  document_urls: zod.array(zod.string()),
});

type AssetFormValues = zod.infer<typeof assetFormSchema>;

export const RegisterAsset: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category_id: '',
      serial_number: '',
      model_number: '',
      manufacturer: '',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_cost: 0,
      condition: AssetCondition.NEW,
      location: { building: '', floor: '', room: '' },
      supplier: '',
      warranty_expiry: '',
      is_shared: false,
      image_urls: [],
      document_urls: [],
    },
  });

  const watchImages = watch('image_urls') || [];
  const watchDocs = watch('document_urls') || [];

  // Query categories
  const { data: catsData } = useQuery({
    queryKey: ['categories_selector'],
    queryFn: () => categoriesService.list({ page: 1, page_size: 100 }),
  });

  // Query details if edit mode
  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      assetsService
        .getById(id!)
        .then((asset) => {
          reset({
            name: asset.name,
            description: asset.description || '',
            category_id: asset.category_id,
            serial_number: asset.serial_number || '',
            model_number: asset.model_number || '',
            manufacturer: asset.manufacturer || '',
            purchase_date: asset.purchase_date.split('T')[0],
            purchase_cost: asset.purchase_cost,
            condition: asset.condition,
            location: {
              building: asset.location.building || '',
              floor: asset.location.floor || '',
              room: asset.location.room || '',
            },
            supplier: asset.supplier || '',
            warranty_expiry: asset.warranty_expiry ? asset.warranty_expiry.split('T')[0] : '',
            is_shared: asset.is_shared,
            image_urls: asset.image_urls || [],
            document_urls: asset.document_urls || [],
          });
        })
        .catch((err) => toast.error('Failed to load asset details'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, reset]);

  // Handle image upload via general uploadsService
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    try {
      const resp = await uploadsService.upload(files[0]);
      setValue('image_urls', [...watchImages, resp.url]);
      toast.success('Asset image uploaded');
    } catch (err) {
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle docs upload
  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingDoc(true);
    try {
      const resp = await uploadsService.upload(files[0]);
      setValue('document_urls', [...watchDocs, resp.url]);
      toast.success('Document upload completed');
    } catch (err) {
      toast.error('Document upload failed');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Mutate create/edit
  const saveMutation = useMutation({
    mutationFn: (values: AssetFormValues) => {
      const payload = {
        ...values,
        warranty_expiry: values.warranty_expiry || null,
      };
      return isEdit ? assetsService.update(id!, payload) : assetsService.create(payload);
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(isEdit ? 'Asset updated successfully' : 'Asset registered successfully');
      navigate(`/assets/${asset.id}`);
    },
    onError: (err) => {
      toast.error(parseApiError(err));
    },
  });

  const onSubmit = (values: AssetFormValues) => {
    saveMutation.mutate(values);
  };

  const categories = catsData?.items || [];
  const categoryOptions = [
    { value: '', label: 'Select Category' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const conditionOptions = Object.values(AssetCondition).map((c) => ({
    value: c,
    label: c.toUpperCase(),
  }));

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground animate-pulse">Loading registration details...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto select-none pb-12">
      <PageHeader
        title={isEdit ? 'Modify Asset Profile' : 'Register New Asset'}
        description="Verify hardware categories, purchase cost values, serial tags, and storage locations."
      />

      {/* Steps indicator bar */}
      <div className="flex items-center justify-between border border-border p-4 bg-card/65 rounded-2xl mb-8 glass-card">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-display text-[10px] font-bold ${
                step === s
                  ? 'bg-primary text-white'
                  : step > s
                  ? 'bg-emerald-500/20 text-emerald-500'
                  : 'bg-accent text-muted-foreground'
              }`}
            >
              {s}
            </span>
            <span className="hidden sm:inline text-xs font-semibold text-foreground/80">
              {s === 1 ? 'General Details' : s === 2 ? 'Purchase & Warranty' : 'Storage & Attachments'}
            </span>
          </div>
        ))}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* STEP 1: General Details */}
        {step === 1 && (
          <div className="p-6 border border-border bg-card/65 rounded-2xl space-y-4 glass-panel">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Asset Name" error={errors.name} required>
                <Input placeholder="e.g. MacBook Pro M3" {...register('name')} />
              </FormField>

              <FormField label="Asset Category" error={errors.category_id} required>
                <Select options={categoryOptions} {...register('category_id')} />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Serial Number (Optional)" error={errors.serial_number}>
                <Input placeholder="SN tag reference" {...register('serial_number')} />
              </FormField>
              <FormField label="Model Number (Optional)" error={errors.model_number}>
                <Input placeholder="Model ID reference" {...register('model_number')} />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Manufacturer (Optional)" error={errors.manufacturer}>
                <Input placeholder="e.g. Apple Inc." {...register('manufacturer')} />
              </FormField>
              <FormField label="Asset Condition" error={errors.condition} required>
                <Select options={conditionOptions} {...register('condition')} />
              </FormField>
            </div>

            <FormField label="Description (Optional)" error={errors.description}>
              <textarea
                placeholder="Hardware specifications or special tracking directives..."
                className="w-full min-h-[80px] p-3 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 resize-y"
                {...register('description')}
              />
            </FormField>

            <label className="flex items-center gap-2 pt-2 text-xs font-semibold text-muted-foreground cursor-pointer">
              <input type="checkbox" className="rounded bg-accent" {...register('is_shared')} />
              <span>Pool Reservable (Shared Asset)</span>
            </label>
          </div>
        )}

        {/* STEP 2: Purchase & Warranty */}
        {step === 2 && (
          <div className="p-6 border border-border bg-card/65 rounded-2xl space-y-4 glass-panel">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Purchase Date" error={errors.purchase_date} required>
                <Input type="date" {...register('purchase_date')} />
              </FormField>
              <FormField label="Purchase Cost ($ USD)" error={errors.purchase_cost} required>
                <Input type="number" step="0.01" {...register('purchase_cost', { valueAsNumber: true })} />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Warranty Expiration (Optional)" error={errors.warranty_expiry}>
                <Input type="date" {...register('warranty_expiry')} />
              </FormField>
              <FormField label="Supplier Vendor (Optional)" error={errors.supplier}>
                <Input placeholder="e.g. CDW Government" {...register('supplier')} />
              </FormField>
            </div>
          </div>
        )}

        {/* STEP 3: Location & Attachments */}
        {step === 3 && (
          <div className="p-6 border border-border bg-card/65 rounded-2xl space-y-6 glass-panel">
            {/* Location */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-foreground font-display uppercase tracking-wide">
                Storage Placement Location
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Building" error={errors.location?.building}>
                  <Input placeholder="Building A" {...register('location.building')} />
                </FormField>
                <FormField label="Floor" error={errors.location?.floor}>
                  <Input placeholder="3rd Floor" {...register('location.floor')} />
                </FormField>
                <FormField label="Room" error={errors.location?.room}>
                  <Input placeholder="Room 304" {...register('location.room')} />
                </FormField>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <h3 className="text-xs font-bold text-foreground font-display uppercase tracking-wide">
                Asset Image Files
              </h3>
              
              <div className="flex flex-wrap gap-3">
                {watchImages.map((url, index) => (
                  <div key={index} className="w-16 h-16 rounded-xl border border-border relative overflow-hidden bg-accent/20 flex items-center justify-center shrink-0">
                    <img src={url} className="w-full h-full object-cover" alt="asset preview" />
                  </div>
                ))}

                <label className="w-16 h-16 rounded-xl border border-dashed border-border hover:border-primary transition-all flex flex-col items-center justify-center text-muted-foreground hover:text-primary cursor-pointer bg-card/40 shrink-0">
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <>
                      <Image className="w-4 h-4" />
                      <span className="text-[9px] font-semibold mt-1">Add Image</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} disabled={uploadingImage} />
                </label>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <h3 className="text-xs font-bold text-foreground font-display uppercase tracking-wide">
                Contracts & Invoice Documents
              </h3>
              
              <div className="space-y-2">
                {watchDocs.map((url, index) => (
                  <div key={index} className="p-2 border border-border bg-accent/25 rounded-xl flex items-center justify-between text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="truncate max-w-[200px]">{url.split('/').pop()}</span>
                    </div>
                    <span className="text-emerald-500 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Attached
                    </span>
                  </div>
                ))}

                <label className="flex items-center justify-center h-10 border border-dashed border-border hover:border-primary hover:text-primary rounded-xl text-xs font-semibold text-muted-foreground bg-card/45 transition-all cursor-pointer select-none gap-1.5">
                  {uploadingDoc ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload Invoice PDF / Document</span>
                    </>
                  )}
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleDocFileChange} disabled={uploadingDoc} />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Steps footer controls */}
        <div className="flex items-center justify-between pt-4 border-t border-border/45 mt-8">
          <button
            type="button"
            disabled={step === 1 || saveMutation.isPending}
            onClick={() => setStep((prev) => (prev - 1) as any)}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-accent flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev + 1) as any)}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-indigo-600 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-indigo-600 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10 hover:shadow-lg transition-all"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isEdit ? 'Save Asset Changes' : 'Register Asset Catalog'}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
