import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
    if (isListening) return `Listening in ${currentLanguage.nativeName}... Click to stop`;
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
          <div className={cn('relative inline-flex', className)}>
            {/* Pulse animation ring */}
            {showPulse && (
              <span className="absolute inset-0 rounded-md animate-ping bg-primary/30" />
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
