import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Paperclip, X, Image } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCategories, useAddExpense, useUpdateExpense, type Expense } from '@/hooks/useExpenses';
import { CategoryIcon } from '@/components/CategoryIcon';
import { z } from 'zod';
import { toast } from 'sonner';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const expenseSchema = z.object({
  category_id: z.string().min(1, 'Please select a category'),
  amount: z.number().positive('Amount must be greater than 0'),
  expense_date: z.string().min(1, 'Please select a date'),
  remarks: z.string().max(500, 'Remarks must be less than 500 characters').optional(),
});

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingExpense?: Expense | null;
}

export function AddExpenseModal({ open, onOpenChange, editingExpense }: AddExpenseModalProps) {
  const { currencyCode } = useSettingsContext();
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [existingAttachment, setExistingAttachment] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useCategories();
  const addExpense = useAddExpense();
  const updateExpense = useUpdateExpense();

  useEffect(() => {
    if (editingExpense) {
      setDate(new Date(editingExpense.expense_date));
      setCategoryId(editingExpense.category_id || '');
      setAmount(editingExpense.amount.toString());
      setRemarks(editingExpense.remarks || '');
      setExistingAttachment(editingExpense.attachment_url || null);
      setAttachmentFile(null);
      setAttachmentPreview(null);
    } else {
      setDate(new Date());
      setCategoryId('');
      setAmount('');
      setRemarks('');
      setExistingAttachment(null);
      setAttachmentFile(null);
      setAttachmentPreview(null);
    }
  }, [editingExpense, open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload an image (JPG, PNG, WebP) or PDF');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setAttachmentFile(file);
    setExistingAttachment(null);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setAttachmentPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    setExistingAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAttachment = async (): Promise<string | null> => {
    if (!attachmentFile || !user) return existingAttachment;

    const fileExt = attachmentFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, attachmentFile);

    if (uploadError) {
      throw new Error('Failed to upload attachment');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      category_id: categoryId,
      amount: parseFloat(amount),
      expense_date: date ? format(date, 'yyyy-MM-dd') : '',
      remarks: remarks.trim() || undefined,
    };

    const result = expenseSchema.safeParse(data);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    try {
      setIsUploading(true);
      const attachmentUrl = await uploadAttachment();

      if (editingExpense) {
        await updateExpense.mutateAsync({ 
          id: editingExpense.id, 
          ...data,
          attachment_url: attachmentUrl || undefined,
        });
      } else {
        await addExpense.mutateAsync({
          ...data,
          attachment_url: attachmentUrl || undefined,
        });
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = addExpense.isPending || updateExpense.isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon icon={cat.icon} className="w-4 h-4" />
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount ({currencyCode})</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Receipt/Attachment (Optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!attachmentFile && !existingAttachment ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Attach Receipt
              </Button>
            ) : (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                {attachmentPreview ? (
                  <img 
                    src={attachmentPreview} 
                    alt="Receipt preview" 
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : existingAttachment ? (
                  <Image className="w-12 h-12 text-muted-foreground" />
                ) : (
                  <Paperclip className="w-6 h-6 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachmentFile?.name || 'Existing attachment'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {attachmentFile 
                      ? `${(attachmentFile.size / 1024).toFixed(1)} KB`
                      : 'Saved receipt'
                    }
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeAttachment}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Remarks (Optional)</Label>
            <Textarea
              placeholder="Add any notes..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : editingExpense ? (
                'Update'
              ) : (
                'Add Expense'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
