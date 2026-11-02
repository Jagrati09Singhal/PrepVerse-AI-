/**
 * Easy, Conversational Hindi & Hinglish Translation Engine for PrepVerse AI.
 * Translates interview questions into natural, crystal-clear, everyday language
 * that Indian engineering students and freshers can understand instantly.
 */

// 1. Core Subject & Curriculum Questions (In simple, everyday language)
const EXACT_QUESTIONS = {
  // Operating Systems
  "Which of the following conditions is NOT one of Coffman's four necessary conditions for a Deadlock to occur?":
    "इनमें से कौन सी शर्त Deadlock होने के लिए Coffman की 4 जरूरी शर्तों में शामिल नहीं है?",
  "What phenomenon occurs when the operating system spends significantly more time swapping virtual memory pages than executing instructions?":
    "जब Operating System काम करने के बजाय ज्यादा टाइम सिर्फ RAM और Disk के बीच पेज स्वैप करने में गंवाने लगे, तो इस प्रॉब्लम को क्या कहते हैं?",
  "Explain the difference between a process and a thread, and how context switching overhead differs between them.":
    "Process और Thread में क्या फर्क होता है? और एक से दूसरे पर स्विच (Context Switching) करने में किसमें ज्यादा टाइम और मेमोरी लगती है?",
  "How does virtual memory protect memory address spaces between isolated user processes?":
    "Virtual Memory अलग-अलग चल रहे प्रोग्राम्स (Processes) के डेटा को एक-दूसरे से सेफ और अलग कैसे रखती है?",

  // DBMS & SQL
  "What is the difference between `DELETE FROM users;` and `TRUNCATE TABLE users;` in SQL?":
    "SQL में `DELETE FROM users;` और `TRUNCATE TABLE users;` में क्या फर्क है (जैसे स्पीड, रोलबैक और डेटा रीसेट)?",
  "Explain the 4 ACID properties in database management systems and why they are critical for financial transactions.":
    "Database में ACID (Atomicity, Consistency, Isolation, Durability) क्या होता है, और बैंकिंग या पेमेंट ट्रांजैक्शन में यह क्यों जरूरी है?",
  "How does a B-Tree index accelerate range queries compared to a Hash index in PostgreSQL or MySQL?":
    "PostgreSQL या MySQL में रेंज वाली क्वेरी (जैसे तारीख या कीमत के बीच खोजना) में B-Tree Index, Hash Index से ज्यादा तेज क्यों काम करता है?",
  "Explain how optimistic locking differs from pessimistic locking under high database concurrency.":
    "जब एक साथ बहुत सारे लोग डेटाबेस पर डेटा बदल रहे हों, तो Optimistic Locking और Pessimistic Locking में क्या फर्क होता है?",
  "When analyzing a slow-performing SQL query, walk through how you interpret an EXPLAIN ANALYZE execution plan to optimize indexing.":
    "जब कोई SQL क्वेरी बहुत धीमी चल रही हो, तो आप EXPLAIN ANALYZE चलाकर कैसे चेक करते हैं कि क्वेरी कहाँ अटक रही है और Index कैसे ठीक करें?",

  // Computer Networks
  "Explain the 3-way handshake process in TCP and how it guarantees reliable transport.":
    "TCP में 3-way handshake (SYN, SYN-ACK, ACK) कैसे काम करता है और यह डेटा सही सलामत पहुंचने की गारंटी कैसे देता है?",
  "What is the difference between TCP and UDP, and in what scenarios is UDP preferred despite packet loss?":
    "TCP और UDP में क्या फर्क है? डेटा लॉस होने के चांस के बाद भी वीडियो कॉलिंग या ऑनलाइन गेम्स में UDP क्यों इस्तेमाल होता है?",
  "What happens when you type a URL into a web browser and hit Enter? Walk through DNS, TCP, TLS, and HTTP.":
    "जब आप ब्राउज़र में किसी वेबसाइट का नाम लिखकर एंटर दबाते हैं, तो बैकग्राउंड में क्या-क्या होता है (DNS, कनेक्शन, सिक्योरिटी और पेज लोड)?",

  // Data Structures & Algorithms
  "What is the worst-case time complexity of QuickSort when a naive pivot (e.g. always first element on already sorted array) is selected?":
    "अगर QuickSort में हमेशा पहला एलिमेंट ही Pivot चुन लिया जाए और array पहले से सॉर्टेड हो, तो सबसे खराब टाइम कॉम्प्लेक्सिटी (Worst-case) क्या होगी?",
  "Explain how a hash map resolves collisions using separate chaining versus open addressing.":
    "Hash Map में जब दो चीजों का एक ही इंडेक्स बन जाए (Collision), तो Separate Chaining और Open Addressing उसे कैसे संभालते हैं?",
  "What is the advantage of using a Min-Heap for finding the K-th largest element in a stream of numbers?":
    "लगातार आ रहे नंबरों में से K-वां सबसे बड़ा नंबर खोजने के लिए Min-Heap का इस्तेमाल करने का क्या फायदा है?",

  // Python & React
  "Explain Python's Global Interpreter Lock (GIL) and its implications on CPU-bound versus I/O-bound multi-threaded programs.":
    "Python में GIL (Global Interpreter Lock) क्या होता है, और यह भारी कैलकुलेशन वाले कोड को मल्टी-थ्रेडिंग में स्लो क्यों कर देता है?",
  "How does React's reconciliation algorithm and Virtual DOM diffing minimize costly real DOM updates?":
    "React में Virtual DOM कैसे काम करता है, और यह पूरे पेज को बार-बार बदले बिना सिर्फ बदले हुए हिस्से को तेजी से कैसे अपडेट करता है?",
}

