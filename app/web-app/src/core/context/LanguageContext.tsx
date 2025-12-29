import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'am';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
    en: {
        'nav.howItWorks': 'How it works',
        'nav.features': 'Features',
        'nav.login': 'Organizer Login',
        'nav.register': 'Create Organizer Account',
        'hero.badge': 'THE GOLD STANDARD FOR EVENT TICKETING',
        'hero.title': 'Sell Tickets. Manage Events. Get Paid — All in One Platform.',
        'hero.subtitle': 'Built for Ethiopian events — from concerts and conferences to sports and church gatherings.',
        'payment.badge': 'I LOVED DIGITAL PAYMENTS',
        'payment.title': "Ethiopia's Most Advanced Payment Integration.",
        'payment.subtitle': "We've built a seamless bridge between your event and the nation's biggest wallets. Accept Telebirr, CBE Birr, and more with instant verification.",
        'steps.title': 'Streamlined Workflow',
        'steps.subtitle': "From creation to validation, we've got you covered.",
        'steps.1.title': 'Create Event',
        'steps.1.desc': 'Set up your event page, ticket tiers, and pricing in minutes.',
        'steps.2.title': 'Get Admin Approval',
        'steps.2.desc': 'Secure verification from our team to protect you and your fans.',
        'steps.3.title': 'Sell Tickets Online',
        'steps.3.desc': 'Accept payments via Telebirr, CBE Birr, and other local options.',
        'steps.4.title': 'Scan & Validate',
        'steps.4.desc': 'Use our mobile scanner app to verify tickets at the gate.',
        'features.title': 'Tools designed for Event Professionals.',
        'features.1.title': 'Digital Ticketing & QR Validation',
        'features.1.desc': 'Instant ticket delivery and fraud-proof scanning at the heavy-traffic gates.',
        'features.2.title': 'Seat Map & Capacity Control',
        'features.2.desc': 'Customizable seating charts and real-time inventory management.',
        'features.3.title': 'Real-time Sales Dashboard',
        'features.3.desc': 'Monitor ticket velocity and revenue as it happens.',
        'features.4.title': 'Marketing Campaigns',
        'features.4.desc': 'Powerful tools to run promo codes, early-bird discounts, and track referral links.',
        'features.5.title': 'Automated Payouts',
        'features.5.desc': 'Fast settlements to your local bank account or mobile wallet.',
        'features.6.title': 'Fraud Protection',
        'features.6.desc': 'Advanced tracking to prevent scalping and double-entry.',
        'stats.revenue': 'LIVE REVENUE',
        'stats.sales': 'LIVE SALES',
        'testimonials.title': 'Loved by Organizers',
        'testimonials.subtitle': 'Join hundreds of successful event hosts across Ethiopia.',
        'trust.title': 'Trust built on Compliance.',
        'trust.subtitle': 'We operate with full transparency to ensure every event is a success. Our automated settlement system ensures you get paid on time, every time.',
        'trust.btn': 'Learn About Payouts',
        'trust.1.title': 'Local Payment Integrations',
        'trust.1.desc': 'Secure settlement via Telebirr, CBE Birr, and CBE.',
        'trust.2.title': 'Secure Transactions',
        'trust.2.desc': 'End-to-end encryption for all payments.',
        'trust.3.title': 'Admin-Approved Events Only',
        'trust.3.desc': 'A verified marketplace for genuine organizers.',
        'trust.4.title': 'Transparent Fees',
        'trust.4.desc': 'No hidden costs. You know exactly what you take home.',
        'faq.title': 'Common Questions',
        'faq.subtitle': 'Everything you need to know about the platform.',
        'faq.1.q': 'How long does it take to get paid?',
        'faq.1.a': 'We offer daily settlements. Once an event is completed, payouts are typically processed within 24-48 hours directly to your bank account or mobile wallet.',
        'faq.2.q': 'What are the platform fees?',
        'faq.2.a': 'We charge a standard 10% commission on every ticket sold. This includes payment processing fees and platform usage. There are zero upfront costs.',
        'faq.3.q': 'Can I scan tickets offline?',
        'faq.3.a': "Yes! Our mobile scanner app supports offline validation for areas with poor connectivity. Once you're back online, the data syncs automatically.",
        'faq.4.q': 'Is identity verification required?',
        'faq.4.a': 'Yes, all organizers must undergo a business or identity verification process to ensure a safe marketplace for ticket buyers.',
        'footer.desc': "Ethiopia's leading digital ticketing platform. Empowering event organizers with technology that works.",
        'footer.platform': 'Platform',
        'footer.pricing': 'Pricing',
        'footer.caseStudies': 'Case Studies',
        'footer.support': 'Support',
        'footer.helpCenter': 'Help Center',
        'footer.contactUs': 'Contact Us',
        'footer.systemStatus': 'System Status',
        'footer.rights': 'ALL RIGHTS RESERVED.',
        'auth.applyTitle': 'Apply as Organizer',
        'auth.welcomeTitle': 'Welcome Back',
        'auth.verifyTitle': 'Verify Identity',
        'auth.applyDesc': 'Fill in your business details to get started',
        'auth.welcomeDesc': 'Enter your registered phone number',
        'auth.verifyDesc': 'Enter the 6-digit code sent to',
        'auth.orgName': 'Organization Name',
        'auth.orgNamePlaceholder': 'Legal Entity Name',
        'auth.city': 'City',
        'auth.cityPlaceholder': 'Addis Ababa',
        'auth.email': 'Contact Email',
        'auth.emailPlaceholder': 'gmail/outlook...',
        'auth.payout': 'Payout (Bank / Mobile Account)',
        'auth.payoutPlaceholder': 'CBE / TeleBirr details...',
        'auth.phone': 'Phone Number',
        'auth.phonePlaceholder': '+251 9... or 09...',
        'auth.otpLabel': 'Verification Code',
        'auth.resend': "Didn't receive code?",
        'auth.resendBtn': 'Resend',
        'auth.loginBtn': 'Login & Send OTP',
        'auth.registerBtn': 'Apply & Send Verification',
        'auth.verifyBtn': 'Verify & Sign In',
        'auth.noAccountError': 'Organizer account not found. Please click "Create Organizer Account" to apply.',
    },
    am: {
        'nav.howItWorks': 'እንዴት እንደሚሰራ',
        'nav.features': 'ባህሪያት',
        'nav.login': 'አዘጋጅ ግባ',
        'nav.register': 'አዘጋጅ መለያ ፍጠር',
        'hero.badge': 'የዝግጅት ትኬት ሽያጭ ወርቃማው ደረጃ',
        'hero.title': 'ትኬቶችን ይሽጡ። ዝግጅቶችን ያስተዳድሩ። ክፍያ ያግኙ — ሁሉም በአንድ መድረክ።',
        'hero.subtitle': 'ለኢትዮጵያ ዝግጅቶች የተገነባ — ከኮንሰርቶች እና ኮንፈረንሶች እስከ ስፖርት እና የቤተክርስቲያን ስብሰባዎች።',
        'payment.badge': 'ዲጂታል ክፍያዎችን ወደድኩ',
        'payment.title': 'የኢትዮጵያ እጅግ የላቀ የክፍያ ትስስር።',
        'payment.subtitle': 'በእርስዎ ዝግጅት እና በሀገሪቱ ትላልቅ የክፍያ አማራጮች መካከል እንከን የለሽ ድልድይ ገንብተናል። ቴሌብርን፣ ሲቢኢ ብርን እና ሌሎችንም በፈጣን ማረጋገጫ ይቀበሉ።',
        'steps.title': 'የተቀላጠፈ የስራ ሂደት',
        'steps.subtitle': 'ከመፍጠር ጀምሮ እስከ ማረጋገጥ ድረስ ሁሉንም እንሸፍናለን።',
        'steps.1.title': 'ዝግጅት ይፍጠሩ',
        'steps.1.desc': 'የዝግጅት ገጽዎን፣ የትኬት ዓይነቶችን እና ዋጋዎችን በደቂቃዎች ውስጥ ያዘጋጁ።',
        'steps.2.title': 'የአስተዳዳሪ ፈቃድ ያግኙ',
        'steps.2.desc': 'እርስዎን እና ደንበኞችዎን ለመጠበቅ ከቡድናችን ደህንነቱ የተጠበቀ ማረጋገጫ ያግኙ።',
        'steps.3.title': 'ትኬቶችን በመስመር ላይ ይሽጡ',
        'steps.3.desc': 'በቴሌብር፣ በሲቢኢ ብር እና በሌሎች የአገር ውስጥ አማራጮች ክፍያዎችን ይቀበሉ።',
        'steps.4.title': 'ይቃኙ እና ያረጋግጡ',
        'steps.4.desc': 'በትላልቅ በሮች ላይ ትኬቶችን ለማረጋገጥ የእኛን የሞባይል መቃኛ መተግበሪያ ይጠቀሙ።',
        'features.title': 'ለዝግጅት ባለሙያዎች ተብለው የተሰሩ መሳሪያዎች።',
        'features.1.title': 'ዲጂታል ትኬት እና የQR ማረጋገጫ',
        'features.1.desc': 'ፈጣን የትኬት አቅርቦት እና ማጭበርበርን የሚከላከል የQR ቅኝት።',
        'features.2.title': 'የመቀመጫ ካርታ እና የአቅም ቁጥጥር',
        'features.2.desc': 'ሊበጁ የሚችሉ የመቀመጫ ገበታዎች እና የእውነተኛ ጊዜ የትኬት ክምችት አስተዳደር።',
        'features.3.title': 'የእውነተኛ ጊዜ የሽያጭ ዳሽቦርድ',
        'features.3.desc': 'የትኬት ሽያጭ ፍጥነትን እና ገቢን ወዲያውኑ ይቆጣጠሩ።',
        'features.4.title': 'የግብይት ዘመቻዎች',
        'features.4.desc': 'የማስተዋወቂያ ኮዶችን፣ ቀደምት ቅናሾችን እና የሪፈራል ሊንኮችን ለመከታተል የሚያስችሉ መሳሪያዎች።',
        'features.5.title': 'አውቶማቲክ ክፍያዎች',
        'features.5.desc': 'ወደ አገር ውስጥ የባንክ ሂሳብዎ ወይም የሞባይል ቦርሳዎ ፈጣን የገቢ ዝውውር።',
        'features.6.title': 'የማጭበርበር ጥበቃ',
        'features.6.desc': 'ትኬቶችን ደግሞ እንዳይጠቀሙ የሚከላከል የላቀ ክትትል።',
        'stats.revenue': 'የቀጥታ ገቢ',
        'stats.sales': 'የቀጥታ ሽያጭ',
        'testimonials.title': 'በአዘጋጆች የተወደደ',
        'testimonials.subtitle': 'በመላው ኢትዮጵያ በመቶዎች የሚቆጠሩ ስኬታማ የዝግጅት አዘጋጆችን ይቀላቀሉ።',
        'trust.title': 'በታማኝነት ላይ የተገነባ።',
        'trust.subtitle': 'እያንዳንዱ ዝግጅት ስኬታማ እንዲሆን ሙሉ ግልጽነት ባለው መልኩ እንሰራለን። የእኛ አውቶማቲክ የክፍያ ስርዓት ገቢዎ በሰዓቱ እንዲደርስዎት ያረጋግጣል።',
        'trust.btn': 'ስለ ክፍያ አከፋፈል ይወቁ',
        'trust.1.title': 'የአገር ውስጥ የክፍያ ትስስሮች',
        'trust.1.desc': 'ደህንነቱ የተጠበቀ ክፍያ በቴሌብር፣ በሲቢኢ ብር እና በሲቢኢ በኩል።',
        'trust.2.title': 'ደህንነታቸው የተጠበቀ ግብይቶች',
        'trust.2.desc': 'ለሁሉም ክፍያዎች ከጫፍ እስከ ጫፍ የተመሰጠረ ጥበቃ።',
        'trust.3.title': 'በአስተዳዳሪ የተፈቀዱ ዝግጅቶች ብቻ',
        'trust.3.desc': 'ለእውነተኛ አዘጋጆች የተረጋገጠ የገበያ ቦታ።',
        'trust.4.title': 'ግልጽ ክፍያዎች',
        'trust.4.desc': 'ምንም የተደበቁ ወጪዎች የሉም። ወደ ቤትዎ የሚወስዱትን ገቢ በትክክል ያውቃሉ።',
        'faq.title': 'የተለመዱ ጥያቄዎች',
        'faq.subtitle': 'ስለ መድረኩ ማወቅ ያለብዎት ነገር ሁሉ።',
        'faq.1.q': 'ገቢዬን ለማግኘት ምን ያህል ጊዜ ይወስዳል?',
        'faq.1.a': 'ዕለታዊ ክፍያዎችን እናቀርባለን። አንድ ዝግጅት እንደተጠናቀቀ በ24-48 ሰዓታት ውስጥ ወደ ባንክ ሂሳብዎ ወይም የሞባይል ቦርሳዎ ይላካል።',
        'faq.2.q': 'የመድረኩ አገልግሎት ክፍያ ስንት ነው?',
        'faq.2.a': 'በሚሸጠው እያንዳንዱ ትኬት ላይ 10% ኮሚሽን እናስከፍላለን። ይህ የክፍያ ማስፈጸሚያ እና የመድረክ አጠቃቀም ክፍያዎችን ያካትታል። ምንም ቅድመ ክፍያ የለም።',
        'faq.3.q': 'ያለ ኢንተርኔት ትኬቶችን መቃኘት እችላለሁ?',
        'faq.3.a': "አዎ! የእኛ የሞባይል መቃኛ መተግበሪያ ኢንተርኔት በሌለባቸው ቦታዎች ትኬቶችን ማረጋገጥ ያስችላል። ኢንተርኔት ሲያገኙ መረጃው በራስ-ሰር ይተላለፋል።",
        'faq.4.q': 'የማንነት ማረጋገጫ ያስፈልጋል?',
        'faq.4.a': 'አዎ፣ ለትኬት ገዢዎች ደህንነቱ የተጠበቀ የገበያ ቦታ እንዲሆን ሁሉም አዘጋጆች የንግድ ወይም የማንነት ማረጋገጫ ማለፍ አለባቸው።',
        'footer.desc': "የኢትዮጵያ ቀዳሚ የዲጂታል ትኬት መድረክ። የዝግጅት አዘጋጆችን በሚሰሩ ቴክኖሎጂዎች ማብቃት።",
        'footer.platform': 'መድረክ',
        'footer.pricing': 'ዋጋ',
        'footer.caseStudies': 'ተሞክሮዎች',
        'footer.support': 'እርዳታ',
        'footer.helpCenter': 'የእርዳታ ማዕከል',
        'footer.contactUs': 'ያግኙን',
        'footer.systemStatus': 'የስርዓቱ ሁኔታ',
        'footer.rights': 'መብቱ በህግ የተጠበቀ ነው።',
        'auth.applyTitle': 'እንደ አዘጋጅ አመልክት',
        'auth.welcomeTitle': 'እንኳን ደህና መጡ',
        'auth.verifyTitle': 'ማንነትዎን ያረጋግጡ',
        'auth.applyDesc': 'ለመጀመር የእርስዎን ድርጅት ዝርዝሮች ይሙሉ',
        'auth.welcomeDesc': 'የተመዘገበበትን ስልክ ቁጥር ያስገቡ',
        'auth.verifyDesc': 'ወደዚህ ቁጥር የተላከውን 6 አሃዝ ኮድ ያስገቡ፡',
        'auth.orgName': 'የድርጅቱ ስም',
        'auth.orgNamePlaceholder': 'ህጋዊ የድርጅት ስም',
        'auth.city': 'ከተማ',
        'auth.cityPlaceholder': 'አዲስ አበባ',
        'auth.email': 'የግንኙነት ኢሜይል',
        'auth.emailPlaceholder': 'gmail/outlook...',
        'auth.payout': 'ገቢ የሚላክበት (ባንክ / የሞባይል ሂሳብ)',
        'auth.payoutPlaceholder': 'የሲቢኢ / የቴሌብር ዝርዝሮች...',
        'auth.phone': 'የስልክ ቁጥር',
        'auth.phonePlaceholder': '+251 9... ወይም 09...',
        'auth.otpLabel': 'የማረጋገጫ ኮድ',
        'auth.resend': "ኮዱ አልደረሰዎትም?",
        'auth.resendBtn': 'እንደገና ላክ',
        'auth.loginBtn': 'ግባ እና ኮድ ላክ',
        'auth.registerBtn': 'አመልክት እና ኮድ ላክ',
        'auth.verifyBtn': 'አረጋግጥ እና ግባ',
        'auth.noAccountError': 'የአዘጋጅ መለያ አልተገኘም። እባክዎ ለማመልከት "አዘጋጅ መለያ ፍጠር" የሚለውን ይጫኑ።',
    }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>((localStorage.getItem('language') as Language) || 'en');

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
        document.documentElement.lang = lang;
    };

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within LanguageProvider');
    return context;
};
