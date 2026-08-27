import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, Play, Pause, X, Radio, CheckCircle, AlertTriangle, ShieldCheck, Sparkles
} from 'lucide-react';

const PURPOSE_TRANSLATIONS = {
  "Kisan Agri Crop / Seeds": {
    en: "Kisan Crop & Seeds",
    hi: "किसान कृषि फसल व बीज",
    mr: "शेतकरी पीक व बियाणे",
    gu: "કિસાન પાક અને બિયારણ",
    bn: "কিষাণ ফসল ও বীজ",
    ta: "வேளாண் பயிர் மற்றும் விதைகள்",
    te: "కిసాన్ పంట మరియు విత్తనాలు"
  },
  "Tractor & Farm Equipment": {
    en: "Tractor & Farm Equipment",
    hi: "ट्रैक्टर व आधुनिक कृषि उपकरण",
    mr: "ट्रॅक्टर व शेती अवजारे",
    gu: "ટ્રેક્ટર અને કૃષિ સાધનો",
    bn: "ট্র্যাক্টর ও কৃষি যন্ত্রপাতি",
    ta: "டிராக்டர் மற்றும் பண்ணை உபகரணங்கள்",
    te: "ట్రాక్టర్ మరియు వ్యవసాయ యంత్రాలు"
  },
  "Village Kirana / Rural MSME": {
    en: "Village Kirana & Rural Small Business",
    hi: "ग्रामीण किराना व दुकान व्यापार",
    mr: "ग्रामीण किराणा व दुकान व्यवसाय",
    gu: "ગ્રામીણ કરિયાણું અને વ્યવસાય",
    bn: "গ্রামীণ মুদি ও ব্যবসা",
    ta: "கிராமப்புற மளிகை மற்றும் சிறு தொழில்",
    te: "గ్రామ కిరాణా మరియు వ్యాపారం"
  },
  "Dairy & Livestock": {
    en: "Dairy & Livestock Development",
    hi: "डेयरी व पशुपालन विकास",
    mr: "दुग्धव्यवसाय व पशुपालन",
    gu: "ડેરી અને પશુપાલન",
    bn: "ডেইরি ও পশুপালন",
    ta: "பால் பண்ணை மற்றும் கால்நடை பராமரிப்பு",
    te: "పాడి మరియు పశుసంవర్ధక అభివృద్ధి"
  },
  "Rural Housing (PMAY-G)": {
    en: "Rural Housing (PMAY-G)",
    hi: "ग्रामीण पक्का आवास",
    mr: "ग्रामीण पक्के घर",
    gu: "ગ્રામીણ પાકું મકાન",
    bn: "গ্রামীণ পাকা বাড়ি",
    ta: "கிராமப்புற கான்கிரீட் வீடு",
    te: "గ్రామీణ పక్కా ఇల్లు"
  },
  "Informal Moneylender Debt-Swap": {
    en: "Moneylender Debt-Swap (Sahukar Mukti)",
    hi: "साहूकार कर्ज मुक्ति",
    mr: "सावकार कर्जमुक्ती",
    gu: "શાહુકાર દેવા મુક્તિ",
    bn: "মহাজন ঋণ মুক্তি",
    ta: "கந்துவட்டி கடன் மீட்பு",
    te: "వడ్డీ వ్యాపారుల రుణ విముక్తి"
  },
  "Personal": {
    en: "Personal & Emergency Medical",
    hi: "व्यक्तिगत व आपातकालीन खर्च",
    mr: "वैयक्तिक खर्च",
    gu: "વ્યક્તિગત ખર્ચ",
    bn: "ব্যক্তিগত খরচ",
    ta: "தனிநபர் செலவு",
    te: "వ్యక్తిగత ఖర్చులు"
  }
};

