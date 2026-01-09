import { useState, useCallback, useRef, useEffect } from 'react';
import {
  isSpeechRecognitionAvailable,
  startSpeechRecognition,
  stopSpeechRecognition,
} from '@/lib/speechRecognition';

export type VoiceInputStatus = 'idle' | 'listening' | 'processing' | 'error' | 'unsupported';

interface UseVoiceInputOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  language?: string;
  continuous?: boolean;
}

interface UseVoiceInputReturn {
  status: VoiceInputStatus;
  transcript: string;
  error: string | null;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const { onResult, onError, language = 'en-US' } = options;

  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const languageRef = useRef(language);

  // Keep refs up to date
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Check availability on mount
  useEffect(() => {
    let mounted = true;
    isSpeechRecognitionAvailable().then((available) => {
      if (mounted) {
        setIsSupported(available);
        if (!available) {
          setStatus('unsupported');
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition is not supported on this device');
      setStatus('unsupported');
      return;
    }

    console.log('[useVoiceInput] Starting listening, language:', languageRef.current);
    setTranscript('');
    setError(null);

    try {
      await startSpeechRecognition(languageRef.current, {
        onStart: () => {
          console.log('[useVoiceInput] Recognition started');
          setStatus('listening');
          setError(null);
        },
        onEnd: () => {
          console.log('[useVoiceInput] Recognition ended');
          setStatus((prev) => (prev === 'listening' ? 'idle' : prev));
        },
        onResult: (result) => {
          console.log('[useVoiceInput] Result:', result);
          setTranscript(result.transcript);

          if (result.isFinal) {
            setStatus('processing');
            onResultRef.current?.(result.transcript);
            setTimeout(() => setStatus('idle'), 500);
          }
        },
        onError: (errorMsg) => {
          console.error('[useVoiceInput] Error:', errorMsg);
          setError(errorMsg);
          setStatus('error');
          onErrorRef.current?.(errorMsg);
        },
      });
    } catch (err: any) {
      console.error('[useVoiceInput] Start error:', err);
      setError(err.message || 'Failed to start speech recognition');
      setStatus('error');
    }
  }, [isSupported]);

  const stopListening = useCallback(async () => {
    console.log('[useVoiceInput] Stopping listening...');
    try {
      await stopSpeechRecognition();
    } catch (err) {
      console.warn('[useVoiceInput] Stop error:', err);
    }
    setStatus('idle');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
    setStatus('idle');
  }, []);

  return {
    status,
    transcript,
    error,
    isListening: status === 'listening',
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  };
}
