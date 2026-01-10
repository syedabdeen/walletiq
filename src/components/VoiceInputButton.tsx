import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, AlertCircle, Globe, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useVoiceInput, VoiceInputStatus } from '@/hooks/useVoiceInput';
import { parseVoiceExpense, ParsedExpense } from '@/lib/voiceExpenseParser';
import { useVoiceLanguage } from '@/hooks/useVoiceLanguage';
import { toast } from 'sonner';

interface VoiceInputButtonProps {
  categories: Array<{ id: string; name: string }>;
  defaultCurrency?: string;
  onParsedExpense: (expense: ParsedExpense) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInputButton({
  categories,
  defaultCurrency,
  onParsedExpense,
  disabled = false,
  className,
}: VoiceInputButtonProps) {
  const [showPulse, setShowPulse] = useState(false);
  const { voiceLanguage, currentLanguage } = useVoiceLanguage();

  const handleResult = (transcript: string) => {
    console.log('[VoiceInputButton] Received transcript:', transcript);
    console.log('[VoiceInputButton] Categories available:', categories.length);
    
    const parsed = parseVoiceExpense(transcript, categories, defaultCurrency);
    console.log('[VoiceInputButton] Parsed result:', parsed);
    
    if (parsed.amount) {
      console.log('[VoiceInputButton] Calling onParsedExpense with:', parsed);
      onParsedExpense(parsed);
      toast.success('Voice input processed', {
        description: `"${transcript}"`,
      });
    } else {
      console.warn('[VoiceInputButton] No amount detected in:', transcript);
      toast.error("Couldn't understand clearly", {
        description: 'Please try again or enter manually.',
      });
    }
  };

  const handleError = (error: string) => {
    toast.error('Voice input error', {
      description: error,
    });
  };

  const {
    status,
    isListening,
    startListening,
    stopListening,
    isSupported,
    activeEngine,
  } = useVoiceInput({
    onResult: handleResult,
    onError: handleError,
    language: voiceLanguage,
  });

  // Pulse animation when listening
  useEffect(() => {
    setShowPulse(isListening);
  }, [isListening]);

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'listening':
        return <Mic className="h-4 w-4" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'unsupported':
        return <MicOff className="h-4 w-4" />;
      default:
        return <Mic className="h-4 w-4" />;
    }
  };

  const getTooltipText = (): string => {
    if (!isSupported) return 'Voice input not supported in this browser';
    if (isListening) {
      const engineLabel = activeEngine === 'native' ? '📱 Native' : '🌐 Web';
      return `${engineLabel} • Listening in ${currentLanguage.nativeName}... Click to stop`;
    }
    if (status === 'processing') return 'Processing...';
    if (status === 'error') return 'Try again';
    return `Speak your expense in ${currentLanguage.nativeName}`;
  };

  const getButtonVariant = (): 'outline' | 'destructive' | 'default' => {
    if (status === 'error') return 'destructive';
    if (isListening) return 'default';
    return 'outline';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('relative inline-flex items-center gap-1.5', className)}>
            {/* Engine indicator badge */}
            {isListening && activeEngine && (
              <Badge 
                variant="secondary" 
                className={cn(
                  'h-6 px-1.5 text-[10px] font-medium animate-in fade-in-0 slide-in-from-left-2 duration-200',
                  activeEngine === 'native' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                )}
              >
                {activeEngine === 'native' ? (
                  <Smartphone className="h-3 w-3" />
                ) : (
                  <Globe className="h-3 w-3" />
                )}
              </Badge>
            )}
            
            {/* Pulse animation ring */}
            {showPulse && (
              <span className="absolute right-0 inset-y-0 w-9 rounded-md animate-ping bg-primary/30" />
            )}
            <Button
              type="button"
              variant={getButtonVariant()}
              size="icon"
              onClick={handleClick}
              disabled={disabled || !isSupported || status === 'processing'}
              className={cn(
                'relative z-10 transition-all duration-200',
                isListening && 'bg-primary text-primary-foreground ring-2 ring-primary/50',
                status === 'error' && 'bg-destructive text-destructive-foreground'
              )}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            >
              {getStatusIcon()}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
