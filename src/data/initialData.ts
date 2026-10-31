import { FAQItem } from '../types';

export const sampleFAQs: FAQItem[] = [
  {
    id: 'faq-1',
    questionEn: 'How do I submit an online village complaint?',
    questionHi: 'ऑनलाइन ग्रामीण शिकायत कैसे दर्ज करें?',
    answerEn: 'Click on "Submit Complaint", select the appropriate problem category (e.g. Street Light, Road, Water Supply), describe the issue, enter your Ward and Landmark, optionally attach a photo, and hit Submit. A unique tracking ID will be generated immediately.',
    answerHi: '"शिकायत दर्ज करें" बटन पर क्लिक करें, समस्या की श्रेणी चुनें (जैसे स्ट्रीट लाइट, सड़क, नल-जल), विवरण लिखें, वार्ड संख्या व लैंडमार्क दर्ज करें, फोटो संलग्न करें और सबमिट करें। तुरंत पावती क्रमांक प्राप्त होगा।',
  },
  {
    id: 'faq-2',
    questionEn: 'Where can I find my Complaint ID?',
    questionHi: 'शिकायत क्रमांक (Complaint ID) कहाँ मिलेगा?',
    answerEn: 'Immediately after submitting, your Complaint ID (e.g. ID-20260923-00125) appears on screen, in your "My Complaints" tab, and is sent via SMS to your registered mobile number.',
    answerHi: 'शिकायत सबमिट करते ही स्क्रीन पर पावती रसीद में, "मेरी शिकायतें" मेनू में तथा आपके पंजीकृत मोबाइल पर एसएमएस द्वारा शिकायत क्रमांक प्राप्त होता है।',
  },
  {
    id: 'faq-3',
    questionEn: 'How can I track the live status of my complaint?',
    questionHi: 'शिकायत की वर्तमान स्थिति कैसे ट्रैक करें?',
    answerEn: 'Go to the "Track Complaint" page and enter your Complaint ID. You will see which officer currently holds your file, the exact due date, and a complete chronological timeline of every step taken.',
    answerHi: '"ट्रैक करें" पृष्ठ पर जाकर अपना शिकायत क्रमांक दर्ज करें। आपको वर्तमान जांच अधिकारी, कार्रवाई की अंतिम तिथि और पूरी टाइमलाइन दिखाई देगी।',
  },
  {
    id: 'faq-4',
    questionEn: 'When and how does a complaint automatically forward/escalate?',
    questionHi: 'शिकायत स्वतः अग्रेषित (Auto-forward) कब और कैसे होती है?',
    answerEn: 'Under the GramSetu 7-day rule: If the Gram Panchayat Officer does not act within 7 days, the system automatically transfers the grievance to the Mukhiya. If unresolved, it moves to the Block Development Officer (BDO), and finally to the District Magistrate (DM).',
    answerHi: 'ग्राम सेतु 7-दिवसीय नियम के तहत: यदि पंचायत पदाधिकारी 7 दिनों में कार्रवाई नहीं करते, तो प्रणाली शिकायत स्वतः मुखिया जी को भेज देती है। फिर भी हल न होने पर बीडीओ और अंत में डीएम (जिलाधिकारी) को अग्रेषित हो जाती है।',
  },
  {
    id: 'faq-5',
    questionEn: 'What if my complaint is marked resolved but the work was not done properly?',
    questionHi: 'यदि काम अधूरा रहा और शिकायत निस्तारित दिखा दी गई तो क्या करें?',
    answerEn: 'In the "Feedback & Help" section, select "No" or "Partially" under the resolution status. The system flags this directly to the Block Officer with your remarks, prompting a secondary inspection.',
    answerHi: '"फीडबैक एवं सहायता" पृष्ठ पर जाकर समाधान स्थिति में "नहीं" अथवा "आंशिक" चुनें। सिस्टम आपकी आपत्ति सीधे प्रखंड पदाधिकारी को स्थलीय पुनः-समीक्षा हेतु भेज देता है।',
  },
];