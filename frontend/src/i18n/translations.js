import { useUIStore } from '../store/uiStore';

export const translations = {
  'en-IN': {
    // TopNav
    nav_upload: 'Upload',
    nav_trends: 'Health Insights',
    nav_diet_plan: 'Diet Plan',
    nav_sharing: 'Shared Links',
    nav_profiles: 'Profiles / Patients',
    nav_select_profile: '+ Select Profile',
    nav_logout: 'Log Out',

    // Header & Greeting
    hi_greeting: 'Hi',
    health_overview_sub: "Here's {name}'s health overview",
    report_date_label: 'Report Date',
    download_report_btn: 'Download Report',
    share_report_btn: 'Share Report',

    // Metric Cards
    ai_health_score: 'AI Health Score',
    abnormal_parameters: 'Abnormal Parameters',
    normal_parameters: 'Normal Parameters',
    total_parameters: 'Total Parameters',
    needs_attention: 'Needs Attention',
    within_range: 'Within Range',
    analyzed: 'Analyzed',
    excellent: 'Excellent',

    // Section Titles
    health_overview_title: 'Health Overview',
    parameter_status_title: 'Parameter Status',
    trends_over_time_title: 'Trends Over Time',
    ai_insight_title: 'AI Insight',
    top_recommendations_title: 'Top Recommendations for {name}',

    // Status Badges
    status_high: 'High',
    status_normal: 'Normal',
    status_low: 'Low',
    status_abnormal: 'Abnormal',

    // Actions
    view_all: 'View All',
    view_full_table: 'View Full Table',
    all: 'All',
    abnormal: 'Abnormal',
    normal: 'Normal',
    search_placeholder: 'Search parameters...',
    close: 'Close',

    // Recommendations Titles
    rec_balanced_diet: 'Balanced Diet',
    rec_stay_hydrated: 'Stay Hydrated',
    rec_regular_exercise: 'Regular Exercise',
    rec_vet_checkup: 'Vet Check-up',
    rec_monitor_symptoms: 'Monitor Symptoms',

    // Health Insights Page
    health_insights_page_title: 'Health Insights & Trends',
    longitudinal_sub: 'Longitudinal parameter tracking across lab reports for {name}',
    overall_health_trend: 'Overall Health Score Trend',
    show_more: 'Show More ({count} rest parameters)',
    show_less: 'Show Less',
    complete_health_insight_precautions: 'Complete Health Insight & Precautions',
    plain_english_explanations: 'Plain-English Medical Term Explanations',
    diet_nutrition_recommendations: 'Diet & Nutrition Recommendations',
    regenerate_insights: 'Regenerate Insights',
    recommended_foods: 'Recommended Foods & Nutrients',
    foods_to_avoid: 'Foods & Ingredients to Limit or Avoid',

    // Upload Page
    upload_page_title: 'Upload Patient Lab Report',
    upload_drag_drop: 'Drag & drop report here',
    upload_browse: 'Browse Files',
    upload_analyze_btn: 'Analyze Report',

    // Footer
    ai_disclaimer: 'This report is AI-generated and not a substitute for professional veterinary advice.',
  },

  'hi-IN': {
    // TopNav
    nav_upload: 'अपलोड',
    nav_trends: 'स्वास्थ्य अंतर्दृष्टि',
    nav_sharing: 'शेयर लिंक',
    nav_profiles: 'प्रोफाइल / मरीज',
    nav_select_profile: '+ प्रोफाइल चुनें',
    nav_logout: 'लॉग आउट',

    // Header & Greeting
    hi_greeting: 'नमस्ते',
    health_overview_sub: 'यहाँ {name} का स्वास्थ्य विवरण है',
    report_date_label: 'रिपोर्ट तिथि',
    download_report_btn: 'रिपोर्ट डाउनलोड करें',
    share_report_btn: 'रिपोर्ट शेयर करें',

    // Metric Cards
    ai_health_score: 'एआई स्वास्थ्य स्कोर',
    abnormal_parameters: 'असामान्य पैरामीटर',
    normal_parameters: 'सामान्य पैरामीटर',
    total_parameters: 'कुल पैरामीटर',
    needs_attention: 'ध्यान दें',
    within_range: 'सीमा में',
    analyzed: 'विश्लेषित',
    excellent: 'उत्कृष्ट',

    // Section Titles
    health_overview_title: 'स्वास्थ्य अवलोकन',
    parameter_status_title: 'पैरामीटर स्थिति',
    trends_over_time_title: 'समय के साथ रुझान',
    ai_insight_title: 'एआई अंतर्दृष्टि',
    top_recommendations_title: '{name} के लिए प्रमुख सिफारिशें',

    // Status Badges
    status_high: 'उच्च',
    status_normal: 'सामान्य',
    status_low: 'निम्न',
    status_abnormal: 'असामान्य',

    // Actions
    view_all: 'सभी देखें',
    view_full_table: 'पूर्ण तालिका देखें',
    all: 'सभी',
    abnormal: 'असामान्य',
    normal: 'सामान्य',
    search_placeholder: 'पैरामीटर खोजें...',
    close: 'बंद करें',

    // Recommendations Titles
    rec_balanced_diet: 'संतुलित आहार',
    rec_stay_hydrated: 'पर्याप्त पानी पिएं',
    rec_regular_exercise: 'नियमित व्यायाम',
    rec_vet_checkup: 'पशुचिकित्सक जांच',
    rec_monitor_symptoms: 'लक्षणों की निगरानी',

    // Health Insights Page
    health_insights_page_title: 'स्वास्थ्य अंतर्दृष्टि और रुझान',
    longitudinal_sub: '{name} के लिए लैब रिपोर्ट में अनुदैर्ध्य पैरामीटर ट्रैकिंग',
    overall_health_trend: 'समग्र स्वास्थ्य स्कोर रुझान',
    show_more: 'और दिखाएं ({count} शेष पैरामीटर)',
    show_less: 'कम दिखाएं',
    complete_health_insight_precautions: 'संपूर्ण स्वास्थ्य अंतर्दृष्टि और सावधानियां',
    plain_english_explanations: 'सरल भाषा में चिकित्सा पदों की व्याख्या',
    diet_nutrition_recommendations: 'आहार और पोषण सिफारिशें',
    regenerate_insights: 'पुनः अंतर्दृष्टि उत्पन्न करें',
    recommended_foods: 'अनुशंसित खाद्य पदार्थ और पोषक तत्व',
    foods_to_avoid: 'सीमित या परहेज योग्य खाद्य पदार्थ',

    // Upload Page
    upload_page_title: 'मरीज की लैब रिपोर्ट अपलोड करें',
    upload_drag_drop: 'यहाँ रिपोर्ट खींचें और छोड़ें',
    upload_browse: 'फ़ाइलें ब्राउज़ करें',
    upload_analyze_btn: 'रिपोर्ट का विश्लेषण करें',

    // Footer
    ai_disclaimer: 'यह रिपोर्ट एआई-जनरेटेड है और पेशेवर चिकित्सा सलाह का विकल्प नहीं है।',
  },

  'mr-IN': {
    // TopNav
    nav_upload: 'अपलोड',
    nav_trends: 'आरोग्य अंतर्दृष्टी',
    nav_sharing: 'शेअर लिंक्स',
    nav_profiles: 'प्रोफाईल / रुग्ण',
    nav_select_profile: '+ प्रोफाईल निवडा',
    nav_logout: 'लॉग आउट',

    // Header & Greeting
    hi_greeting: 'नमस्कार',
    health_overview_sub: 'येथे {name} चा आरोग्य तपशील आहे',
    report_date_label: 'अहवाल तारीख',
    download_report_btn: 'अहवाल डाउनलोड करा',
    share_report_btn: 'अहवाल शेयर करा',

    // Metric Cards
    ai_health_score: 'एआय हेल्थ स्कोर',
    abnormal_parameters: 'असामान्य पॅरामीटर्स',
    normal_parameters: 'सामान्य पॅरामीटर्स',
    total_parameters: 'एकूण पॅरामीटर्स',
    needs_attention: 'लक्ष देणे आवश्यक',
    within_range: 'मर्यादेत',
    analyzed: 'विश्लेषित',
    excellent: 'उत्कृष्ट',

    // Section Titles
    health_overview_title: 'आरोग्य आढावा',
    parameter_status_title: 'पॅरामीटर स्थिती',
    trends_over_time_title: 'काळानुसार कल',
    ai_insight_title: 'एआय अंतर्दृष्टी',
    top_recommendations_title: '{name} साठी मुख्य शिफारसी',

    // Status Badges
    status_high: 'जास्त',
    status_normal: 'सामान्य',
    status_low: 'कमी',
    status_abnormal: 'असामान्य',

    // Actions
    view_all: 'सर्व पहा',
    view_full_table: 'पूर्ण तक्ता पहा',
    all: 'सर्व',
    abnormal: 'असामान्य',
    normal: 'सामान्य',
    search_placeholder: 'पॅरामीटर्स शोधा...',
    close: 'बंद करा',

    // Recommendations Titles
    rec_balanced_diet: 'संतुलित आहार',
    rec_stay_hydrated: 'पुरेसे पाणी प्या',
    rec_regular_exercise: 'नियमित व्यायाम',
    rec_vet_checkup: 'डॉक्टरांची तपासणी',
    rec_monitor_symptoms: 'लक्षणांचे निरीक्षण करा',

    // Health Insights Page
    health_insights_page_title: 'आरोग्य अंतर्दृष्टी आणि कल',
    longitudinal_sub: '{name} साठी लॅब अहवालांमधील पॅरामीटर ट्रॅकिंग',
    overall_health_trend: 'एकूण आरोग्य स्कोर कल',
    show_more: 'आणखी दाखवा ({count} उर्वरित पॅरामीटर्स)',
    show_less: 'कमी दाखवा',
    complete_health_insight_precautions: 'संपूर्ण आरोग्य अंतर्दृष्टी आणि खबरदारी',
    plain_english_explanations: 'सोप्या भाषेतील वैद्यकीय व्याख्या',
    diet_nutrition_recommendations: 'आहार आणि पोषण शिफारसी',
    regenerate_insights: 'पुन्हा अंतर्दृष्टी तयार करा',
    recommended_foods: 'शीफारस केलेले अन्न आणि पोषक तत्वे',
    foods_to_avoid: 'टाळायचे किंवा मर्यादित करायचे अन्न',

    // Upload Page
    upload_page_title: 'रुग्णाची लॅब रिपोर्ट अपलोड करा',
    upload_drag_drop: 'येथे अहवाल ड्रॅग करा',
    upload_browse: 'फाईल्स शोधा',
    upload_analyze_btn: 'अहवालाचे विश्लेषण करा',

    // Footer
    ai_disclaimer: 'हा अहवाल एआय-द्वारे तयार केला आहे आणि डॉक्टरांच्या सल्ल्याचा पर्याय नाही.',
  },

  'gu-IN': {
    nav_upload: 'અપલોડ',
    nav_trends: 'આરોગ્ય આંતરદ્રષ્ટિ',
    nav_sharing: 'શેર કરેલ લિંક્સ',
    nav_profiles: 'પ્રોફાઇલ / દર્દીઓ',
    hi_greeting: 'નમસ્તે',
    report_date_label: 'અહેવાલ તારીખ',
    download_report_btn: 'અહેવાલ ડાઉનલોડ કરો',
    share_report_btn: 'અહેવાલ શેર કરો',
    ai_health_score: 'એઆઈ હેલ્થ સ્કોર',
    abnormal_parameters: 'અસામાન્ય પરિમાણો',
    normal_parameters: 'સામાન્ય પરિમાણો',
    total_parameters: 'કુલ પરિમાણો',
    needs_attention: 'ધ્યાન જરૂરી',
    within_range: 'મર્યાદામાં',
    analyzed: 'વિશ્લેષિત',
    excellent: 'ઉત્કૃષ્ટ',
    health_overview_title: 'આરોગ્ય વિહંગાવલોકન',
    parameter_status_title: 'પરિમાણ સ્થિતિ',
    top_recommendations_title: '{name} માટે મુખ્ય ભલામણો',
    ai_disclaimer: 'આ અહેવાલ AI-જનરેટેડ છે અને વ્યાવસાયિક તબીબી સલાહનો વિકલ્પ નથી.',
  },

  'ta-IN': {
    nav_upload: 'பதிவேற்று',
    nav_trends: 'சுகாதார நுண்ணறிவு',
    nav_sharing: 'பகிரப்பட்ட இணைப்புகள்',
    nav_profiles: 'சுயவிவரங்கள்',
    hi_greeting: 'வணக்கம்',
    report_date_label: 'அறிக்கை தேதி',
    download_report_btn: 'அறிக்கையைப் பதிவிறக்கவும்',
    share_report_btn: 'அறிக்கையைப் பகிரவும்',
    ai_health_score: 'AI சுகாதார மதிப்பெண்',
    abnormal_parameters: 'அசாதாரண அளவீடுகள்',
    normal_parameters: 'சாதாரண அளவீடுகள்',
    total_parameters: 'மொத்த அளவீடுகள்',
    needs_attention: 'கவனம் தேவை',
    within_range: 'எல்லைக்குள்',
    analyzed: 'பகுப்பாய்வு செய்யப்பட்டது',
    excellent: 'சிறந்தது',
    health_overview_title: 'சுகாதார மேலோட்டம்',
    parameter_status_title: 'அளவீட்டு நிலை',
    top_recommendations_title: '{name} க்கான பரிந்துரைகள்',
    ai_disclaimer: 'இந்த அறிக்கை AI ஆல் உருவாக்கப்பட்டது, மருத்துவ ஆலோசனையல்ல.',
  },

  'te-IN': {
    nav_upload: 'అప్‌లోడ్',
    nav_trends: 'ఆరోగ్య నివేదికలు',
    nav_sharing: 'షేర్డ్ లింక్స్',
    nav_profiles: 'ప్రొఫైల్స్',
    hi_greeting: 'నమస్కారం',
    report_date_label: 'రిపోర్ట్ తేదీ',
    download_report_btn: 'రిపోర్ట్ డౌన్‌లోడ్ చేయండి',
    share_report_btn: 'రిపోర్ట్ షేర్ చేయండి',
    ai_health_score: 'AI హెల్త్ స్కోర్',
    abnormal_parameters: 'అసాధారణ పరిమాణాలు',
    normal_parameters: 'సాధారణ పరిమాణాలు',
    total_parameters: 'మొత్తం పరిమాణాలు',
    needs_attention: 'శ్రద్ధ వహించండి',
    within_range: 'పరిమితిలో',
    analyzed: 'విశ్లేషించబడింది',
    excellent: 'అద్భుతమైనది',
    health_overview_title: 'ఆరోగ్య అవలోకనం',
    parameter_status_title: 'పరిమాణ స్థితి',
    top_recommendations_title: '{name} కోసం సిఫార్సులు',
    ai_disclaimer: 'ఈ నివేదిక AI ద్వారా రూపొందించబడింది.',
  },

  'bn-IN': {
    nav_upload: 'আপলোড',
    nav_trends: 'স্বাস্থ্য ইনসাইট',
    nav_sharing: 'শেয়ার করা লিঙ্ক',
    nav_profiles: 'প্রোফাইল',
    hi_greeting: 'হ্যালো',
    report_date_label: 'রিপোর্টের তারিখ',
    download_report_btn: 'রিপোর্ট ডাউনলোড করুন',
    share_report_btn: 'রিপোর্ট শেয়ার করুন',
    ai_health_score: 'এআই হেলথ স্কোর',
    abnormal_parameters: 'অস্বাভাবিক প্যারামিটার',
    normal_parameters: 'স্বাভাবিক প্যারামিটার',
    total_parameters: 'মোট প্যারামিটার',
    needs_attention: 'মনোযোগ প্রয়োজন',
    within_range: 'সীমার মধ্যে',
    analyzed: 'বিশ্লেষিত',
    excellent: 'চমৎকার',
    health_overview_title: 'স্বাস্থ্য ওভারভিউ',
    parameter_status_title: 'প্যারামিটার স্ট্যাটাস',
    top_recommendations_title: '{name} এর জন্য সুপারিশ',
    ai_disclaimer: 'এই রিপোর্টটি এআই-জেনারেটেড।',
  },
};

export function useTranslation() {
  const activeLanguage = useUIStore((s) => s.activeLanguage) || 'en-IN';

  const t = (key, fallback = key, params = {}) => {
    const langDict = translations[activeLanguage] || translations['en-IN'];
    let text = langDict?.[key] || translations['en-IN']?.[key] || fallback;

    Object.keys(params).forEach((paramKey) => {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), params[paramKey]);
    });

    return text;
  };

  return { t, activeLanguage };
}
