import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, Play, Pause, RefreshCw, X, Globe, Sparkles, 
  CheckCircle, Radio, Award, AlertCircle
} from 'lucide-react';

const REGIONAL_SCRIPTS = {
  hi: {
    name: "हिंदी (Hindi)",
    locale: "hi-IN",
    welcome: "नमस्ते! यह आपका AI ग्रामीण व किसान ऋण मार्गदर्शक है।",
    script: (app) => `नमस्ते! आपका ऋण आवेदन मूल्यांकित हो चुका है। आपकी पात्रता संभावना लगभग ${(app?.approval_probability ? app.approval_probability * 100 : 92).toFixed(0)} प्रतिशत है। भारतीय स्टेट बैंक और बैंक ऑफ बड़ौदा की किसान योजनाओं से आपको 7 प्रतिशत की रियायती ब्याज दर पर सहायता मिल सकती है। समय पर भुगतान करने पर आपको सरकार की 3 प्रतिशत ब्याज सबवेंशन छूट का भी लाभ मिलेगा।`
  },
  mr: {
    name: "मराठी (Marathi)",
    locale: "mr-IN",
    welcome: "नमस्कार! हा तुमचा AI कृषी व ग्रामीण कर्ज सल्लागार आहे.",
    script: (app) => `नमस्कार! तुमच्या कर्ज अर्जाचे विश्लेषण पूर्ण झाले आहे. तुमची कर्ज मंजुरीची शक्यता अंदाजे ${(app?.approval_probability ? app.approval_probability * 100 : 92).toFixed(0)} टक्के आहे. स्टेट बँक ऑफ इंडिया आणि बँक ऑफ बडोदाच्या कृषी कर्ज योजनांमधून तुम्हाला 7 टक्के दराने कर्ज उपलब्ध होऊ शकते. वेळेवर परतफेड केल्यास 3 टक्के शासकीय अनुदान सवलत मिळेल.`
  },
  gu: {
    name: "ગુજરાતી (Gujarati)",
    locale: "gu-IN",
    welcome: "નમસ્તે! આ તમારું AI કિસાન લોન માર્ગદર્શક છે.",
    script: (app) => `નમસ્તે! તમારી લોન અરજી તપાસવામાં આવી છે. તમારી લોન મંજૂરીની સંભાવના ${(app?.approval_probability ? app.approval_probability * 100 : 92).toFixed(0)} ટકા છે. કિસાન ક્રેડિટ કાર્ડ યોજના દ્વારા તમને 4 ટકા અસરકારક વ્યાજ દરે કૃષિ ધિરાણ મળી શકે છે.`
  },
  bn: {
    name: "বাংলা (Bengali)",
    locale: "bn-IN",
    welcome: "নমস্কার! এটি আপনার এআই গ্রামীণ ও কৃষি ঋণ উপদেষ্টা।",
    script: (app) => `নমস্কার! আপনার ঋণ আবেদন সফলভাবে বিশ্লেষণ করা হয়েছে। আপনার ঋণ পাওয়ার সম্ভাবনা ${(app?.approval_probability ? app.approval_probability * 100 : 92).toFixed(0)} শতাংশ। কিষাণ ক্রেডিট কার্ড ও গ্রামীণ ব্যাংকের মাধ্যমে আপনি সহজ শর্তে ঋণ পেতে পারেন।`
  },
  ta: {
    name: "தமிழ் (Tamil)",
    locale: "ta-IN",
    welcome: "வணக்கம்! இது உங்கள் AI கிராமப்புற மற்றும் வேளாண் கடன் வழிகாட்டி.",
    script: (app) => `வணக்கம்! உங்கள் கடன் விண்ணப்பம் வெற்றிகரமாக பரிசீலிக்கப்பட்டது. உங்கள் கடன் ஒப்புதல் வாய்ப்பு ${(app?.approval_probability ? app.approval_probability * 100 : 92).toFixed(0)} சதவீதம். எஸ்பிஐ கிசான் திட்டத்தின் மூலம் குறைந்த வட்டியில் கடன் பெறலாம்.`
  },
  te: {
    name: "తెలుగు (Telugu)",
    locale: "te-IN",
    welcome: "నమస్కారం! ఇది మీ AI గ్రామీణ మరియు కిసాన్ రుణ సలహాదారు.",
    script: (app) => `నమస్కారం! మీ రుణ దరఖాస్తు పరిశీలించబడింది. మీ రుణ ఆమోద సంభావ్యత ${(app?.approval_probability ? app.approval_probability * 100 : 92).toFixed(0)} శాతం. కిసాన్ క్రెడిట్ కార్డు పథకం ద్వారా రాయితీ వడ్డీతో రుణం పొందవచ్చు.`
  },
  en: {
    name: "English",
    locale: "en-IN",
    welcome: "Hello! This is your Rural & Agricultural AI Financial Advisor.",
    script: (app) => `Hello! Your loan application has been analyzed. Your approval odds are approximately ${(app?.approval_probability ? app.approval_probability * 100 : 92).toFixed(0)} percent. You are strongly eligible for SBI Kisan Credit Card and Regional Rural Bank schemes at a subsidized 7.0 percent rate with a 3 percent prompt repayment rebate.`
  }
};