const NUMBER_WORDS_HI = {
  90: "नब्बे", 91: "इक्यानवे", 92: "बानवे", 93: "तिरानवे", 94: "चौरानवे", 95: "पंचानवे", 96: "छियानवे", 97: "सत्तानवे", 98: "अट्ठानवे", 99: "निन्यानवे", 100: "सौ",
  80: "अस्सी", 81: "इक्यासी", 82: "बयासी", 83: "तिरासी", 84: "चौरासी", 85: "पचासी", 86: "छियासी", 87: "सत्तासी", 88: "अट्ठासी", 89: "नवासी",
  70: "सत्तर", 71: "इकहत्तर", 72: "बहत्तर", 73: "तिहत्तर", 74: "चौहत्तर", 75: "पचहत्तर", 76: "छिहत्तर", 77: "सतहत्तर", 78: "अठहत्तर", 79: "उनासी",
  60: "साठ", 65: "पैंसठ", 50: "पचास", 55: "पचपन", 40: "चालीस", 42: "बयालीस", 45: "पैंतालीस", 35: "पैंतीस", 38: "अड़तीस", 30: "तीस", 25: "पच्चीस", 20: "बीस"
};

const NUMBER_WORDS_MR = {
  90: "नव्वद", 91: "एक्याण्णव", 92: "ब्याण्णव", 93: "त्र्याण्णव", 94: "चौऱ्याण्णव", 95: "पंच्याण्णव", 96: "शहाण्णव", 97: "सत्त्याण्णव", 98: "अठ्ठ्याण्णव", 99: "नव्व्याण्णव", 100: "शंभर",
  80: "ऐंशी", 85: "पंच्याऐंशी", 70: "सत्तर", 75: "पंच्याहत्तर", 60: "साठ", 50: "पन्नास", 40: "चाळीस", 35: "पस्तीस", 30: "तीस"
};

const NUMBER_WORDS_EN = {
  90: "ninety", 91: "ninety-one", 92: "ninety-two", 93: "ninety-three", 94: "ninety-four", 95: "ninety-five",
  85: "eighty-five", 88: "eighty-eight", 80: "eighty", 75: "seventy-five", 70: "seventy", 65: "sixty-five",
  60: "sixty", 50: "fifty", 45: "forty-five", 40: "forty", 38: "thirty-eight", 35: "thirty-five", 30: "thirty"
};

const REGIONAL_METADATA = {
  hi: { name: "हिंदी (Hindi)", locale: "hi", welcome: "नमस्ते! यह आपका AI व्यक्तिगत ग्रामीण ऋण मार्गदर्शक है।" },
  mr: { name: "मराठी (Marathi)", locale: "mr", welcome: "नमस्कार! हा तुमचा AI वैयक्तिक कृषी व ग्रामीण कर्ज सल्लागार आहे." },
  gu: { name: "ગુજરાતી (Gujarati)", locale: "gu", welcome: "નમસ્તે! આ તમારું AI કિસાન લોન માર્ગદર્શક છે." },
  bn: { name: "বাংলা (Bengali)", locale: "bn", welcome: "নমস্কার! এটি আপনার এআই ব্যক্তিগত গ্রামীণ ও কৃষি ঋণ উপদেষ্টা।" },
  ta: { name: "தமிழ் (Tamil)", locale: "ta", welcome: "வணக்கம்! இது உங்கள் AI தனிப்பயனாக்கப்பட்ட கடன் வழிகாட்டி." },
  te: { name: "తెలుగు (Telugu)", locale: "te", welcome: "నమస్కారం! ఇది మీ AI వ్యక్తిగతీకరించిన కిసాన్ రుణ సలహాదారు." },
  en: { name: "English", locale: "en", welcome: "Hello! This is your Personalized Rural & Agricultural AI Loan Advisor." }
};

