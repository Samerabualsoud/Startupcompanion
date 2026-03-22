/**
 * Terms of Service — Polaris Arabia
 * Compliant with: Saudi E-Commerce Law (Royal Decree M/126, 2019),
 * Saudi Consumer Protection Law, and general Saudi commercial law.
 * Last updated: March 2026
 */
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import SiteFooter from '@/components/SiteFooter';
import { TrendingUp, ArrowLeft, ArrowRight, Shield, FileText, AlertTriangle, Scale } from 'lucide-react';

const LAST_UPDATED = 'March 22, 2026';
const LAST_UPDATED_AR = '٢٢ مارس ٢٠٢٦';

export default function TermsOfService() {
  const { isRTL } = useLanguage();
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const sections = isRTL ? [
    {
      id: 'acceptance',
      icon: FileText,
      title: '١. القبول والموافقة',
      content: `باستخدامك لمنصة بولاريس أرابيا ("المنصة"، "الخدمة")، المتاحة على polarisarabia.com وأي نطاقات فرعية ذات صلة، فإنك توافق على الالتزام بهذه الشروط والأحكام ("الشروط"). إذا كنت تستخدم المنصة نيابةً عن كيان قانوني، فإنك تُقر بأنك مخوّل بقبول هذه الشروط نيابةً عن ذلك الكيان.

إذا كنت لا توافق على أي من هذه الشروط، يُرجى التوقف عن استخدام المنصة فوراً. يُعدّ استمرارك في استخدام المنصة بعد نشر أي تعديلات قبولاً ضمنياً لتلك التعديلات.`,
    },
    {
      id: 'description',
      icon: Shield,
      title: '٢. وصف الخدمة',
      content: `تُقدّم بولاريس أرابيا مجموعة من الأدوات الرقمية المصممة لمساعدة رواد الأعمال والشركات الناشئة في منطقة الشرق الأوسط وشمال أفريقيا، وتشمل على سبيل المثال لا الحصر:

• حاسبات التقييم باستخدام أساليب متعددة (DCF، بطاقة الأداء، بيركوس، وغيرها)
• أدوات إدارة جدول الرأسمال (Cap Table) وتتبع التخفيف
• إدارة خطط خيارات أسهم الموظفين (ESOP)
• أدوات التحليل المالي وتخطيط الاستمرارية
• قوالب المستندات القانونية والتعليمية
• قاعدة بيانات المستثمرين والمسرّعات
• أدوات مدعومة بالذكاء الاصطناعي للتحليل والتوصيات

جميع الحسابات والتقارير والمعلومات المقدمة هي لأغراض تعليمية وتوجيهية فحسب، ولا تُشكّل مشورة مالية أو قانونية أو ضريبية أو استثمارية.`,
    },
    {
      id: 'eligibility',
      icon: Scale,
      title: '٣. أهلية الاستخدام',
      content: `لاستخدام المنصة، يجب أن:
• تكون بالغاً من العمر ١٨ عاماً على الأقل، أو سن الرشد القانوني في دولتك أيهما أكبر
• تمتلك الأهلية القانونية الكاملة لإبرام عقود ملزمة
• لا تكون ممنوعاً من استخدام الخدمة بموجب القوانين المعمول بها في المملكة العربية السعودية أو دولتك

تحتفظ بولاريس أرابيا بالحق في رفض تقديم الخدمة أو إنهاء الحسابات وفقاً لتقديرها المطلق.`,
    },
    {
      id: 'accounts',
      icon: Shield,
      title: '٤. الحسابات والأمان',
      content: `عند إنشاء حساب على المنصة، أنت مسؤول عن:
• الحفاظ على سرية بيانات الدخول وعدم مشاركتها مع أي طرف ثالث
• جميع الأنشطة التي تتم من خلال حسابك
• إخطارنا فوراً عند اشتباهك في أي وصول غير مصرح به

يحق لنا تعليق أو إنهاء حسابك في حال انتهاك هذه الشروط أو الاشتباه في أي نشاط احتيالي أو ضار.`,
    },
    {
      id: 'disclaimer',
      icon: AlertTriangle,
      title: '٥. إخلاء المسؤولية المالية والقانونية',
      content: `تُقدَّم جميع المعلومات والحسابات والتقارير على المنصة "كما هي" لأغراض تعليمية فحسب. لا تُعدّ هذه المعلومات:
• مشورة مالية أو استثمارية أو ضريبية أو محاسبية
• مشورة قانونية أو تنظيمية
• توصية بشراء أو بيع أي أوراق مالية أو أصول

تقييمات الشركات الناشئة تنطوي على عدم يقين كبير. النتائج المقدمة عبر المنصة هي تقديرات فحسب، وقد تختلف اختلافاً جوهرياً عن القيمة السوقية الفعلية. يُنصح بشدة باستشارة مستشار مالي أو قانوني مؤهل قبل اتخاذ أي قرارات استثمارية أو تجارية.`,
    },
    {
      id: 'ip',
      icon: Shield,
      title: '٦. الملكية الفكرية',
      content: `جميع المحتويات المتاحة على المنصة، بما في ذلك النصوص والرسومات والشعارات والأكواد البرمجية والخوارزميات والمنهجيات، هي ملك حصري لبولاريس أرابيا أو مرخصة لها، وتخضع لحماية قوانين حقوق الملكية الفكرية المعمول بها في المملكة العربية السعودية والمعاهدات الدولية ذات الصلة.

يُمنح المستخدمين ترخيصاً محدوداً وغير حصري وغير قابل للتحويل لاستخدام المنصة لأغراض شخصية وتجارية مشروعة. يُحظر تماماً نسخ أو توزيع أو تعديل أو إعادة بيع أي جزء من المنصة دون إذن كتابي مسبق.`,
    },
    {
      id: 'data',
      icon: Shield,
      title: '٧. البيانات والخصوصية',
      content: `تلتزم بولاريس أرابيا بنظام حماية البيانات الشخصية السعودي (PDPL) الصادر بالمرسوم الملكي م/١٩ والمُعدَّل بالمرسوم الملكي م/٣٧ لعام ١٤٤٣هـ. تُحدد سياسة الخصوصية الخاصة بنا كيفية جمع بياناتك واستخدامها وحمايتها. باستخدام المنصة، فإنك توافق على ممارسات معالجة البيانات المبينة في سياسة الخصوصية.`,
    },
    {
      id: 'prohibited',
      icon: AlertTriangle,
      title: '٨. الاستخدامات المحظورة',
      content: `يُحظر استخدام المنصة من أجل:
• أي نشاط غير قانوني أو يُشكّل انتهاكاً للقوانين السعودية أو الدولية
• نشر محتوى مضلل أو احتيالي أو مسيء
• محاولة الوصول غير المصرح به إلى أنظمة المنصة
• انتهاك حقوق الملكية الفكرية لأي طرف
• التلاعب بالبيانات أو الحسابات بقصد التضليل
• إعادة بيع الخدمة أو استخدامها تجارياً دون ترخيص مسبق`,
    },
    {
      id: 'limitation',
      icon: AlertTriangle,
      title: '٩. تحديد المسؤولية',
      content: `إلى أقصى حد يسمح به القانون، لن تكون بولاريس أرابيا مسؤولة عن أي أضرار مباشرة أو غير مباشرة أو عرضية أو تبعية أو خاصة ناجمة عن:
• استخدام المنصة أو عدم القدرة على استخدامها
• الاعتماد على المعلومات أو الحسابات المقدمة
• أي قرارات استثمارية أو تجارية تُتخذ بناءً على نتائج المنصة

لا يُعفي هذا البند من المسؤولية في حالات الغش أو الإهمال الجسيم وفق أحكام النظام السعودي.`,
    },
    {
      id: 'governing',
      icon: Scale,
      title: '١٠. القانون الواجب التطبيق وتسوية النزاعات',
      content: `تخضع هذه الشروط وتُفسَّر وفقاً لأنظمة المملكة العربية السعودية. في حال نشوء أي نزاع يتعلق بهذه الشروط أو استخدام المنصة، يتفق الطرفان على:
١. السعي أولاً إلى حل النزاع وداً خلال ٣٠ يوماً من إشعار النزاع
٢. إذا تعذّر الحل الودي، يُحال النزاع إلى التحكيم وفقاً للوائح مركز التحكيم التجاري لدول مجلس التعاون الخليجي
٣. تكون لغة التحكيم العربية ومكانه مدينة الرياض، المملكة العربية السعودية

لا يُخل ذلك بحق أي طرف في اللجوء إلى المحاكم المختصة للحصول على تدابير وقتية أو تحفظية.`,
    },
    {
      id: 'changes',
      icon: FileText,
      title: '١١. التعديلات على الشروط',
      content: `تحتفظ بولاريس أرابيا بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تعديلات جوهرية عبر البريد الإلكتروني المسجل أو عبر إشعار بارز على المنصة قبل ٣٠ يوماً على الأقل من سريانها. استمرارك في استخدام المنصة بعد نفاذ التعديلات يُعدّ قبولاً لها.`,
    },
    {
      id: 'contact',
      icon: FileText,
      title: '١٢. التواصل معنا',
      content: `لأي استفسارات أو شكاوى تتعلق بهذه الشروط، يُرجى التواصل معنا عبر:
البريد الإلكتروني: legal@polarisarabia.com
العنوان: المملكة العربية السعودية، الرياض`,
    },
  ] : [
    {
      id: 'acceptance',
      icon: FileText,
      title: '1. Acceptance of Terms',
      content: `By accessing or using the Polaris Arabia platform ("Platform", "Service"), available at polarisarabia.com and any related subdomains, you agree to be bound by these Terms of Service ("Terms"). If you are using the Platform on behalf of a legal entity, you represent that you have authority to bind that entity to these Terms.

If you do not agree to any of these Terms, please discontinue use of the Platform immediately. Your continued use of the Platform following the posting of any modifications constitutes your acceptance of those modifications.`,
    },
    {
      id: 'description',
      icon: Shield,
      title: '2. Description of Service',
      content: `Polaris Arabia provides a suite of digital tools designed to assist entrepreneurs and startups in the MENA region, including but not limited to:

• Startup valuation calculators using multiple methodologies (DCF, Scorecard, Berkus, VC Method, and others)
• Cap table management and dilution tracking tools
• Employee Stock Option Plan (ESOP) management
• Financial analysis and runway planning tools
• Legal document templates and educational resources
• Investor and accelerator databases
• AI-powered analysis and recommendation tools

All calculations, reports, and information provided are for educational and guidance purposes only and do not constitute financial, legal, tax, or investment advice.`,
    },
    {
      id: 'eligibility',
      icon: Scale,
      title: '3. Eligibility',
      content: `To use the Platform, you must:
• Be at least 18 years of age, or the legal age of majority in your jurisdiction, whichever is greater
• Have full legal capacity to enter into binding contracts
• Not be prohibited from using the Service under applicable laws of the Kingdom of Saudi Arabia or your jurisdiction

Polaris Arabia reserves the right to refuse service or terminate accounts at its sole discretion.`,
    },
    {
      id: 'accounts',
      icon: Shield,
      title: '4. Accounts and Security',
      content: `When creating an account on the Platform, you are responsible for:
• Maintaining the confidentiality of your login credentials and not sharing them with any third party
• All activities that occur under your account
• Notifying us immediately upon suspicion of any unauthorized access

We reserve the right to suspend or terminate your account for violation of these Terms or suspected fraudulent or harmful activity.`,
    },
    {
      id: 'disclaimer',
      icon: AlertTriangle,
      title: '5. Financial and Legal Disclaimer',
      content: `All information, calculations, and reports provided on the Platform are provided "as is" for educational purposes only. Such information does not constitute:
• Financial, investment, tax, or accounting advice
• Legal or regulatory advice
• A recommendation to buy or sell any securities or assets

Startup valuations involve significant uncertainty. Results provided through the Platform are estimates only and may differ materially from actual market value. We strongly recommend consulting a qualified financial or legal advisor before making any investment or business decisions.`,
    },
    {
      id: 'ip',
      icon: Shield,
      title: '6. Intellectual Property',
      content: `All content available on the Platform, including text, graphics, logos, source code, algorithms, and methodologies, is the exclusive property of Polaris Arabia or its licensors, and is protected under applicable intellectual property laws of the Kingdom of Saudi Arabia and relevant international treaties.

Users are granted a limited, non-exclusive, non-transferable license to use the Platform for legitimate personal and commercial purposes. Copying, distributing, modifying, or reselling any part of the Platform without prior written permission is strictly prohibited.`,
    },
    {
      id: 'data',
      icon: Shield,
      title: '7. Data and Privacy',
      content: `Polaris Arabia is committed to compliance with the Saudi Personal Data Protection Law (PDPL), issued by Royal Decree M/19 and amended by Royal Decree M/37 of 1443H. Our Privacy Policy describes how your data is collected, used, and protected. By using the Platform, you consent to the data processing practices described in our Privacy Policy.`,
    },
    {
      id: 'prohibited',
      icon: AlertTriangle,
      title: '8. Prohibited Uses',
      content: `You may not use the Platform for:
• Any activity that is illegal or violates Saudi or international law
• Publishing misleading, fraudulent, or harmful content
• Attempting unauthorized access to Platform systems
• Infringing the intellectual property rights of any party
• Manipulating data or calculations with intent to deceive
• Reselling the Service or using it commercially without prior license`,
    },
    {
      id: 'limitation',
      icon: AlertTriangle,
      title: '9. Limitation of Liability',
      content: `To the maximum extent permitted by law, Polaris Arabia shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from:
• Use of or inability to use the Platform
• Reliance on information or calculations provided
• Any investment or business decisions made based on Platform results

This limitation does not apply in cases of fraud or gross negligence under Saudi law.`,
    },
    {
      id: 'governing',
      icon: Scale,
      title: '10. Governing Law and Dispute Resolution',
      content: `These Terms are governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia. In the event of any dispute arising from these Terms or use of the Platform, the parties agree to:
1. First seek to resolve the dispute amicably within 30 days of a dispute notice
2. If amicable resolution fails, the dispute shall be referred to arbitration under the rules of the GCC Commercial Arbitration Centre
3. The language of arbitration shall be Arabic, and the seat shall be Riyadh, Kingdom of Saudi Arabia

This does not preclude either party from seeking interim or conservatory measures from competent courts.`,
    },
    {
      id: 'changes',
      icon: FileText,
      title: '11. Changes to Terms',
      content: `Polaris Arabia reserves the right to modify these Terms at any time. You will be notified of any material changes via your registered email address or a prominent notice on the Platform at least 30 days before they take effect. Your continued use of the Platform after changes take effect constitutes your acceptance of the revised Terms.`,
    },
    {
      id: 'contact',
      icon: FileText,
      title: '12. Contact Us',
      content: `For any questions or complaints regarding these Terms, please contact us at:
Email: legal@polarisarabia.com
Address: Kingdom of Saudi Arabia, Riyadh`,
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col bg-background text-foreground"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-40 backdrop-blur-sm bg-background/95">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>Polaris Arabia</span>
            </div>
          </Link>
          <Link href="/">
            <button className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70 text-muted-foreground">
              <BackArrow className="w-4 h-4" />
              {isRTL ? 'العودة' : 'Back'}
            </button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-border bg-secondary/20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary text-primary-foreground">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ fontFamily: "'Nunito', sans-serif" }}>
                {isRTL ? 'شروط الخدمة' : 'Terms of Service'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRTL ? `آخر تحديث: ${LAST_UPDATED_AR}` : `Last updated: ${LAST_UPDATED}`}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-2xl text-muted-foreground">
            {isRTL
              ? 'يُرجى قراءة هذه الشروط بعناية قبل استخدام منصة بولاريس أرابيا. تحكم هذه الشروط استخدامك للمنصة وتُشكّل اتفاقية ملزمة بينك وبين بولاريس أرابيا.'
              : 'Please read these Terms carefully before using the Polaris Arabia platform. These Terms govern your use of the Platform and constitute a binding agreement between you and Polaris Arabia.'}
          </p>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <p className="text-xs font-bold uppercase tracking-widest mb-3 text-primary">
            {isRTL ? 'المحتويات' : 'Contents'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {sections.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-xs px-3 py-2 rounded-lg transition-colors hover:opacity-80 bg-secondary text-secondary-foreground"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">
        <div className="space-y-10">
          {sections.map(({ id, icon: Icon, title, content }) => (
            <section key={id} id={id} className="scroll-mt-20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold" style={{ fontFamily: "'Nunito', sans-serif" }}>{title}</h2>
              </div>
              <div className="prose prose-sm max-w-none">
                {content.split('\n').map((para, i) => (
                  para.trim() ? (
                    <p key={i} className="text-sm leading-relaxed mb-3 text-foreground">
                      {para}
                    </p>
                  ) : <div key={i} className="h-1" />
                ))}
              </div>
              <div className="mt-6 border-b border-border" />
            </section>
          ))}
        </div>

        {/* Legal notice box */}
        <div className="mt-10 p-5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold mb-1 text-amber-800 dark:text-amber-200">
                {isRTL ? 'إشعار مهم' : 'Important Notice'}
              </p>
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                {isRTL
                  ? 'هذه الشروط مكتوبة باللغتين العربية والإنجليزية. في حال وجود أي تعارض بين النسختين، تسود النسخة العربية وفقاً للأنظمة السعودية المعمول بها.'
                  : 'These Terms are provided in both Arabic and English. In the event of any conflict between the two versions, the Arabic version shall prevail in accordance with applicable Saudi regulations.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
