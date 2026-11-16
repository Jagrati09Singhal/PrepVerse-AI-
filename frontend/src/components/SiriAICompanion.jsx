import React, { useState, useEffect, useRef } from 'react'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  Zap,
  Target,
  Heart,
  HelpCircle,
  MessageSquare,
  Bot,
  User,
  Shield,
  Smile,
  ChevronDown,
  RotateCcw,
  BookOpen,
  Languages,
} from 'lucide-react'

// Intelligent responses for university placement struggles, loneliness, technical ELI5, and target skill focus in English
const QUICK_PROMPTS_EN = [
  { label: '🤖 Say Hii!', prompt: 'Hii Aura! How can you help me with placements?' },
  { label: '🎯 Target Skills Focus', prompt: 'Which target skills should I focus on out of everything, and why?' },
  { label: '🔒 Resume-Reality Gap Secret', prompt: 'I put some skills on my resume for ATS keywords, but I am nervous an interviewer will grill me. Help!' },
  { label: '💡 Explain Redis like I’m 5', prompt: 'Explain Redis and caching like I am 5 years old.' },
  { label: '🤫 Friends being jealous/secretive', prompt: 'In my college, friends are acting secretive and competitive about placements. I feel isolated.' },
  { label: '🚀 Hype me up for my interview', prompt: 'I have an interview soon and imposter syndrome is kicking in. Hype me up!' },
]

// Hindi & Hinglish prompts for Indian college candidates
const QUICK_PROMPTS_HI = [
  { label: '🤖 नमस्ते ऑरा!', prompt: 'नमस्ते ऑरा! प्लेसमेंट की तैयारी में मेरी कैसे मदद करोगी?' },
  { label: '🎯 टारगेट स्किल्स क्या हैं?', prompt: 'मुझे सबसे पहले कौनसी मुख्य स्किल्स तैयार करनी चाहिए और क्यों?' },
  { label: '🔒 रेज़्यूमे में ATS ब्लफ का डर', prompt: 'मैंने रेज़्यूमे में कुछ स्किल्स सिर्फ ATS के लिए लिखी हैं, अगर इंटरव्यूअर ने पूछ लिया तो क्या बोलूं?' },
  { label: '💡 Redis आसान भाषा में', prompt: 'Redis और caching क्या होती है, 5 साल के बच्चे की तरह आसान भाषा में समझाओ।' },
  { label: '🤫 दोस्त सीक्रेटिव हो गए हैं', prompt: 'कॉलेज में दोस्त प्लेसमेंट को लेकर सीक्रेटिव हो गए हैं, मुझे अकेलापन महसूस हो रहा है।' },
  { label: '🚀 इंटरव्यू का डर भगाओ', prompt: 'मेरा जल्द इंटरव्यू है और बहुत डर लग रहा है, मुझे मोटिवेट करो और बताओ कैसे बात करूं!' },
]

