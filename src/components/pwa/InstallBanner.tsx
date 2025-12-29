import { useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export function InstallBanner() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  // Check if dismissed in this session
  if (dismissed || isInstalled || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      toast.success('App installed successfully!');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl gradient-primary p-4 mb-6 animate-slide-up">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-primary-foreground" />
      </button>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2.5 rounded-xl bg-primary-foreground/20">
            <Smartphone className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-primary-foreground">
              Install House Expenses
            </h3>
            <p className="text-sm text-primary-foreground/80">
              Add to home screen for quick access & offline use
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 sm:flex-initial bg-primary-foreground/20 text-primary-foreground border-0 hover:bg-primary-foreground/30"
            asChild
          >
            <Link to="/install">Learn More</Link>
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-initial bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            onClick={handleInstall}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Install
          </Button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary-foreground/5" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-primary-foreground/5" />
    </div>
  );
}