export default function VoiceGuideModal({ isOpen, onClose, applicationResult, defaultLanguage = "hi" }) {
  const [lang, setLang] = useState(defaultLanguage);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(0.95);

  const currentLangConfig = REGIONAL_SCRIPTS[lang] || REGIONAL_SCRIPTS.hi;
  const currentText = currentLangConfig.script(applicationResult);

  useEffect(() => {
    setLang(defaultLanguage);
  }, [defaultLanguage]);

  // Clean up speech on close or unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (!('speechSynthesis' in window)) {
      alert("Speech synthesis not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentText);
      utterance.rate = rate;
      utterance.lang = currentLangConfig.locale;

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(currentLangConfig.locale.slice(0, 2)));
      if (matchedVoice) utterance.voice = matchedVoice;

      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleLanguageChange = (newLang) => {
    if (isPlaying && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
    setLang(newLang);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#121824] border border-[#d2ff00]/40 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-5"
        >
          
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-[#1e2a3d] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#d2ff00] text-black flex items-center justify-center font-bold shadow-[0_0_15px_rgba(210,255,0,0.3)]">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Multi-Lingual Voice Guide (आवाज़ में समझें)
                </h3>
                <p className="text-xs text-slate-400 font-mono-tech">
                  Listen to personalized loan explanations in regional Indian languages
                </p>
              </div>
            </div>

            <button 
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setIsPlaying(false);
                onClose();
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2336] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Regional Language Selector Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono-tech text-slate-400 block uppercase">
              SELECT LANGUAGE (भाषा चुनें):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(REGIONAL_SCRIPTS).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => handleLanguageChange(key)}
                  className={`px-3 py-2 rounded-xl text-xs font-mono-tech font-bold text-center transition-all cursor-pointer border ${
                    lang === key 
                      ? 'bg-[#d2ff00] text-black border-[#d2ff00] shadow-[0_0_12px_rgba(210,255,0,0.3)]' 
                      : 'bg-[#0a0e17] text-slate-300 border-[#1e2a3d] hover:border-[#d2ff00]/40'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Spoken Text Card */}
          <div className="bg-[#0a0e17] p-4 rounded-xl border border-[#1e2a3d] space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono-tech">
              <span className="text-[#d2ff00] font-bold flex items-center gap-1.5">
                <Radio className="w-3 h-3 animate-pulse text-[#d2ff00]" /> {currentLangConfig.welcome}
              </span>
              <span className="text-slate-500">VOICE ENGINE ACTIVE</span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-sans font-light">
              "{currentText}"
            </p>

            {/* Audio Waveform Indicator */}
            {isPlaying && (
              <div className="flex items-center gap-1.5 pt-2">
                <span className="w-1 h-3 bg-[#d2ff00] animate-pulse rounded-full" />
                <span className="w-1 h-6 bg-[#d2ff00] animate-pulse delay-100 rounded-full" />
                <span className="w-1 h-4 bg-[#d2ff00] animate-pulse delay-200 rounded-full" />
                <span className="w-1 h-7 bg-[#d2ff00] animate-pulse delay-300 rounded-full" />
                <span className="w-1 h-3 bg-[#d2ff00] animate-pulse delay-150 rounded-full" />
                <span className="text-[11px] font-mono-tech text-[#d2ff00] ml-2">Speaking aloud...</span>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#162030] p-3 rounded-xl border border-[#1e2a3d]">
            
            {/* Speed Control */}
            <div className="flex items-center gap-2 text-xs font-mono-tech text-slate-400">
              <span>Speed:</span>
              <button 
                onClick={() => setRate(0.85)} 
                className={`px-2 py-0.5 rounded text-[10px] ${rate === 0.85 ? 'bg-[#d2ff00] text-black font-bold' : 'bg-[#0a0e17] text-slate-400'}`}
              >
                0.85x (Slow)
              </button>
              <button 
                onClick={() => setRate(1.0)} 
                className={`px-2 py-0.5 rounded text-[10px] ${rate === 1.0 ? 'bg-[#d2ff00] text-black font-bold' : 'bg-[#0a0e17] text-slate-400'}`}
              >
                1.0x (Normal)
              </button>
            </div>

            {/* Big Play Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTogglePlay}
              className={`btn-lime px-6 py-2.5 text-xs font-black shadow-[0_0_20px_rgba(210,255,0,0.3)] flex items-center gap-2 cursor-pointer ${
                isPlaying ? 'bg-amber-400 text-black' : ''
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'PAUSE VOICE' : 'PLAY AUDIO GUIDE'}</span>
            </motion.button>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