export default function VoiceGuideModal({ 
  isOpen, 
  onClose, 
  applicationResult, 
  formData, 
  userProfile, 
  coachData, 
  defaultLanguage = "hi", 
  onLanguageSelect 
}) {
  const [lang, setLang] = useState(defaultLanguage);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [backendScript, setBackendScript] = useState(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  // Sync default language on change
  useEffect(() => {
    setLang(defaultLanguage);
  }, [defaultLanguage]);

  // Extract real live parameters
  const borrowerName = userProfile?.full_name || "Applicant";
  const loanAmount = formData?.loan_amount || 250000;
  const loanPurposeKey = formData?.loan_purpose || "Kisan Agri Crop / Seeds";
  const probPct = applicationResult?.approval_probability != null 
    ? Math.round(applicationResult.approval_probability * 100) 
    : 85;
  const riskTier = applicationResult?.risk_tier || (probPct >= 70 ? "Low Risk" : probPct >= 45 ? "Moderate Risk" : "High Risk");
  const status = applicationResult?.status || (probPct >= 70 ? "APPROVED" : probPct >= 45 ? "NEEDS_REVIEW" : "REJECTED");
  
  const topBank = applicationResult?.bank_recommendations?.[0] || {
    bank_name: "State Bank of India (Kisan Credit Card)",
    base_interest_rate: 7.0,
    estimated_monthly_emi: 4500
  };

  // Build Real-Time Client-Side Dynamic Script (100% Data-Driven fallback)
  const buildDataDrivenScript = (targetLang) => {
    const purposeDict = PURPOSE_TRANSLATIONS[loanPurposeKey] || PURPOSE_TRANSLATIONS["Personal"];
    const purposeText = purposeDict[targetLang] || purposeDict["en"];
    const amtLakh = (loanAmount / 100000).toFixed(1);
    const amtStrLakh = amtLakh >= 1 ? `${amtLakh} लाख रुपये` : `₹${loanAmount.toLocaleString('en-IN')}`;
    const amtStrEn = amtLakh >= 1 ? `${amtLakh} Lakh Rupees` : `₹${loanAmount.toLocaleString('en-IN')}`;
    
    const probWordHi = NUMBER_WORDS_HI[probPct] || `${probPct}`;
    const probWordMr = NUMBER_WORDS_MR[probPct] || `${probPct}`;
    const probWordEn = NUMBER_WORDS_EN[probPct] || `${probPct}`;

    const rateHi = NUMBER_WORDS_HI[Math.round(topBank.base_interest_rate)] || `${Math.round(topBank.base_interest_rate)}`;
    const rateMr = NUMBER_WORDS_MR[Math.round(topBank.base_interest_rate)] || `${Math.round(topBank.base_interest_rate)}`;
    const rateEn = NUMBER_WORDS_EN[Math.round(topBank.base_interest_rate)] || `${Math.round(topBank.base_interest_rate)}`;

    if (targetLang === 'hi') {
      if (probPct >= 70) {
        return `नमस्ते ${borrowerName} जी! आपके ${amtStrLakh} के ${purposeText} ऋण आवेदन का विश्लेषण पूरा हो चुका है। आपकी पात्रता संभावना लगभग ${probWordHi} प्रतिशत है, जो उत्कृष्ट श्रेणी में आती है। आपके लिए ${topBank.bank_name} की योजना सबसे उपयुक्त है, जिसमें लगभग ${rateHi} प्रतिशत रियायती ब्याज दर पर ऋण मिल सकता है। समय पर भुगतान करने पर सरकार की तीन प्रतिशत ब्याज छूट का भी लाभ मिलेगा।`;
      } else if (probPct >= 45) {
        return `नमस्ते ${borrowerName} जी! आपके ${amtStrLakh} के ${purposeText} ऋण आवेदन में पात्रता संभावना ${probWordHi} प्रतिशत है। आपके मौजूदा वित्तीय अनुपात के अनुसार ${topBank.bank_name} से लगभग ${rateHi} प्रतिशत दर पर ऋण मिल सकता है। ऋण की शर्तों को और बेहतर बनाने के लिए अपने मौजूदा छोटे बकाये को समय से पहले चुकाएं।`;
      } else {
        return `नमस्ते ${borrowerName} जी! आपके ${amtStrLakh} के ${purposeText} ऋण आवेदन में वर्तमान पात्रता संभावना ${probWordHi} प्रतिशत है। आपकी मुख्य रुकावट मौजूदा कर्ज भार है। हमारी सलाह है कि अपने पुराने कर्ज कम करें ताकि आपको ${topBank.bank_name} से आसान किश्तों पर ऋण मिल सके।`;
      }
    } else if (targetLang === 'mr') {
      if (probPct >= 70) {
        return `नमस्कार ${borrowerName}! तुमच्या ${amtStrLakh} च्या ${purposeText} कर्ज अर्जाचे विश्लेषण पूर्ण झाले आहे. तुमची कर्ज मंजुरीची शक्यता अंदाजे ${probWordMr} टक्के आहे. तुम्हाला ${topBank.bank_name} मधून ${rateMr} टक्के सवलतीच्या दराने कर्ज मिळू शकते. वेळेवर परतफेड करून शासकीय अनुदानाचा नक्की लाभ घ्या.`;
      } else {
        return `नमस्कार ${borrowerName}! तुमच्या ${amtStrLakh} च्या ${purposeText} कर्ज अर्जाची मंजुरी शक्यता ${probWordMr} टक्के आहे. तुमच्या प्रोफाइलनुसार ${topBank.bank_name} चा पर्याय उपलब्ध आहे. कर्ज मंजुरी अधिक सुलभ करण्यासाठी जुने कर्ज कमी करा.`;
      }
    } else if (targetLang === 'gu') {
      return `નમસ્તે ${borrowerName}! તમારી ${amtLakh >= 1 ? `${amtLakh} લાખ રૂપિયા` : `₹${loanAmount}`} ની ${purposeText} લોન અરજી તપાસવામાં આવી છે. તમારી લોન મંજૂરીની સંભાવના ${probPct} ટકા છે. તમારા માટે ${topBank.bank_name} શ્રેષ્ઠ વિકલ્પ છે, જેમાં આશરે ${topBank.base_interest_rate} ટકા વ્યાજ દરે ધિરાણ મળી શકે છે.`;
    } else if (targetLang === 'bn') {
      return `নমস্কার ${borrowerName}! আপনার ${amtStrEn} মূল্যের ${purposeText} ঋণ আবেদন সফলভাবে বিশ্লেষণ করা হয়েছে। আপনার ঋণ পাওয়ার সম্ভাবনা ${probPct} শতাংশ। আপনার জন্য ${topBank.bank_name} সবচেয়ে উপযুক্ত, যেখানে ${topBank.base_interest_rate} শতাংশ সুদের হারে ঋণ মিলবে।`;
    } else if (targetLang === 'ta') {
      return `வணக்கம் ${borrowerName}! உங்கள் ${amtStrEn} மதிப்புள்ள ${purposeText} கடன் விண்ணப்பம் பரிசீலிக்கப்பட்டது. உங்கள் கடன் ஒப்புதல் வாய்ப்பு ${probPct} சதவீதம் ஆகும். உங்களுக்கு ${topBank.bank_name} மூலம் ${topBank.base_interest_rate} சதவீத வட்டியில் கடன் கிடைக்க வாய்ப்புள்ளது.`;
    } else if (targetLang === 'te') {
      return `నమస్కారం ${borrowerName}! మీ ${amtStrEn} ${purposeText} రుణ దరఖాస్తు పరిశీలించబడింది. మీ రుణ ఆమోద సంభావ్యత ${probPct} శాతం. మీకు ${topBank.bank_name} ద్వారా ${topBank.base_interest_rate} శాతం వడ్డీతో రుణం లభించే అవకాశం ఉంది.`;
    }

    // Default English
    if (probPct >= 70) {
      return `Hello ${borrowerName}! Your loan application of ${amtStrEn} for ${purposeText} has been evaluated. Your approval probability stands at ${probWordEn} percent. You are strongly eligible for ${topBank.bank_name} at an interest rate of ${rateEn} percent, with an estimated monthly installment of ₹${Math.round(topBank.estimated_monthly_emi || 4500).toLocaleString('en-IN')}. Maintain timely repayments to unlock maximum sovereign benefits.`;
    } else if (probPct >= 45) {
      return `Hello ${borrowerName}. Your loan application of ${amtStrEn} for ${purposeText} reflects an approval probability of ${probWordEn} percent. Your profile is conditionally approved with ${topBank.bank_name} at ${rateEn} percent. To transition into prime interest rate tiers, focus on reducing your monthly obligations.`;
    } else {
      return `Hello ${borrowerName}. Your loan application of ${amtStrEn} for ${purposeText} currently reflects an approval chance of ${probWordEn} percent. We recommend following our structured debt reduction plan to boost your CIBIL score and unlock prime bank financing.`;
    }
  };

  // Asynchronously fetch backend-aligned voice script on modal open or language change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchBackendScript = async () => {
      try {
        const res = await axios.post('/api/v1/customer/voice-guide-script', {
          applicant_name: borrowerName,
          language: lang,
          loan_input: formData,
          application_result: applicationResult
        }, { timeout: 4000 });

        if (isMounted && res.data?.script) {
          setBackendScript(res.data.script);
        }
      } catch (err) {
        // Fallback to client-side data-driven script
        console.log("Using client data-driven voice synthesis:", err.message);
      }
    };

    fetchBackendScript();
    return () => {
      isMounted = false;
    };
  }, [isOpen, lang, formData, applicationResult, borrowerName]);

  const currentConfig = REGIONAL_METADATA[lang] || REGIONAL_METADATA.hi;
  const currentText = backendScript || buildDataDrivenScript(lang);

  const preloadedBlobUrlRef = useRef(null);

  // Background Audio Pre-buffering for Instant Zero-Latency Playback
  useEffect(() => {
    if (!isOpen || !currentText) return;
    let isCancelled = false;

    const prefetchAudio = async () => {
      try {
        const res = await axios.post('/api/v1/customer/voice-audio', {
          text: currentText,
          lang: currentConfig.locale
        }, {
          responseType: 'blob',
          timeout: 12000
        });

        if (!isCancelled) {
          if (preloadedBlobUrlRef.current) {
            try { URL.revokeObjectURL(preloadedBlobUrlRef.current); } catch (e) {}
          }
          preloadedBlobUrlRef.current = URL.createObjectURL(res.data);
        }
      } catch (err) {
        console.warn("Audio prefetch notice:", err);
      }
    };

    prefetchAudio();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, currentText, currentConfig.locale]);

  const stopAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = "";
        audioRef.current.load();
      } catch (e) {
        console.warn("Error stopping audio:", e);
      }
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      try {
        URL.revokeObjectURL(audioUrlRef.current);
      } catch (e) {}
      audioUrlRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsLoadingAudio(false);
  };

  // Immediate stop on modal close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopAudio();
      if (preloadedBlobUrlRef.current) {
        try { URL.revokeObjectURL(preloadedBlobUrlRef.current); } catch (e) {}
        preloadedBlobUrlRef.current = null;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopAudio();
      if (preloadedBlobUrlRef.current) {
        try { URL.revokeObjectURL(preloadedBlobUrlRef.current); } catch (e) {}
        preloadedBlobUrlRef.current = null;
      }
    };
  }, []);

  // Escape key closes modal & stops audio
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        stopAudio();
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleClose = () => {
    stopAudio();
    onClose();
  };

  const handleTogglePlay = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    setIsLoadingAudio(true);
    stopAudio();

    try {
      // Use preloaded audio blob if ready for instant 0ms startup
      let blobUrl = preloadedBlobUrlRef.current;
      if (!blobUrl) {
        const res = await axios.post('/api/v1/customer/voice-audio', {
          text: currentText,
          lang: currentConfig.locale
        }, {
          responseType: 'blob',
          timeout: 15000
        });
        blobUrl = URL.createObjectURL(res.data);
      }

      audioUrlRef.current = blobUrl;
      const audio = new Audio(blobUrl);
      audioRef.current = audio;

      audio.onplaying = () => {
        setIsLoadingAudio(false);
        setIsPlaying(true);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsLoadingAudio(false);
      };

      audio.onerror = () => {
        if (!audioRef.current || !audio.src || audio.src === window.location.href) return;
        console.warn("Audio playback ended or interrupted");
        stopAudio();
      };

      await audio.play();
    } catch (err) {
      console.error("Failed to generate or play voice audio:", err);
      setIsLoadingAudio(false);
      setIsPlaying(false);
    }
  };

  const handleLanguageChange = (newLang) => {
    stopAudio();
    if (preloadedBlobUrlRef.current) {
      try { URL.revokeObjectURL(preloadedBlobUrlRef.current); } catch (e) {}
      preloadedBlobUrlRef.current = null;
    }
    setLang(newLang);
    setBackendScript(null); // Clear cached script to re-trigger dynamic synthesis
    if (onLanguageSelect) onLanguageSelect(newLang);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
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
                  {lang === 'hi' ? 'आवाज़ में समझें (AI वाणी मार्गदर्शक)' : lang === 'mr' ? 'आवाजात समजून घ्या (AI आवाज सल्लागार)' : 'Multi-Lingual Voice Guide'}
                </h3>
                <p className="text-xs text-slate-400 font-mono-tech">
                  {lang === 'hi' ? 'वास्तविक डेटा आधारित संपूर्ण ऋण विवरण सुनें' : lang === 'mr' ? 'खऱ्या माहितीवर आधारित संपूर्ण कर्ज विवरण ऐका' : '100% data-driven loan guidance in your mother tongue'}
                </p>
              </div>
            </div>

            <button 
              onClick={handleClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2336] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>


          {/* Regional Language Selector Buttons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono-tech text-slate-400 block uppercase">
              {lang === 'hi' ? 'भाषा चुनें (Select Language):' : lang === 'mr' ? 'भाषा निवडा (Select Language):' : 'Select Language:'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(REGIONAL_METADATA).map(([key, item]) => (
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
                <Radio className="w-3 h-3 animate-pulse text-[#d2ff00]" /> {currentConfig.welcome}
              </span>
              <span className="text-slate-500">VOICE ACTIVE</span>
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
                <span className="text-[11px] font-mono-tech text-[#d2ff00] ml-2">
                  {lang === 'hi' ? 'आवाज़ बज रही है...' : lang === 'mr' ? 'आवाज सुरू आहे...' : 'Speaking aloud...'}
                </span>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between gap-3 bg-[#162030] p-3 rounded-xl border border-[#1e2a3d]">
            <span className="text-xs font-mono-tech text-slate-400">
              {lang === 'hi' ? 'प्राकृतिक स्पष्ट हिंदी आवाज़' : lang === 'mr' ? 'नैसर्गिक स्पष्ट मराठी आवाज' : 'Natural Regional Audio'}
            </span>

            {/* Big Play / Pause Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTogglePlay}
              disabled={isLoadingAudio}
              className={`btn-lime px-6 py-2.5 text-xs font-black shadow-[0_0_20px_rgba(210,255,0,0.3)] flex items-center gap-2 cursor-pointer ${
                isPlaying ? 'bg-amber-400 text-black' : ''
              }`}
            >
              {isLoadingAudio ? (
                <span>लोड हो रहा है...</span>
              ) : isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'आवाज़ रोकें' : lang === 'mr' ? 'आवाज थांबवा' : 'PAUSE VOICE'}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{lang === 'hi' ? 'पूरी आवाज़ सुनें' : lang === 'mr' ? 'पूर्ण आवाज ऐका' : 'PLAY AUDIO GUIDE'}</span>
                </>
              )}
            </motion.button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

