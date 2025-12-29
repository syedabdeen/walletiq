import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Wallet, Download, Check, Smartphone, Share, Plus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function Install() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const navigate = useNavigate();

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      toast.success('App installed successfully!');
    }
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in">
        <Button
          variant="ghost"
          className="mb-4 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to App
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary shadow-glow mb-4">
            <Wallet className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-2">Install House Expenses</h1>
          <p className="text-primary-foreground/70">Add to your home screen for quick access</p>
        </div>

        <Card className="glass border-border/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Install as App
            </CardTitle>
            <CardDescription>
              Get the full app experience on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isInstalled ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-success" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Already Installed!</p>
                  <p className="text-sm text-muted-foreground">
                    House Expenses is installed on your device
                  </p>
                </div>
                <Button onClick={() => navigate('/')} className="w-full">
                  Open App
                </Button>
              </div>
            ) : isInstallable ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Download className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Works Offline</p>
                      <p className="text-sm text-muted-foreground">Access your expenses anytime</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Smartphone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Native Feel</p>
                      <p className="text-sm text-muted-foreground">Full screen, fast loading</p>
                    </div>
                  </div>
                </div>
                <Button onClick={handleInstall} className="w-full" variant="gradient" size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Install Now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Install this app to your home screen for the best experience:
                </p>

                {isIOS ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">1</div>
                      <div className="flex items-center gap-2">
                        <span>Tap the</span>
                        <Share className="w-5 h-5 text-primary" />
                        <span>Share button</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">2</div>
                      <div className="flex items-center gap-2">
                        <span>Select</span>
                        <Plus className="w-5 h-5 text-primary" />
                        <span>Add to Home Screen</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">3</div>
                      <span>Tap "Add" to confirm</span>
                    </div>
                  </div>
                ) : isAndroid ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">1</div>
                      <span>Tap the browser menu (⋮)</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">2</div>
                      <span>Select "Install app" or "Add to Home screen"</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">3</div>
                      <span>Tap "Install" to confirm</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Use your browser's menu to add this app to your home screen or bookmarks.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-primary-foreground/50 text-sm mt-6">
          Currency: AED (Dubai Dirhams)
        </p>
      </div>
    </div>
  );
}
