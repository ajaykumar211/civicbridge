import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Globe, AlertCircle } from "lucide-react";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi (हिंदी)" },
  { code: "kn-IN", label: "Kannada (ಕನ್ನಡ)" },
  { code: "ta-IN", label: "Tamil (தமிழ்)" },
  { code: "te-IN", label: "Telugu (తెలుగు)" },
  { code: "ml-IN", label: "Malayalam (മലയാളം)" },
];

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript, className = "" }) => {
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onresult = (event: any) => {
        let finalChunk = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript + " ";
          }
        }
        if (finalChunk.trim()) {
          onTranscript(finalChunk.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [selectedLang, onTranscript]);

  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Could not start speech recognition:", err);
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
        <span>Voice dictation requires Web Speech API support</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select
        value={selectedLang}
        onChange={(e) => setSelectedLang(e.target.value)}
        aria-label="Select voice input language"
        className="text-xs bg-white border border-slate-200 text-slate-700 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={toggleListening}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          isListening
            ? "bg-rose-500 text-white shadow-sm ring-2 ring-rose-300"
            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
        }`}
        title={isListening ? "Stop listening" : "Start speaking your complaint"}
      >
        {isListening ? (
          <>
            <MicOff className="w-3.5 h-3.5 animate-pulse" />
            <span>Listening...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5" />
            <span>Speak complaint</span>
          </>
        )}
      </button>
    </div>
  );
};
