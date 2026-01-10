/**
 * Cross-platform speech recognition abstraction.
 * Uses native Capacitor plugin on Android/iOS, falls back to Web Speech API on web.
 */

import { isNativePlatform } from './capacitor';

// Types
export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
}

let nativePlugin: typeof import('@capacitor-community/speech-recognition').SpeechRecognition | null = null;
let nativeListenerCleanup: (() => Promise<void>) | null = null;
let activeEngine: 'native' | 'web' | null = null;

/**
 * Get the currently active speech recognition engine
 */
export function getActiveEngine(): 'native' | 'web' | null {
  return activeEngine;
}

/**
 * Check if speech recognition is available on this platform
 */
export async function isSpeechRecognitionAvailable(): Promise<boolean> {
  // Check native platform first
  if (isNativePlatform()) {
    try {
      const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
      const { available } = await SpeechRecognition.available();
      return available;
    } catch (e) {
      console.warn('[SpeechRecognition] Native plugin not available, falling back to web:', e);
      // Fall through to web check
    }
  }
  
  // Web Speech API check
  try {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return !!SpeechRecognition;
  } catch (e) {
    console.error('[SpeechRecognition] Web API check failed:', e);
    return false;
  }
}

/**
 * Request microphone permissions (native only, web handles this automatically)
 */
export async function requestSpeechPermissions(): Promise<boolean> {
  if (isNativePlatform()) {
    try {
      const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
      const result = await SpeechRecognition.requestPermissions();
      return result.speechRecognition === 'granted';
    } catch (e) {
      console.error('[SpeechRecognition] Permission request failed:', e);
      return false;
    }
  }
  // Web handles permissions automatically when starting
  return true;
}

/**
 * Start speech recognition
 */
export async function startSpeechRecognition(
  language: string,
  callbacks: SpeechRecognitionCallbacks
): Promise<void> {
  // Try native first if on native platform
  if (isNativePlatform()) {
    try {
      activeEngine = 'native';
      await startNativeSpeechRecognition(language, callbacks);
      return;
    } catch (e) {
      console.warn('[SpeechRecognition] Native failed, falling back to web:', e);
      activeEngine = null;
    }
  }
  
  // Web fallback
  activeEngine = 'web';
  startWebSpeechRecognition(language, callbacks);
}

/**
 * Stop speech recognition
 */
export async function stopSpeechRecognition(): Promise<void> {
  // Try to stop both - one will work depending on which is active
  if (isNativePlatform()) {
    try {
      await stopNativeSpeechRecognition();
    } catch (e) {
      console.warn('[SpeechRecognition] Native stop failed:', e);
    }
  }
  
  // Always try to stop web as well (safe to call even if not running)
  stopWebSpeechRecognition();
  activeEngine = null;
}

// ============ Native Implementation ============

async function startNativeSpeechRecognition(
  language: string,
  callbacks: SpeechRecognitionCallbacks
): Promise<void> {
  try {
    const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
    nativePlugin = SpeechRecognition;

    // Request permissions first
    const permResult = await SpeechRecognition.requestPermissions();
    if (permResult.speechRecognition !== 'granted') {
      callbacks.onError?.('Microphone permission denied');
      return;
    }

    // Check availability
    const { available } = await SpeechRecognition.available();
    if (!available) {
      callbacks.onError?.('Speech recognition not available on this device');
      return;
    }

    // Set up listeners
    await SpeechRecognition.removeAllListeners();

    // Listen for partial results
    SpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
      console.log('[SpeechRecognition] Native: Partial results:', data.matches);
      if (data.matches && data.matches.length > 0) {
        callbacks.onResult?.({
          transcript: data.matches[0],
          isFinal: false,
        });
      }
    });

    // Listen for listening state changes
    SpeechRecognition.addListener('listeningState', (data: { status: 'started' | 'stopped' }) => {
      console.log('[SpeechRecognition] Native: Listening state:', data.status);
      if (data.status === 'started') {
        callbacks.onStart?.();
      } else if (data.status === 'stopped') {
        callbacks.onEnd?.();
      }
    });

    nativeListenerCleanup = async () => {
      await SpeechRecognition.removeAllListeners();
    };

    // Start listening - get results when stopped
    console.log('[SpeechRecognition] Native: Starting with language:', language);
    callbacks.onStart?.();
    
    const result = await SpeechRecognition.start({
      language,
      partialResults: true,
      popup: false,
    });

    // If we get results here (when partialResults is false or on stop), handle them
    if (result.matches && result.matches.length > 0) {
      console.log('[SpeechRecognition] Native: Final results:', result.matches);
      callbacks.onResult?.({
        transcript: result.matches[0],
        isFinal: true,
      });
    }

    callbacks.onEnd?.();
  } catch (error: any) {
    console.error('[SpeechRecognition] Native start error:', error);
    callbacks.onError?.(error.message || 'Failed to start speech recognition');
  }
}

async function stopNativeSpeechRecognition(): Promise<void> {
  try {
    if (nativePlugin) {
      // Get final results before stopping
      const result = await nativePlugin.stop();
      console.log('[SpeechRecognition] Native: Stopped, final results:', result);
      
      if (nativeListenerCleanup) {
        await nativeListenerCleanup();
        nativeListenerCleanup = null;
      }
    }
  } catch (error) {
    console.error('[SpeechRecognition] Native stop error:', error);
  }
}

// ============ Web Implementation ============

let webRecognition: any = null;

function startWebSpeechRecognition(
  language: string,
  callbacks: SpeechRecognitionCallbacks
): void {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    callbacks.onError?.('Speech recognition not supported in this browser');
    return;
  }

  // Stop any existing recognition
  if (webRecognition) {
    try {
      webRecognition.abort();
    } catch (e) {
      // Ignore
    }
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = language;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    console.log('[SpeechRecognition] Web: Started, language:', language);
    callbacks.onStart?.();
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

    if (finalTranscript) {
      console.log('[SpeechRecognition] Web: Final result:', finalTranscript);
      callbacks.onResult?.({
        transcript: finalTranscript.trim(),
        isFinal: true,
      });
    } else if (interimTranscript) {
      callbacks.onResult?.({
        transcript: interimTranscript,
        isFinal: false,
      });
    }
  };

  recognition.onerror = (event: any) => {
    console.error('[SpeechRecognition] Web: Error:', event.error);
    let errorMessage = 'Speech recognition error';

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
        callbacks.onEnd?.();
        return;
    }

    callbacks.onError?.(errorMessage);
  };

  recognition.onend = () => {
    console.log('[SpeechRecognition] Web: Ended');
    callbacks.onEnd?.();
  };

  webRecognition = recognition;

  try {
    recognition.start();
  } catch (err: any) {
    console.warn('[SpeechRecognition] Web: Start error, retrying:', err.message);
    try {
      recognition.stop();
      setTimeout(() => {
        recognition.start();
      }, 100);
    } catch (e) {
      callbacks.onError?.('Failed to start speech recognition');
    }
  }
}

function stopWebSpeechRecognition(): void {
  if (webRecognition) {
    try {
      webRecognition.stop();
    } catch (e) {
      console.warn('[SpeechRecognition] Web: Stop error:', e);
    }
    webRecognition = null;
  }
}
