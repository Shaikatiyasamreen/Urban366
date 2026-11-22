import React, { useState, useEffect } from 'react';
import { Mic, MicOff, X, Sparkles, Volume2, ArrowRight } from 'lucide-react';

export default function VoiceSearchModal({ 
  isOpen, 
  onClose, 
  onVoiceResult 
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [recognitionInstance, setRecognitionInstance] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (e) {}
      }
      setIsListening(false);
      setTranscript('');
      setErrorNotice('');
      return;
    }

    // Check Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorNotice('Voice search is not natively supported by your browser. You can type in the search bar or use sample voice queries below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // English (India) for accurate Bengaluru pronunciation

      recognition.onstart = () => {
        setIsListening(true);
        setErrorNotice('');
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
        if (event.results[current].isFinal) {
          setTimeout(() => {
            onVoiceResult(text);
            onClose();
          }, 700);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorNotice('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else {
          setErrorNotice('Could not capture audio clearly. Please try speaking again.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognitionInstance(recognition);
      recognition.start();

    } catch (err) {
      setErrorNotice('Failed to initialize microphone.');
      setIsListening(false);
    }

    return () => {
      if (recognitionInstance) {
        try { recognitionInstance.stop(); } catch (e) {}
      }
    };
  }, [isOpen]);

  const handleRestartListening = () => {
    setErrorNotice('');
    setTranscript('');
    if (recognitionInstance) {
      try {
        recognitionInstance.start();
        setIsListening(true);
      } catch (e) {
        try {
          recognitionInstance.stop();
          setTimeout(() => recognitionInstance.start(), 200);
        } catch (err) {}
      }
    }
  };

  const sampleVoiceQueries = [
    'AC Powerjet service',
    'Deep bathroom cleaning',
    'Salon for women facial',
    'Plumber tap repair',
    'Men haircut fade',
    'Sofa cleaning'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col p-6 sm:p-8 text-center relative">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Eyebrow */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-violet-700 uppercase tracking-widest mb-3">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>Urbab366 AI Voice Search</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          {isListening ? 'Listening to your voice...' : transcript ? 'Speech recognized!' : 'Tap mic to speak'}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Say any service name, category, or problem in Bengaluru
        </p>

        {/* Pulsing Mic Visualization */}
        <div className="my-8 flex flex-col items-center justify-center">
          <div className="relative">
            {isListening && (
              <>
                <div className="absolute -inset-4 rounded-full bg-violet-500/20 animate-ping" />
                <div className="absolute -inset-8 rounded-full bg-emerald-500/10 animate-pulse" />
              </>
            )}
            <button
              onClick={handleRestartListening}
              className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform hover:scale-105 active:scale-95 ${
                isListening 
                  ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 ring-4 ring-violet-300' 
                  : 'bg-slate-800 hover:bg-slate-900'
              }`}
            >
              <Mic className={`w-10 h-10 ${isListening ? 'animate-bounce text-emerald-300' : 'text-white'}`} />
            </button>
          </div>

          {/* Sound wave bars simulation when listening */}
          {isListening && (
            <div className="flex items-center gap-1.5 mt-5 h-6">
              {[40, 75, 100, 60, 90, 45, 80, 50, 95, 65].map((h, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-violet-600 rounded-full animate-pulse" 
                  style={{ 
                    height: `${h}%`,
                    animationDelay: `${i * 80}ms`,
                    animationDuration: '600ms'
                  }} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Transcript Box */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 min-h-[64px] flex items-center justify-center">
          {transcript ? (
            <p className="text-base sm:text-lg font-bold text-violet-900 animate-fade-in">
              "{transcript}"
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-slate-400 italic">
              {isListening ? 'Speak now into your microphone...' : 'e.g. "I need tap repair" or "Book facial"'}
            </p>
          )}
        </div>

        {errorNotice && (
          <p className="mt-3 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
            {errorNotice}
          </p>
        )}

        {/* Quick Suggestion Chips */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-left">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Or tap to search popular requests:
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleVoiceQueries.map((query, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onVoiceResult(query);
                  onClose();
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-violet-100 hover:text-violet-900 border border-slate-200 rounded-full text-xs font-medium text-slate-700 transition-colors flex items-center gap-1.5 group"
              >
                <span>{query}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
