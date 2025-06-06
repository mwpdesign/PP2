import { toast } from 'react-toastify';

export interface VoiceRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidenceThreshold: number;
  medicalTerminologyMode: boolean;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
  alternatives?: string[];
  medicalTermsDetected?: string[];
}

export interface VoiceToTextError {
  code: string;
  message: string;
  recoverable: boolean;
}

class VoiceToTextService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private config: VoiceRecognitionConfig;
  private onResult?: (result: TranscriptionResult) => void;
  private onError?: (error: VoiceToTextError) => void;
  private onEnd?: () => void;

  // Medical terminology dictionary for enhanced accuracy
  private medicalTerms = new Set([
    // Wound care specific terms
    'debridement', 'granulation', 'epithelialization', 'necrotic', 'slough',
    'eschar', 'exudate', 'maceration', 'undermining', 'tunneling',
    'biofilm', 'cellulitis', 'erythema', 'induration', 'purulent',

    // Anatomical terms
    'anterior', 'posterior', 'lateral', 'medial', 'proximal', 'distal',
    'superior', 'inferior', 'dorsal', 'ventral', 'bilateral', 'unilateral',

    // Medical conditions
    'diabetes', 'diabetic', 'neuropathy', 'ischemia', 'venous', 'arterial',
    'pressure ulcer', 'decubitus', 'stasis', 'lymphedema', 'osteomyelitis',

    // Measurements and assessments
    'centimeter', 'millimeter', 'length', 'width', 'depth', 'circumference',
    'erythematous', 'fluctuant', 'tender', 'non-tender', 'palpable',

    // Treatment terms
    'dressing', 'hydrocolloid', 'alginate', 'foam', 'transparent film',
    'negative pressure', 'compression', 'offloading', 'irrigation',

    // Common medical abbreviations (spelled out for recognition)
    'twice daily', 'three times daily', 'as needed', 'before meals',
    'after meals', 'at bedtime', 'every four hours', 'every six hours'
  ]);

  // Common medical phrases for context-aware corrections
  private medicalPhrases = new Map([
    ['wound bed', ['wound bad', 'wound bet', 'one bed']],
    ['granulation tissue', ['granulation issue', 'granular tissue']],
    ['epithelialization', ['epithelial', 'epithelial ization']],
    ['undermining', ['under mining', 'under meaning']],
    ['purulent drainage', ['purulent draining', 'pure drainage']],
    ['erythematous', ['erythema', 'red and swollen']],
    ['non-healing', ['not healing', 'non healing']],
    ['pressure ulcer', ['pressure sore', 'bed sore']],
    ['diabetic foot', ['diabetic feet', 'diabetes foot']],
    ['venous stasis', ['venus stasis', 'venous status']],
    ['arterial insufficiency', ['arterial insufficiency', 'artery insufficiency']],
    ['negative pressure therapy', ['negative pressure', 'vacuum therapy']],
    ['hydrocolloid dressing', ['hydro colloid', 'hydrocolloid']],
    ['alginate dressing', ['alginate', 'calcium alginate']],
    ['transparent film', ['transparent', 'clear film']],
    ['compression therapy', ['compression', 'compression bandage']],
    ['offloading device', ['off loading', 'pressure relief']],
    ['twice daily', ['two times daily', 'bid']],
    ['three times daily', ['three times a day', 'tid']],
    ['as needed', ['as necessary', 'prn']],
    ['centimeters', ['cm', 'centimeter']],
    ['millimeters', ['mm', 'millimeter']]
  ]);

  constructor(config: Partial<VoiceRecognitionConfig> = {}) {
    this.config = {
      language: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      confidenceThreshold: 0.7,
      medicalTerminologyMode: true,
      ...config
    };

    this.initializeRecognition();
  }

  private initializeRecognition(): void {
    if (!this.isSupported()) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results);
      const lastResult = results[results.length - 1];

      if (lastResult) {
        let transcript = lastResult[0].transcript;
        const confidence = lastResult[0].confidence;
        const isFinal = lastResult.isFinal;

        // Apply medical terminology corrections if enabled
        if (this.config.medicalTerminologyMode) {
          transcript = this.enhanceWithMedicalTerminology(transcript);
        }

        // Get alternatives
        const alternatives = Array.from(lastResult)
          .slice(1)
          .map(alt => alt.transcript)
          .filter(alt => alt !== transcript);

        // Detect medical terms
        const medicalTermsDetected = this.detectMedicalTerms(transcript);

        const result: TranscriptionResult = {
          text: transcript,
          confidence,
          isFinal,
          alternatives,
          medicalTermsDetected
        };

        // Only emit results above confidence threshold for final results
        if (!isFinal || confidence >= this.config.confidenceThreshold) {
          this.onResult?.(result);
        }
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const error: VoiceToTextError = {
        code: event.error,
        message: this.getErrorMessage(event.error),
        recoverable: this.isRecoverableError(event.error)
      };

      this.onError?.(error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd?.();
    };

    this.recognition.onstart = () => {
      this.isListening = true;
    };
  }

  private enhanceWithMedicalTerminology(text: string): string {
    let enhancedText = text.toLowerCase();

    // Apply medical phrase corrections
    for (const [correct, variations] of this.medicalPhrases) {
      for (const variation of variations) {
        const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        enhancedText = enhancedText.replace(regex, correct);
      }
    }

    // Capitalize medical terms properly
    for (const term of this.medicalTerms) {
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      enhancedText = enhancedText.replace(regex, term);
    }

    // Capitalize first letter of sentences
    enhancedText = enhancedText.replace(/(^|\. )([a-z])/g, (match, prefix, letter) =>
      prefix + letter.toUpperCase()
    );

    return enhancedText;
  }

  private detectMedicalTerms(text: string): string[] {
    const detected: string[] = [];
    const lowerText = text.toLowerCase();

    for (const term of this.medicalTerms) {
      if (lowerText.includes(term.toLowerCase())) {
        detected.push(term);
      }
    }

    return detected;
  }

  private getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected. Please try speaking again.',
      'aborted': 'Speech recognition was aborted.',
      'audio-capture': 'Audio capture failed. Please check your microphone.',
      'network': 'Network error occurred during speech recognition.',
      'not-allowed': 'Microphone access denied. Please allow microphone access.',
      'service-not-allowed': 'Speech recognition service not allowed.',
      'bad-grammar': 'Grammar error in speech recognition.',
      'language-not-supported': 'Language not supported for speech recognition.'
    };

    return errorMessages[errorCode] || `Speech recognition error: ${errorCode}`;
  }

  private isRecoverableError(errorCode: string): boolean {
    const recoverableErrors = ['no-speech', 'aborted', 'network'];
    return recoverableErrors.includes(errorCode);
  }

  public isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  public async testMicrophone(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone test failed:', error);
      return false;
    }
  }

  public startListening(
    onResult: (result: TranscriptionResult) => void,
    onError?: (error: VoiceToTextError) => void,
    onEnd?: () => void
  ): boolean {
    if (!this.recognition || this.isListening) {
      return false;
    }

    this.onResult = onResult;
    this.onError = onError;
    this.onEnd = onEnd;

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      return false;
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  public abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public updateConfig(newConfig: Partial<VoiceRecognitionConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.recognition) {
      this.recognition.lang = this.config.language;
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
    }
  }

  public getSupportedLanguages(): string[] {
    // Common languages supported by most browsers
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
      'es-ES', 'es-MX', 'fr-FR', 'de-DE', 'it-IT',
      'pt-BR', 'ru-RU', 'ja-JP', 'ko-KR', 'zh-CN'
    ];
  }

  public addMedicalTerms(terms: string[]): void {
    terms.forEach(term => this.medicalTerms.add(term.toLowerCase()));
  }

  public addMedicalPhrases(phrases: Record<string, string[]>): void {
    Object.entries(phrases).forEach(([correct, variations]) => {
      this.medicalPhrases.set(correct.toLowerCase(), variations.map(v => v.toLowerCase()));
    });
  }

  public getAnalytics(): {
    totalSessions: number;
    averageConfidence: number;
    medicalTermsRecognized: number;
    errorRate: number;
  } {
    // This would be implemented with actual analytics tracking
    // For now, return mock data
    return {
      totalSessions: 0,
      averageConfidence: 0.85,
      medicalTermsRecognized: 0,
      errorRate: 0.05
    };
  }
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default new VoiceToTextService();