/**
 * SiteFooter — Professional footer for Polaris Arabia
 * Sections: Brand, Product, Legal, Resources, Social, Legal links
 * Bilingual (EN/AR), RTL-aware
 */
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Star, Twitter, Linkedin, Instagram, Mail,
  Shield, FileText, HelpCircle, ExternalLink
} from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function SiteFooter() {
  const { lang } = useLanguage();
  const isRTL = lang === 'ar';

  const t = {
    tagline: isRTL
      ? 'منصة الذكاء الاصطناعي للشركات الناشئة في منطقة الشرق الأوسط وشمال أفريقيا'
      : 'The AI-powered startup toolkit for MENA founders',
    product: isRTL ? 'المنتج' : 'Product',
    legal: isRTL ? 'قانوني' : 'Legal',
    resources: isRTL ? 'الموارد' : 'Resources',
    company: isRTL ? 'الشركة' : 'Company',
    tools: isRTL ? 'أدواتنا' : 'Our Tools',
    valuation: isRTL ? 'حاسبة التقييم' : 'Valuation Calculator',
    capTable: isRTL ? 'جدول الملكية' : 'Cap Table (ZestEquity)',
    esop: isRTL ? 'خطط خيارات الأسهم' : 'ESOP Plans',
    dilution: isRTL ? 'محاكي التخفيف' : 'Dilution Simulator',
    runway: isRTL ? 'مخطط الاستمرارية' : 'Runway Planner',
    pitchDeck: isRTL ? 'تقييم عرض الاستثمار' : 'Pitch Deck Evaluator',
    termsOfService: isRTL ? 'شروط الخدمة' : 'Terms of Service',
    privacyPolicy: isRTL ? 'سياسة الخصوصية' : 'Privacy Policy',
    disclaimer: isRTL ? 'إخلاء المسؤولية' : 'Disclaimer',
    glossary: isRTL ? 'المسرد' : 'Glossary',
    blog: isRTL ? 'المدونة' : 'Blog',
    faq: isRTL ? 'الأسئلة الشائعة' : 'FAQ',
    contactUs: isRTL ? 'تواصل معنا' : 'Contact Us',
    aboutUs: isRTL ? 'من نحن' : 'About Us',
    copyright: isRTL
      ? `© ${CURRENT_YEAR} بولاريس أرابيا. جميع الحقوق محفوظة.`
      : `© ${CURRENT_YEAR} Polaris Arabia. All rights reserved.`,
    financialDisclaimer: isRTL
      ? 'جميع الحسابات تقديرية فقط ولا تشكل مشورة مالية أو قانونية أو ضريبية. استشر متخصصاً مؤهلاً قبل اتخاذ أي قرارات استثمارية.'
      : 'All calculations are estimates only and do not constitute financial, legal, or tax advice. Consult a qualified professional before making investment decisions.',
    madeIn: isRTL ? 'صُنع بـ ❤️ في المملكة العربية السعودية' : 'Made with ❤️ in Saudi Arabia',
    pdplNote: isRTL
      ? 'نلتزم بنظام حماية البيانات الشخصية السعودي (PDPL)'
      : 'Compliant with Saudi Personal Data Protection Law (PDPL)',
  };

  return (
    <footer
      dir={isRTL ? 'rtl' : 'ltr'}
      className="border-t mt-auto"
      style={{ background: 'oklch(0.12 0.04 240)', borderColor: 'oklch(0.22 0.04 240)' }}
    >
      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {/* Brand column */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, oklch(0.62 0.22 30), oklch(0.60 0.24 290))' }}
            >
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-extrabold text-white text-base" style={{ fontFamily: "'Nunito', sans-serif" }}>
              Polaris Arabia
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'oklch(0.65 0.03 240)' }}>
            {t.tagline}
          </p>
          {/* Social links */}
          <div className="flex items-center gap-3 pt-1">
            {[
              { icon: Twitter, href: 'https://twitter.com/polarisarabia', label: 'Twitter' },
              { icon: Linkedin, href: 'https://linkedin.com/company/polarisarabia', label: 'LinkedIn' },
              { icon: Instagram, href: 'https://instagram.com/polarisarabia', label: 'Instagram' },
              { icon: Mail, href: 'mailto:hello@polarisarabia.com', label: 'Email' },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: 'oklch(0.20 0.04 240)', color: 'oklch(0.65 0.03 240)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'oklch(0.28 0.06 240)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'oklch(0.20 0.04 240)')}
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
          {/* PDPL badge */}
          <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: 'oklch(0.55 0.10 150)' }}>
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>{t.pdplNote}</span>
          </div>
        </div>

        {/* Product column */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'oklch(0.55 0.08 30)' }}>
            {t.product}
          </h4>
          {[
            { label: t.valuation, href: '/app#valuation' },
            { label: t.capTable, href: '/app#cap-table' },
            { label: t.esop, href: '/app#esop' },
            { label: t.dilution, href: '/app#dilution' },
            { label: t.runway, href: '/app#runway' },
            { label: t.pitchDeck, href: '/app#pitch-deck' },
          ].map(({ label, href }) => (
            <Link key={label} href={href}>
              <span
                className="text-sm cursor-pointer transition-colors block"
                style={{ color: 'oklch(0.65 0.03 240)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                onMouseLeave={e => (e.currentTarget.style.color = 'oklch(0.65 0.03 240)')}
              >
                {label}
              </span>
            </Link>
          ))}
        </div>

        {/* Resources column */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'oklch(0.55 0.08 30)' }}>
            {t.resources}
          </h4>
          {[
            { label: t.glossary, href: '/app#term-sheet', internal: true },
            { label: t.faq, href: '/faq', internal: true },
            { label: t.contactUs, href: 'mailto:hello@polarisarabia.com', internal: false },
            { label: t.aboutUs, href: 'https://polarisarabia.com/about', internal: false },
          ].map(({ label, href, internal }) => (
            internal ? (
              <Link key={label} href={href}>
                <span
                  className="text-sm cursor-pointer transition-colors block"
                  style={{ color: 'oklch(0.65 0.03 240)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'oklch(0.65 0.03 240)')}
                >
                  {label}
                </span>
              </Link>
            ) : (
              <a
                key={label}
                href={href}
                target={href.startsWith('mailto') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className="text-sm flex items-center gap-1 transition-colors"
                style={{ color: 'oklch(0.65 0.03 240)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                onMouseLeave={e => (e.currentTarget.style.color = 'oklch(0.65 0.03 240)')}
              >
                {label}
                {!href.startsWith('mailto') && <ExternalLink className="w-3 h-3 opacity-60" />}
              </a>
            )
          ))}
        </div>

        {/* Legal column */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'oklch(0.55 0.08 30)' }}>
            {t.legal}
          </h4>
          {[
            { label: t.termsOfService, href: '/terms', icon: FileText },
            { label: t.privacyPolicy, href: '/privacy', icon: Shield },
            { label: t.disclaimer, href: '/terms#disclaimer', icon: HelpCircle },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href}>
              <span
                className="text-sm cursor-pointer transition-colors flex items-center gap-1.5"
                style={{ color: 'oklch(0.65 0.03 240)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                onMouseLeave={e => (e.currentTarget.style.color = 'oklch(0.65 0.03 240)')}
              >
                <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
                {label}
              </span>
            </Link>
          ))}

          {/* App stores placeholder */}
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'oklch(0.22 0.04 240)' }}>
            <p className="text-xs mb-2" style={{ color: 'oklch(0.45 0.03 240)' }}>
              {isRTL ? 'قريباً على' : 'Coming soon on'}
            </p>
            <div className="flex flex-col gap-1.5">
              {['App Store', 'Google Play'].map(store => (
                <div
                  key={store}
                  className="text-xs px-3 py-1.5 rounded-md text-center"
                  style={{ background: 'oklch(0.18 0.04 240)', color: 'oklch(0.45 0.03 240)', border: '1px solid oklch(0.22 0.04 240)' }}
                >
                  {store}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="border-t px-6 py-5"
        style={{ borderColor: 'oklch(0.20 0.04 240)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-center md:text-start" style={{ color: 'oklch(0.45 0.03 240)' }}>
            {t.copyright}
          </p>
          <p className="text-xs text-center" style={{ color: 'oklch(0.40 0.03 240)', maxWidth: '480px' }}>
            {t.financialDisclaimer}
          </p>
          <p className="text-xs" style={{ color: 'oklch(0.45 0.03 240)' }}>
            {t.madeIn}
          </p>
        </div>
      </div>
    </footer>
  );
}
