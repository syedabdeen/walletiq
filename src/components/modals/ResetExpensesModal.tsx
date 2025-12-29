import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, AlertTriangle } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSaveAndResetExpenses } from '@/hooks/useExpenses';

interface ResetExpensesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetExpensesModal({ open, onOpenChange }: ResetExpensesModalProps) {
  const now = new Date();
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(now));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(now));
  
  const saveAndReset = useSaveAndResetExpenses();

  const handleSaveAndReset = async () => {
    if (!startDate || !endDate) return;

    await saveAndReset.mutateAsync({
      periodStart: format(startDate, 'yyyy-MM-dd'),
      periodEnd: format(endDate, 'yyyy-MM-dd'),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Save & Reset Expenses
          </DialogTitle>
          <DialogDescription>
            This will save your expenses as a historical record and clear them from the current view.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Period Start</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Period End</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-sm">
            <p className="text-foreground">
              <strong>Note:</strong> Expenses within this date range will be archived to history and removed from your active expenses.
            </p>
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
            <Button 
              onClick={handleSaveAndReset} 
              className="flex-1"
              disabled={!startDate || !endDate || saveAndReset.isPending}
            >
              {saveAndReset.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Save & Reset'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