// 2. Behavioral (STAR) Questions in Friendly, Easy Language
const STAR_QUESTIONS = [
  {
    pattern: /technical disagreement with a team member/i,
    translation:
      "क्या आपके साथ कभी ऐसा हुआ जब किसी कोड या आर्किटेक्चर के फैसले पर आपका अपनी टीम के किसी साथी से मतभेद हुआ हो? आपने बातचीत करके इस बात को कैसे सुलझाया?",
  },
  {
    pattern: /tight delivery deadline and unexpected technical blockers/i,
    translation:
      "किसी ऐसे प्रोजेक्ट के बारे में बताएं जहाँ समय बहुत कम था और अचानक कोई बड़ी तकनीकी अड़चन आ गई। आपने स्थिति को कैसे संभाला और काम पूरा किया?",
  },
  {
    pattern: /technical debt or an inefficient process/i,
    translation:
      "क्या आपने कभी अपने प्रोजेक्ट में किसी पुराने, खराब कोड या धीमी प्रक्रिया को देखा और खुद आगे बढ़कर उसे ठीक किया? आपने क्या सुधार किया?",
  },
  {
    pattern: /deployment or feature you shipped did not go as planned or caused an outage/i,
    translation:
      "क्या आपका बनाया कोई फीचर लाइव होने के बाद क्रैश हुआ या उम्मीद के मुताबिक नहीं चला? आपने उसे कैसे सुधारा और इससे क्या सीखा?",
  },
  {
    pattern: /cross-functional misalignment with Product Managers/i,
    translation:
      "जब प्रोडक्ट मैनेजर या डिज़ाइनर की मांग और तकनीकी हकीकत में फर्क था, तो आपने टीम से बात करके काम को सही रास्ते पर कैसे लाया?",
  },
  {
    pattern: /mentored, unblocked, or onboarded a struggling engineer/i,
    translation:
      "क्या आपने कभी अपनी टीम के किसी नए या अटक रहे साथी की मदद की? आपने उन्हें कैसे सिखाया या अनब्लॉक किया?",
  },
  {
    pattern: /ambiguous, rapidly evolving technical requirements/i,
    translation:
      "जब आपको यह साफ नहीं बताया गया था कि क्या बनाना है और रिक्वायरमेंट्स बार-बार बदल रही थीं, तब आपने काम को कैसे प्लान किया?",
  },
  {
    pattern: /quickly learn and adopt a completely new language, framework/i,
    translation:
      "उस समय के बारे में बताएं जब आपको किसी जरूरी काम के लिए बहुत कम समय में एक नई कोडिंग लैंग्वेज या फ्रेमवर्क सीखना पड़ा। आपकी सीखने की क्या रणनीति थी?",
  },
  {
    pattern: /critical customer-facing bug reported directly from production/i,
    translation:
      "किसी ऐसे लाइव बग के बारे में बताएं जो सीधे यूज़र्स ने रिपोर्ट किया था। आपने तुरंत असली गलती कैसे ढूंढी और उसे कैसे फिक्स किया?",
  },
]

