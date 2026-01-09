import { useState, useCallback, useRef, useEffect } from 'react';
import { isSpeechRecognitionSupported } from '@/lib/voiceExpenseParser';

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
  const { onResult, onError, language = 'en-US', continuous = false } = options;
  
  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const isSupported = isSpeechRecognitionSupported();

  // Initialize speech recognition
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Initialize speech recognition - only recreate when language changes
  useEffect(() => {
    if (!isSupported) {
      setStatus('unsupported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setStatus('unsupported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('[VoiceInput] Recognition started, language:', language);
      setStatus('listening');
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      console.log('[VoiceInput] Transcript:', { interim: interimTranscript, final: finalTranscript });
      setTranscript(currentTranscript);

      if (finalTranscript) {
        console.log('[VoiceInput] Final transcript received:', finalTranscript.trim());
        setStatus('processing');
        // Use ref to call the latest callback
        onResultRef.current?.(finalTranscript.trim());
        // Reset to idle after processing
        setTimeout(() => setStatus('idle'), 500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[VoiceInput] Error:', event.error);
      let errorMessage = 'An error occurred during speech recognition';
      
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          errorMessage = 'Microphone access denied. Please enable microphone permission.';
          break;
        case 'no-speech':
          errorMessage = "Couldn't hear anything. Please try speaking again.";
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your audio device.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'aborted':
          // User cancelled - not an error
          setStatus('idle');
          return;
      }
      
      setError(errorMessage);
      setStatus('error');
      onErrorRef.current?.(errorMessage);
    };

    recognition.onend = () => {
      console.log('[VoiceInput] Recognition ended');
      // Only reset to idle if we're still listening (not if we got a result)
      setStatus(prev => prev === 'listening' ? 'idle' : prev);
    };

    recognitionRef.current = recognition;

    return () => {
      console.log('[VoiceInput] Cleaning up recognition');
      try {
        recognition.abort();
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [isSupported, language, continuous]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      setStatus('unsupported');
      return;
    }

    if (!recognitionRef.current) {
      console.error('[VoiceInput] Recognition not initialized');
      return;
    }

    console.log('[VoiceInput] Starting listening...');
    setTranscript('');
    setError(null);

    try {
      recognitionRef.current.start();
    } catch (err: any) {
      // Recognition may already be running - try stopping and restarting
      console.warn('[VoiceInput] Start error, attempting restart:', err.message);
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current?.start();
        }, 100);
      } catch (e) {
        console.error('[VoiceInput] Failed to restart:', e);
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    console.log('[VoiceInput] Stopping listening...');
    try {
      recognitionRef.current?.stop();
    } catch (err) {
      console.warn('[VoiceInput] Stop error:', err);
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