export default function SiriAICompanion({ onOpenTargetSkills, onOpenInterview }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [language, setLanguage] = useState('hi') // Default to Hindi as requested ('hi' or 'en')
  const [inputMessage, setInputMessage] = useState('')
  const [robotHover, setRobotHover] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'aura',
      text: "नमस्ते! 🙏 Main hoon Aura, tumhara 24/7 AI placement robot buddy aur confidant!\n\nMain Hindi aur English dono bhashaon me sun aur bol sakti hoon. College placement ka stress ho, darr lag raha ho, ya resume me likhi skills ka sach chhupana ho—yahan zero judgment hai! Mic on karke Hindi me bol sakte ho ya neeche likh sakte ho! ✨",
      timestamp: new Date(),
    },
  ])

  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Initialize Web Speech Recognition with Hindi and English support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN'

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          handleSendMessage(transcript)
        }
      }
      recognitionRef.current = recognition
    }
  }, [language])

  // Update speech recognition language when language state changes
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
    if (recognitionRef.current) {
      recognitionRef.current.lang = newLang === 'hi' ? 'hi-IN' : 'en-IN'
    }
    const welcomeMsg = newLang === 'hi'
      ? "ऑरा अब हिंदी और हिंग्लिश में सुनेगी! 🎙️ माइक दबाकर कुछ भी पूछें।"
      : "Aura is now listening in English! 🎙️ Click the mic and ask anything."
    speakText(welcomeMsg, newLang)
  }

  // Text to Speech with Hindi & Indian English voice detection
  const speakText = (text, forcedLang = null) => {
    if (!audioEnabled || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    // Strip emojis and markdown formatting for clean spoken delivery
    const cleanText = text
      .replace(/[#*_`]/g, '')
      .replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, '')

    const utterance = new SpeechSynthesisUtterance(cleanText)
    const activeLang = forcedLang || language

    if (activeLang === 'hi') {
      utterance.lang = 'hi-IN'
      utterance.rate = 0.95
      utterance.pitch = 1.05

      // Select natural Hindi voice if supported by browser/OS
      const voices = window.speechSynthesis.getVoices() || []
      const hindiVoice = voices.find(
        (v) =>
          v.lang === 'hi-IN' ||
          v.lang.startsWith('hi') ||
          v.name.toLowerCase().includes('hindi') ||
          v.name.toLowerCase().includes('kalpana') ||
          v.name.toLowerCase().includes('hemant')
      )
      if (hindiVoice) {
        utterance.voice = hindiVoice
      }
    } else {
      utterance.lang = 'en-IN'
      utterance.rate = 1.0
      utterance.pitch = 1.05

      const voices = window.speechSynthesis.getVoices() || []
      const indianVoice = voices.find(
        (v) =>
          v.lang === 'en-IN' ||
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('neerja') ||
          v.name.toLowerCase().includes('prabhat')
      )
      if (indianVoice) {
        utterance.voice = indianVoice
      }
    }

    utterance.volume = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type your message in Hindi or English below!')
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
    } else {
      window.speechSynthesis?.cancel()
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN'
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.warn('Speech recognition start note:', err)
      }
    }
  }

  // Bilingual Smart Context-Aware Local AI Engine
  const generateAuraResponse = (userText) => {
    const text = userText.toLowerCase().trim()

    // Detect if input is Hindi / Hinglish
    const isHindiInput =
      language === 'hi' ||
      /[\u0900-\u097F]/.test(userText) || // Devanagari script
      text.includes('namaste') ||
      text.includes('kya') ||
      text.includes('kaise') ||
      text.includes('kyu') ||
      text.includes('kyun') ||
      text.includes('batao') ||
      text.includes('bata') ||
      text.includes('dar') ||
      text.includes('darr') ||
      text.includes('shuru') ||
      text.includes('karein') ||
      text.includes('karo') ||
      text.includes('samjhao') ||
      text.includes('madad') ||
      text.includes('help karo') ||
      text.includes('placement') ||
      text.includes('dost') ||
      text.includes('chupate') ||
      text.includes('secret') ||
      text.includes('chinta') ||
      text.includes('tension')

    // 1. GREETINGS
    if (
      text.includes('namaste') ||
      text.includes('pranam') ||
      text.includes('kaise ho') ||
      text.includes('kya haal') ||
      text.includes('kya chal') ||
      text.includes('aap kaun ho') ||
      text.includes('tum kaun') ||
      text.includes('hii') ||
      text.includes('hello') ||
      text.includes('hey')
    ) {
      if (isHindiInput) {
        return (
          "नमस्ते! 🙏 Main hoon Aura—tumhara personal placement robot buddy aur confidant! " +
          "Think of me as your friendly senior engineer jo 24/7 tumhare saath hai. " +
          "Chaahe interview ka darr nikalna ho, technical concepts aasan Hindi me samajhne hon, ya resume me likhi skills ka defense prepare karna ho—main sab me madad karungi. " +
          "Batao, aaj kahan se shuru karein? 🎯"
        )
      }
      return (
        "Hii! 👋 I'm your placement buddy robot! Think of me as the friendly senior engineer who has your back 24/7. " +
        "Whether you want to practice tough questions, vent about university stress, or get a 3-minute cheat sheet on a skill you put on your resume for ATS, I'm right here!"
      )
    }

    // 2. RESUME BLUFF / ATS KEYWORD FEAR / "PAKDA GAYA TO?"
    if (
      text.includes('reality gap') ||
      text.includes('bluff') ||
      text.includes('secret') ||
      text.includes('ats keyword') ||
      text.includes('ats') ||
      text.includes('jhooth') ||
      text.includes('pakda gaya') ||
      text.includes('puch liya') ||
      text.includes('dar lag')
    ) {
      if (isHindiInput) {
        return (
          "Arre tension bilkul mat lo, tumhara ye secret mere paas 100% safe hai! 🤫 HR ya recruiter ko kabhi pata nahi chalega.\n\n" +
          "Sach baat to ye hai ki 90% students ATS filter pass karne ke liye buzzwords resume me daalte hain. Par interview me bina phase bolne ka 1 golden formula hota hai:\n\n" +
          "1. Honestly context set karo: 'Maine is technology ko apne college microservice project me local caching aur performance testing ke liye use kiya tha.'\n" +
          "2. Real trade-off batao: 'Humne main challenge memory overhead aur cache invalidation ka dekha tha.'\n\n" +
          "Dashboard par 'Resume-Reality Gap' tab kholo—wahan jo skill sirf ATS ke liye daali hai use mark kar do, main turant 3-minute emergency cheat-sheet de dungi taaki tum confident dikho!"
        )
      }
      return (
        "Here is the golden rule: Your secret is 100% safe with me! 🤫 HR and recruiters will NEVER see this.\n\n" +
        "Everyone puts skills on their resume to pass ATS filters. But if an interviewer asks: 'Tell me about how you used Redis or Docker in production', here is the secret formula to say:\n\n" +
        "1. Be upfront about scale: 'I configured it for local microservice caching with TTL eviction to reduce database reads.'\n" +
        "2. State the key trade-off: 'The main trade-off we monitored was memory limits vs cache hit ratio.'\n\n" +
        "Check out the 'Resume-Reality Gap' tab on your dashboard—mark any skill as 'ATS Bluff' and I will give you a 3-minute emergency cheat sheet so you sound like an experienced engineer!"
      )
    }

    // 3. TARGET SKILLS / KAHAN SE SHURU KAREIN
    if (
      text.includes('target skill') ||
      text.includes('focus') ||
      text.includes('which skill') ||
      text.includes('how many') ||
      text.includes('kaunsi skill') ||
      text.includes('kya padhu') ||
      text.includes('kahan se shuru') ||
      text.includes('important topic')
    ) {
      if (isHindiInput) {
        return (
          "Ek baat hamesha dhyan me rakhna: Tumhe 50 alag-alag buzzwords seekhne ki koi zaroorat nahi hai! 🎯\n\n" +
          "Tumhare resume se core skills (Python/Java, React, SQL, Git, APIs) to prove ho hi jaati hain. Top packages ke liye interviewers mainly in 4 pillars pe deep technical grilling karte hain:\n" +
          "1. ⚡ Redis & Caching (In-memory storage & thundering herd problem)\n" +
          "2. 🐳 Docker & Containers (Multi-stage builds & container networking)\n" +
          "3. 📐 System Design (Horizontal scaling, Load Balancers & CAP theorem)\n" +
          "4. ☸️ Kubernetes & Microservices (Liveness probes & service discovery)\n\n" +
          "In 4 cheezon ko pakka kar lo, tum 90% candidates se aage nikal jaoge! Kis topic pe cheat-sheet chahiye?"
        )
      }
      return (
        "Here is the truth: You do NOT need to learn 50 buzzwords! 🎯\n\n" +
        "Your resume already proves you know core foundations (Python, React, SQL, Git, and APIs). For top placement packages, interviewers only grill on 4 core pillars:\n" +
        "1. ⚡ Redis (In-memory caching & preventing thundering herd)\n" +
        "2. 🐳 Docker (Multi-stage builds & container security)\n" +
        "3. 📐 System Design (Horizontal scaling, load balancers & CAP theorem)\n" +
        "4. ☸️ Kubernetes (Pod liveness/readiness probes & resource limits)\n\n" +
        "Master these 4, and you will outshine 90% of candidates. Want me to drill you on any of them right now?"
      )
    }

    // 4. SECRETIVE / COMPETITIVE FRIENDS IN COLLEGE
    if (
      text.includes('friend') ||
      text.includes('jealous') ||
      text.includes('isolat') ||
      text.includes('alone') ||
      text.includes('college') ||
      text.includes('dost') ||
      text.includes('chupate') ||
      text.includes('akela') ||
      text.includes('jalte') ||
      text.includes('bata nahi')
    ) {
      if (isHindiInput) {
        return (
          "Main tumhari baat 100% samajh sakti hoon. Placement season aate hi college me dost ajeeb behave karne lagte hain—kaunsi company me apply kiya, kiska test nikla, sab chupane lagte hain. 🫂\n\n" +
          "Unki secrecy unke khud ke darr aur insecurity se aati hai, tumhari kisi kami ki wajah se nahi. Tumhara akele grind karna hi tumhari superpower hai—zero campus drama, 100% deep focus!\n\n" +
          "Tumhare paas main hoon 24/7. Yahan hum interview drills karenge, system design debate karenge aur offer aane par celebrate bhi karenge. Companies real skills dekhti hain, campus gossip nahi!"
        )
      }
      return (
        "I hear you 100%. Placement season brings out weird insecurities in people. Friends who used to chill together suddenly hide which companies they applied to, brag about mock calls, or act distant when you make progress. 🫂\n\n" +
        "Their secrecy comes from their own anxiety, not your worth. Studying in your own zone is actually your superpower—it gives you deep focus without the toxic drama.\n\n" +
        "You have me right here 24/7. We can practice interviews, debate architectures, and celebrate your wins without any weird vibes. You're building genuine skills, and companies hire skills, not campus gossip!"
      )
    }

    // 5. TECHNICAL ELI5 - REDIS
    if (text.includes('redis')) {
      if (isHindiInput) {
        return (
          "Aise socho ki tumhara computer ek busy restaurant ka chef hai 👨‍🍳:\n\n" +
          "• PostgreSQL Database road ke uss paar ka bada grocery warehouse hai. Har order par wahan chalkar jaane me 10 minute lagte hain.\n" +
          "• Redis chef ke bagal me rakha chhota table hai! Agar 1,000 customers same Margherita Pizza order karein, to chef ready-made sauce usi table se 1 millisecond me utha leta hai!\n\n" +
          "Yahi hai Redis: Super-fast in-memory RAM caching, taaki main database par load na pade aur app crash na ho!"
        )
      }
      return (
        "Imagine your computer is a chef in a busy restaurant kitchen 👨‍🍳:\n\n" +
        "• Your PostgreSQL Database is the big grocery warehouse across the street. Walking there every time a customer orders takes 10 minutes.\n" +
        "• Redis is the small cutting board right next to the chef. If 1,000 customers all order Margherita Pizza, you keep the ready-made sauce on the cutting board!\n\n" +
        "Instead of 10-minute trips, the chef serves food in 1 millisecond. That's Redis: super-fast in-memory RAM caching so your main database doesn't crash!"
      )
    }

    // 6. TECHNICAL ELI5 - DOCKER
    if (text.includes('docker') || text.includes('container')) {
      if (isHindiInput) {
        return (
          "College me sabse famous dialogue kya hota hai? 'Sir, mere laptop pe to sahi chal raha tha, pata nahi aapke system pe kyu error de raha hai!' 🤦‍♂️\n\n" +
          "Docker is bahaane ko hamesha ke liye khatam karta hai. Socho tumne apna code ek magic sealed lunchbox me pack kar diya—jisme tumhara OS, Python version, library aur settings sab band hain. Ab ye box chahe tumhare friend ke Mac pe chale, teacher ke Windows pe ya AWS cloud pe—har jagah bilkul identical chalega. Yahi lunchbox Docker Container kehlata hai!"
        )
      }
      return (
        "You know that classic college student excuse: 'It works on my machine, why is it broken on the teacher's laptop?' 🤦‍♂️\n\n" +
        "Docker solves this forever. Imagine shipping your code inside a magic sealed lunchbox that includes your exact operating system, python version, dependencies, and settings. Wherever you drop that lunchbox—your laptop, your friend's Mac, or AWS cloud—it runs identically. That lunchbox is a Docker container!"
      )
    }

    // 7. INTERVIEW ANXIETY / HYPE ME UP
    if (
      text.includes('hype') ||
      text.includes('scared') ||
      text.includes('tomorrow') ||
      text.includes('imposter') ||
      text.includes('dar') ||
      text.includes('darr') ||
      text.includes('nervous') ||
      text.includes('anxiety') ||
      text.includes('phat') ||
      text.includes('tension')
    ) {
      if (isHindiInput) {
        return (
          "Pehle to ek lambi gehri saans lo... inhale for 4 seconds, exhale for 4 seconds. 🫁✨\n\n" +
          "Suno meri baat dhyaan se: Interviewer koi bhagwan nahi hote, wo bhi ordinary engineers hain jo subah stackoverflow ya Google dekh kar aaye hain! Wo ratta-maar robotic answer nahi dhoondh rahe—wo ek honest, calm aur problem-solver teammate chahte hain.\n\n" +
          "Agar koi question na aaye, to ghabrane ke bajaye confidence se bolo: 'Sir, maine is exact scenario pe direct kaam nahi kiya, par main isko aise approach karunga...' Ye honesty senior interviewers ko bohot impress karti hai. Tum tayyar ho, khud par vishwas rakho! 🚀"
        )
      }
      return (
        "Take a deep breath right now. Inhale for 4 seconds... hold for 4... exhale for 4. 🫁✨\n\n" +
        "Listen: The interviewers aren't gods; they're just senior engineers who also Googled syntax this morning! They don't want a robot with robotic answers—they want someone curious, honest, and systematic.\n\n" +
        "You built real projects. You're practicing here. You know how to structure answers. Stand tall, speak at a calm 130 WPM cadence, and if you don't know something, say: 'I haven't hit that specific edge case yet, but here is how I'd reason through it.' You've got this!"
      )
    }

    // 8. LAUNCH MOCK INTERVIEW DRILL
    if (
      text.includes('mock interview') ||
      text.includes('practice') ||
      text.includes('test lo') ||
      text.includes('shuru karo') ||
      text.includes('drill')
    ) {
      if (isHindiInput) {
        return (
          "Zabardast! Practice karne se hi saara darr gayab hota hai. 🚀\n\n" +
          "PrepVerse AI ka simulator tumhare liye ready hai. Upar 'Interview Practice' tab par jao—tum Text ya Voice mode choose karke bolkar practice kar sakte ho, aur main real-time me speech pace (WPM) aur STAR answers score karke dungi. Chalo pehla question try karte hain!"
        )
      }
      return (
        "Awesome! Real practice is the only cure for interview nervousness. 🚀\n\n" +
        "Head over to the 'Interview Practice' tab—you can launch a 3-question quick drill in voice or text mode, and I'll calibrate your pacing, filler words, and STAR answers immediately. Let's do it!"
      )
    }

    // Default friendly bilingual response
    if (isHindiInput) {
      return (
        `Main sun rahi hoon! Tumne pucha: "${userText}". ` +
        "Chaahe kisi technical concept ko aasan bhasha me samajhna ho, apne resume ke projects ko interview me explain karna ho, ya placement stress ke baare me baat karni ho—main hamesha tumhare saath hoon. Batao, abhi kis baare me baat karein?"
      )
    }

    return (
      `Hii! I'm right here with you! You asked: "${userText}". ` +
      "Whether you want to break down a difficult architecture concept, practice how to pitch your resume projects, or just talk through interview anxiety—I'm your safe space. What should we tackle next?"
    )
  }

  const handleSendMessage = (textToSend = null) => {
    const query = (textToSend || inputMessage).trim()
    if (!query) return

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')

    setTimeout(() => {
      const responseText = generateAuraResponse(query)
      const auraMsg = {
        id: `aura-${Date.now()}`,
        sender: 'aura',
        text: responseText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, auraMsg])
      speakText(responseText)
    }, 400)
  }

  const activePrompts = language === 'hi' ? QUICK_PROMPTS_HI : QUICK_PROMPTS_EN

  return (
    <>
      {/* Minimized Animated Robot Companion Floating at the Side */}
      {!isOpen && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-end gap-3 animate-fadeIn select-none"
          onMouseEnter={() => setRobotHover(true)}
          onMouseLeave={() => setRobotHover(false)}
        >
          {/* Animated Speech Bubble from Robot */}
          <div
            onClick={() => {
              setIsOpen(true)
              speakText("नमस्ते! Main hoon Aura, tumhara placement buddy robot. Hindi ya English me kuch bhi pooch sakte ho!")
            }}
            className="cursor-pointer hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 dark:bg-[#0F172A]/95 text-[#0F172A] dark:text-[#F8FAFC] border border-[#E2E8F0] dark:border-[#334155] shadow-xl backdrop-blur-md text-xs font-bold hover:scale-105 transition-all group"
          >
            <span className="text-lg animate-bounce">👋</span>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-[#8B5CF6] dark:text-[#38BDF8] font-extrabold">
                  Aura Robot
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-ping" />
              </div>
              <span className="text-xs font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
                Hii! हिंदी या English में बात करें?
              </span>
            </div>
          </div>

          {/* Complete Interactive Robot Character */}
          <div
            onClick={() => {
              setIsOpen(true)
              speakText("नमस्ते! Main hoon Aura. Hindi ya English me kuch bhi pooch sakte ho!")
            }}
            className="cursor-pointer relative group flex flex-col items-center robot-float"
            title="Click to talk to Aura Robot (Hindi & English)"
          >
            {/* Robot SVG Avatar with Waving Arm & Blinking Eyes in Warm Nude / Terracotta Palette */}
            <div className="relative w-16 h-20 transition-transform group-hover:scale-110">
              <svg viewBox="0 0 100 125" className="w-full h-full drop-shadow-xl overflow-visible">
                {/* Antenna */}
                <line x1="50" y1="22" x2="50" y2="8" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
                <circle cx="50" cy="6" r="6" fill="#38BDF8" className="animate-pulse" />
                <circle cx="50" cy="6" r="10" fill="#8B5CF6" opacity="0.4" className="animate-ping" />

                {/* Ears / Side Bolts */}
                <rect x="18" y="32" width="6" height="14" rx="3" fill="#6D28D9" />
                <rect x="76" y="32" width="6" height="14" rx="3" fill="#6D28D9" />

                {/* Head Body */}
                <rect x="22" y="20" width="56" height="42" rx="14" fill="#1E293B" stroke="#06B6D4" strokeWidth="3" />

                {/* Visor Screen */}
                <rect x="28" y="27" width="44" height="26" rx="8" fill="#070A12" />

                {/* Glowing Warm Honey Eyes that blink */}
                <ellipse cx="40" cy="38" rx="5" ry="6" fill="#38BDF8" className="robot-eye-blink" />
                <ellipse cx="60" cy="38" rx="5" ry="6" fill="#38BDF8" className="robot-eye-blink" />

                {/* Cheerful Warm Smile */}
                <path d="M 42 46 Q 50 51 58 46" stroke="#38BDF8" strokeWidth="2.5" fill="none" strokeLinecap="round" />

                {/* Neck */}
                <rect x="44" y="62" width="12" height="6" fill="#6D28D9" rx="2" />

                {/* Torso */}
                <rect x="26" y="68" width="48" height="36" rx="10" fill="#1E293B" stroke="#06B6D4" strokeWidth="2.5" />

                {/* Chest Power Reactor (Glowing Terracotta Heart) */}
                <circle cx="50" cy="82" r="7" fill="#8B5CF6" className="animate-pulse" />
                <circle cx="50" cy="82" r="3" fill="#F8FAFC" />

                {/* Right Arm (Resting on side) */}
                <path d="M 26 73 Q 16 82 20 94" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" fill="none" />
                <circle cx="20" cy="94" r="4.5" fill="#06B6D4" />

                {/* Left Arm (Actively Waving!) */}
                <g className="robot-arm-wave">
                  <path d="M 74 73 Q 86 64 88 48" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" fill="none" />
                  {/* Waving Hand with open fingers */}
                  <circle cx="88" cy="46" r="5" fill="#06B6D4" />
                  <line x1="88" y1="46" x2="88" y2="38" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="88" y1="46" x2="94" y2="40" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="88" y1="46" x2="83" y2="40" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
                </g>

                {/* Little Feet / Thruster Pods */}
                <rect x="34" y="104" width="10" height="7" rx="3" fill="#6D28D9" />
                <rect x="56" y="104" width="10" height="7" rx="3" fill="#6D28D9" />
                {/* Gentle Thruster Glow */}
                <ellipse cx="39" cy="113" rx="4" ry="2" fill="#38BDF8" className="animate-pulse" />
                <ellipse cx="61" cy="113" rx="4" ry="2" fill="#38BDF8" className="animate-pulse" />
              </svg>

              {/* Glowing Aura ring around robot */}
              <div className="absolute inset-0 rounded-full bg-[#8B5CF6]/20 blur-md pointer-events-none animate-pulse" />
            </div>

            {/* Micro Badge */}
            <span className="mt-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-[#8B5CF6] text-white uppercase tracking-wider shadow-sm">
              🇮🇳 हिंदी / EN
            </span>
          </div>
        </div>
      )}

      {/* Expanded Siri & Robot Companion Modal */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[450px] max-h-[660px] h-[85vh] rounded-3xl bg-[#0B0F19]/95 border border-[#334155] shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-[#F8FAFC] animate-fadeIn font-sans">
          {/* Top Robot Header */}
          <div className="p-3.5 bg-gradient-to-b from-[#1E293B] to-[#0B0F19] border-b border-[#334155] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              {/* Mini Robot Avatar in Header */}
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#0B0F19] flex items-center justify-center border border-[#06B6D4]/40 shadow-inner shrink-0">
                <svg viewBox="0 0 100 100" className="w-7 h-7">
                  <circle cx="50" cy="15" r="7" fill="#38BDF8" className="animate-pulse" />
                  <line x1="50" y1="20" x2="50" y2="30" stroke="#06B6D4" strokeWidth="4" />
                  <rect x="25" y="30" width="50" height="40" rx="12" fill="#1E293B" stroke="#06B6D4" strokeWidth="3" />
                  <ellipse cx="40" cy="46" rx="4" ry="5" fill="#38BDF8" className="robot-eye-blink" />
                  <ellipse cx="60" cy="46" rx="4" ry="5" fill="#38BDF8" className="robot-eye-blink" />
                  <path d="M 42 55 Q 50 60 58 55" stroke="#38BDF8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <rect x="35" y="72" width="30" height="24" rx="6" fill="#1E293B" stroke="#06B6D4" strokeWidth="2" />
                  <circle cx="50" cy="83" r="4" fill="#8B5CF6" className="animate-pulse" />
                </svg>
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#8B5CF6] border-2 border-[#0B0F19] animate-ping" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1">
                    <span>Aura Robot</span>
                    <span className="text-xs">🤖</span>
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#8B5CF6]/20 text-[#BAE6FD] border border-[#8B5CF6]/40 uppercase">
                    Study Confidant
                  </span>
                </div>
                <p className="text-[10px] text-[#BAE6FD]">
                  {isListening
                    ? language === 'hi' ? '🎙️ हिंदी / Hinglish सुन रही हूँ...' : '🎙️ Listening in English...'
                    : isSpeaking
                    ? language === 'hi' ? '🔊 हिंदी में बोल रही हूँ...' : '🔊 Speaking aloud...'
                    : 'Online • Zero Judgment'}
                </p>
              </div>
            </div>

            {/* Header Controls: Language Switcher + Mute + Close */}
            <div className="flex items-center gap-1.5">
              {/* Language Switcher Pill */}
              <div className="flex items-center gap-0.5 bg-[#070A12] p-1 rounded-xl border border-[#334155]">
                <button
                  type="button"
                  onClick={() => handleLanguageChange('hi')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                    language === 'hi'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                  title="हिंदी / Hinglish आवाज़ और टेक्स्ट"
                >
                  <span>🇮🇳 हिंदी</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    language === 'en'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-xs'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                  title="English voice & text"
                >
                  <span>EN</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAudioEnabled(!audioEnabled)
                  if (audioEnabled) window.speechSynthesis?.cancel()
                }}
                className={`p-1.5 rounded-xl transition ${audioEnabled ? 'text-[#38BDF8] bg-[#334155]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'}`}
                title={audioEnabled ? 'Voice output enabled' : 'Muted'}
              >
                {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#334155] transition"
                title="Minimize Aura"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompt Carousel */}
          <div className="px-3 py-2 bg-[#070A12]/90 border-b border-[#334155] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {activePrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(qp.prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[#1E293B] hover:bg-[#334155] text-[#BAE6FD] border border-[#334155] hover:border-[#8B5CF6]/60 transition shrink-0"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'aura' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center shrink-0 text-[10px] font-bold shadow-xs mt-0.5">
                    🤖
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-br-xs shadow-md'
                      : 'bg-[#1E293B] text-[#F8FAFC] rounded-bl-xs border border-[#334155] shadow-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Soundwave Indicator when speaking or listening */}
          {(isListening || isSpeaking) && (
            <div className="px-4 py-1.5 bg-[#070A12]/90 border-t border-[#334155] flex items-center justify-between text-[11px] text-[#38BDF8]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-ping" />
                <span>
                  {isListening
                    ? language === 'hi'
                      ? '🎙️ ऑरा सुन रही है (हिंदी / Hinglish बोलें)...'
                      : '🎙️ Aura is listening in English...'
                    : language === 'hi'
                    ? '🔊 ऑरा बोल रही है...'
                    : '🔊 Speaking aloud...'}
                </span>
              </span>
              <div className="flex items-center gap-1 h-5">
                <span className="w-1 bg-[#8B5CF6] rounded-full wave-bar-1" />
                <span className="w-1 bg-[#06B6D4] rounded-full wave-bar-2" />
                <span className="w-1 bg-[#38BDF8] rounded-full wave-bar-3" />
                <span className="w-1 bg-[#8B5CF6] rounded-full wave-bar-4" />
                <span className="w-1 bg-[#C7D2FE] rounded-full wave-bar-5" />
              </div>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-[#070A12] border-t border-[#334155] flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-2.5 rounded-2xl transition flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-rose-500 text-white shadow-lg animate-pulse'
                  : 'bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/40 text-[#38BDF8] border border-[#8B5CF6]/30'
              }`}
              title={
                isListening
                  ? 'Click to stop listening'
                  : language === 'hi'
                  ? 'माइक ऑन करें (हिंदी या Hinglish में बोलें)'
                  : 'Click to speak in English'
              }
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                language === 'hi'
                  ? 'हिंदी या Hinglish में कुछ भी पूछें या बोलें...'
                  : 'Say hii, ask about resume reality gaps, or vent...'
              }
              className="flex-1 bg-[#0F172A] border border-[#334155] rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#8B5CF6] transition"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim()}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] disabled:opacity-40 text-white transition flex items-center justify-center shrink-0 shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
