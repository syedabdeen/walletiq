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
  const isSupported = isSpeechRecognitionSupported();

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) {
      setStatus('unsupported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
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
      setTranscript(currentTranscript);

      if (finalTranscript) {
        setStatus('processing');
        onResult?.(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
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
      onError?.(errorMessage);
    };

    recognition.onend = () => {
      if (status === 'listening') {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isSupported, language, continuous, onResult, onError, status]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      setStatus('unsupported');
      return;
    }

    setTranscript('');
    setError(null);

    try {
      recognitionRef.current?.start();
    } catch (err) {
      // Recognition may already be running
      console.warn('Speech recognition start error:', err);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch (err) {
      console.warn('Speech recognition stop error:', err);
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