// 3. Situational Crisis Questions in Simple Everyday Language
const SITUATIONAL_QUESTIONS = [
  {
    pattern: /latency spikes by 300% on a core API service/i,
    translation: (role) =>
      `मान लीजिए आप ${role || 'इंजीनियर'} हैं और आपकी मुख्य API अचानक 3 गुना धीमी हो जाती है, जबकि CPU और RAM बिल्कुल नॉर्मल दिख रहे हैं। आप समस्या को कैसे खोजेंगे और ठीक करेंगे?`,
  },
  {
    pattern: /requests an urgent feature launch in two weeks that would typically require six weeks/i,
    translation: (role) =>
      `मान लीजिए मैनेजमेंट 6 हफ्ते का काम सिर्फ 2 हफ्ते में पूरा करने का दबाव डाल रहा है। एक ${role || 'इंजीनियर'} के रूप में आप काम के प्रेशर और कोड की क्वालिटी को कैसे बैलेंस करेंगे?`,
  },
  {
    pattern: /unpatched zero-day security vulnerability in a third-party dependency/i,
    translation: () =>
      `अगर आपको पता चले कि आपके लाइव प्रोजेक्ट की किसी लाइब्रेरी में बड़ा सिक्योरिटी खतरा (zero-day bug) है, तो बिना सिस्टम बंद किए आप इसे तुरंत कैसे ठीक करेंगे?`,
  },
  {
    pattern: /database replication lag and suspect intermittent network partitions/i,
    translation: () =>
      `अगर डेटाबेस में डेटा कॉपी होने में देरी हो रही हो और डेटा गलत होने का खतरा हो, तो आप डेटा को सुरक्षित और सही रखने के लिए क्या करेंगे?`,
  },
  {
    pattern: /Out-Of-Memory \(OOM\) crash during peak traffic hours/i,
    translation: () =>
      `अगर भारी ट्रैफिक के दौरान आपका सर्वर मेमोरी भर जाने (Out Of Memory) से बार-बार क्रैश हो रहा हो, तो आप तुरंत क्या एक्शन लेंगे?`,
  },
  {
    pattern: /third-party payment or authentication webhook begins failing intermittently/i,
    translation: () =>
      `अगर किसी बाहरी पेमेंट सर्विस का वेबहुक अचानक फेल होने लगे और आपके सर्वर पर लोड बढ़ने लगे, तो आप अपने सिस्टम को क्रैश होने से कैसे बचाएंगे?`,
  },
]

/**
 * Main translation export function.
 * Produces friendly, easy-to-understand Hindi/Hinglish translations.
 */
export function getHindiQuestionTranslation(englishText, targetSkill = '', questionType = '') {
  if (!englishText) return ''
  const trimmed = englishText.trim()

  // 1. Direct match in exact dictionary
  if (EXACT_QUESTIONS[trimmed]) {
    return EXACT_QUESTIONS[trimmed]
  }

  // 2. Clean out difficulty prefixes
  let cleanText = trimmed
    .replace(/^Advancing to high difficulty:\s*/i, '')
    .replace(/^Advancing to medium difficulty:\s*/i, '')
    .replace(/^Focusing on foundational concepts:\s*/i, '')
    .replace(/^Reinforcement drill:\s*/i, '')

  // 3. Adaptive High Difficulty Architecture Pattern
  // Example: "In the context of Machine Learning Engineer, how would you architect a fault-tolerant, high-concurrency subsystem with Database Management Systems handling distributed consensus, graceful failure degradation, and zero data loss?"
  const adaptiveArchMatch = cleanText.match(
    /In the context of (.+?), how would you architect a fault-tolerant,\s*high-concurrency subsystem with (.+?) handling distributed consensus,\s*graceful failure degradation,\s*and zero data loss\?/i
  )
  if (adaptiveArchMatch) {
    const role = adaptiveArchMatch[1].trim()
    const tech = adaptiveArchMatch[2].trim()
    return `अगर आप ${role} हैं, तो आप ${tech} के साथ ऐसा मजबूत सिस्टम कैसे डिजाइन करेंगे जो बहुत ज्यादा ट्रैफिक (high concurrency) संभाल सके, कोई खराबी आने पर भी बंद न हो, और कोई डेटा कभी लॉस (zero data loss) न हो?`
  }

  // 4. Adaptive Foundational Pattern
  const adaptiveFoundMatch = cleanText.match(
    /As a (.+?), what are the primary use-cases and core advantages of utilizing (.+?),\s*and what fundamental patterns do you rely on in day-to-day development\?/i
  )
  if (adaptiveFoundMatch) {
    const role = adaptiveFoundMatch[1].trim()
    const tech = adaptiveFoundMatch[2].trim()
    return `एक ${role} के तौर पर, ${tech} का सबसे ज्यादा इस्तेमाल कहाँ होता है और इसके क्या फायदे हैं? आप अपने रोज के काम में इसके किन बेसिक पैटर्न्स को यूज़ करते हैं?`
  }

  // 5. Project Deep-Dive Questions (Simple, direct Hindi)
  if (/architecture of (?:your project\s*)?['"]?([^,'"?]+)['"]?/i.test(cleanText)) {
    const match = cleanText.match(/architecture of (?:your project\s*)?['"]?([^,'"?]+)['"]?/i)
    const proj = match ? match[1] : 'आपके प्रोजेक्ट'
    return `अपने प्रोजेक्ट "${proj}" का आर्किटेक्चर आसान शब्दों में समझाएं। इसके अलग-अलग हिस्से (Frontend, Backend, Database) आपस में कैसे बात करते हैं?`
  }

  if (/challenging bug|production outage|unexpected failure/i.test(cleanText)) {
    const match = cleanText.match(/in (?:your project\s*)?['"]?([^,'"?]+)['"]?/i)
    const proj = match ? match[1] : 'इस प्रोजेक्ट'
    return `प्रोजेक्ट "${proj}" बनाते समय आई सबसे मुश्किल समस्या या बग कौन सा था? आपने कैसे पता लगाया कि गलती कहाँ है और उसे कैसे ठीक किया?`
  }

  if (/database schema|caching strategy|data storage/i.test(cleanText)) {
    const match = cleanText.match(/for (?:your project\s*)?['"]?([^,'"?]+)['"]?/i)
    const proj = match ? match[1] : 'इस प्रोजेक्ट'
    return `प्रोजेक्ट "${proj}" के लिए आपने डेटाबेस टेबल और कैशिंग (Redis / Indexing) कैसे डिजाइन की, ताकि डेटा तेजी से लोड हो सके?`
  }

  if (/scale to 50,000|50,000 daily active users|scalability bottleneck/i.test(cleanText)) {
    const match = cleanText.match(/(?:for|of|in|if)\s*['"]?([^,'"?]+)['"]?\s*(?:scaled to|scaled)/i)
    const proj = match ? match[1] : 'इस प्रोजेक्ट'
    return `अगर आपके प्रोजेक्ट "${proj}" पर एक साथ 50,000 लोग आ जाएं, तो सिस्टम सबसे पहले कहाँ अटकेगा (bottleneck)? आप इसे कैसे संभालेंगे?`
  }

  if (/secure|vulnerabilities|authentication/i.test(cleanText) && /project/i.test(cleanText)) {
    const match = cleanText.match(/in (?:your project\s*)?['"]?([^,'"?]+)['"]?/i)
    const proj = match ? match[1] : 'इस प्रोजेक्ट'
    return `आपने अपने प्रोजेक्ट "${proj}" को हैकिंग और सिक्योरिटी खतरों (जैसे गलत लॉगिन, डेटा चोरी, SQL Injection) से सुरक्षित कैसे रखा?`
  }

  // 6. Situational Crisis Questions
  for (const s of SITUATIONAL_QUESTIONS) {
    if (s.pattern.test(cleanText)) {
      const roleMatch = cleanText.match(/for (.+?) and/i) || cleanText.match(/As a (.+?),/i)
      const role = roleMatch ? roleMatch[1].trim() : 'इंजीनियर'
      return s.translation(role)
    }
  }

  // 7. STAR Behavioral Questions
  for (const b of STAR_QUESTIONS) {
    if (b.pattern.test(cleanText)) {
      return b.translation
    }
  }

  // 8. General Conversational Fallback Rule
  let out = cleanText
    .replace(/^Explain the difference between\s+(.+?)\s+and\s+(.+?)(?:\.|\?|$)/i, '$1 और $2 में क्या फर्क है?')
    .replace(/^What is the difference between\s+(.+?)\s+and\s+(.+?)(?:\.|\?|$)/i, '$1 और $2 में क्या मुख्य अंतर है?')
    .replace(/^Explain how\s+/i, 'आसान शब्दों में समझाइए कि कैसे ')
    .replace(/^What is the worst-case time complexity of\s+/i, 'की सबसे खराब टाइम कॉम्प्लेक्सिटी (Worst-case) क्या होगी: ')
    .replace(/^What is the time complexity of\s+/i, 'की टाइम कॉम्प्लेक्सिटी क्या होगी: ')
    .replace(/^How would you architect\s+/i, 'आप कैसे डिजाइन करेंगे: ')
    .replace(/^How does\s+(.+?)\s+work/i, '$1 कैसे काम करता है?')
    .replace(/^How does\s+/i, 'कैसे काम करता है: ')
    .replace(/^Describe a situation where\s+/i, 'उस स्थिति के बारे में बताएं जब ')
    .replace(/^Describe a challenging\s+/i, 'किसी ऐसे मुश्किल समय के बारे में बताएं जब ')
    .replace(/^Tell me about a time\s+/i, 'उस समय का उदाहरण दीजिए जब ')
    .replace(/^Can you tell me about\s+/i, 'क्या आप बता सकते हैं ')
    .replace(/^What happens when\s+/i, 'क्या होता है जब ')
    .replace(/^Why does\s+/i, 'ऐसा क्यों होता है कि ')
    .replace(/\bin the context of\b/gi, 'के संदर्भ में')
    .replace(/\bfault-tolerant\b/gi, 'मजबूत / खराबी से सुरक्षित (Fault-Tolerant)')
    .replace(/\bhigh-concurrency\b/gi, 'भारी ट्रैफिक (High Concurrency)')
    .replace(/\btrade-offs\b/gi, 'फायदे और नुकसान (Trade-offs)')
    .replace(/\bbottleneck\b/gi, 'रुकावट (Bottleneck)')
    .replace(/\bzero data loss\b/gi, 'डेटा सुरक्षित (Zero Data Loss)')

  return out
}
