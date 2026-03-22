/**
 * Privacy Policy — Polaris Arabia
 * Compliant with: Saudi Personal Data Protection Law (PDPL)
 * Royal Decree M/19 (1443H), amended by Royal Decree M/37 (1443H)
 * Implementing Regulations issued by SDAIA (Saudi Data & AI Authority)
 * Last updated: March 2026
 */
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import SiteFooter from '@/components/SiteFooter';
import { TrendingUp, ArrowLeft, ArrowRight, Shield, Eye, Database, Lock, UserCheck, Globe, Mail } from 'lucide-react';

const LAST_UPDATED = 'March 22, 2026';
const LAST_UPDATED_AR = '٢٢ مارس ٢٠٢٦';

export default function PrivacyPolicy() {
  const { isRTL } = useLanguage();
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const sections = isRTL ? [
    {
      id: 'controller',
      icon: Shield,
      title: '١. هوية مسؤول معالجة البيانات',
      content: `وفقاً لنظام حماية البيانات الشخصية السعودي (PDPL)، فإن مسؤول معالجة البيانات هو:

الاسم: بولاريس أرابيا
الموقع الإلكتروني: polarisarabia.com
البريد الإلكتروني: privacy@polarisarabia.com
العنوان: المملكة العربية السعودية، الرياض

إذا كانت لديك أي استفسارات تتعلق بمعالجة بياناتك الشخصية، يُرجى التواصل معنا عبر البريد الإلكتروني أعلاه.`,
    },
    {
      id: 'data-collected',
      icon: Database,
      title: '٢. البيانات التي نجمعها',
      content: `نجمع الأنواع التالية من البيانات الشخصية:

أ) البيانات التي تُقدّمها مباشرةً:
• الاسم الكامل وعنوان البريد الإلكتروني عند التسجيل
• معلومات الشركة الناشئة (الاسم، القطاع، المرحلة، الإيرادات)
• بيانات جدول الرأسمال (أسماء المؤسسين، نسب الملكية)
• بيانات الموظفين في خطط ESOP (الأسماء فقط، لا البيانات الشخصية الحساسة)
• أي محتوى تُدخله في أدوات المنصة

ب) البيانات التي نجمعها تلقائياً:
• بيانات الاستخدام وسجلات الجلسات
• عنوان IP ونوع المتصفح ونظام التشغيل
• الصفحات التي تزورها والمدة الزمنية للزيارة
• ملفات تعريف الارتباط (Cookies) وتقنيات التتبع المماثلة

ج) البيانات من أطراف ثالثة:
• بيانات المصادقة من مزودي تسجيل الدخول (Manus OAuth)`,
    },
    {
      id: 'legal-basis',
      icon: Shield,
      title: '٣. الأساس القانوني للمعالجة',
      content: `وفقاً لنظام PDPL، نعالج بياناتك الشخصية استناداً إلى:

• موافقتك الصريحة: عند التسجيل في المنصة وقبول سياسة الخصوصية هذه
• تنفيذ العقد: لتقديم الخدمات التي طلبتها
• المصالح المشروعة: لتحسين المنصة وضمان أمانها ومنع الاحتيال
• الالتزام القانوني: للامتثال للمتطلبات التنظيمية السعودية

لك الحق في سحب موافقتك في أي وقت دون أن يؤثر ذلك على مشروعية المعالجة السابقة لسحب الموافقة.`,
    },
    {
      id: 'purpose',
      icon: Eye,
      title: '٤. أغراض معالجة البيانات',
      content: `نستخدم بياناتك الشخصية للأغراض التالية:
• تقديم خدمات المنصة وتشغيلها وتحسينها
• إنشاء حسابك وإدارته والتحقق من هويتك
• تخصيص تجربتك وحفظ إعداداتك وبياناتك
• إرسال إشعارات تتعلق بالخدمة والتحديثات الجوهرية
• الرد على استفساراتك وطلبات الدعم
• الامتثال للمتطلبات القانونية والتنظيمية
• تحليل أنماط الاستخدام لتطوير المنصة (بصورة مجمّعة ومجهولة الهوية)

لن نستخدم بياناتك لأغراض التسويق المباشر دون موافقتك الصريحة.`,
    },
    {
      id: 'sharing',
      icon: Globe,
      title: '٥. مشاركة البيانات مع أطراف ثالثة',
      content: `لا نبيع بياناتك الشخصية لأي طرف ثالث. قد نشارك بياناتك في الحالات التالية:

• مزودو الخدمات التقنية: نستخدم خدمات سحابية وتقنية موثوقة (مثل خدمات التخزين والمصادقة) وفق اتفاقيات معالجة بيانات صارمة
• الامتثال القانوني: عند الطلب من جهات حكومية أو قضائية مختصة وفق الأنظمة السعودية
• حماية الحقوق: لحماية حقوق بولاريس أرابيا أو مستخدميها أو الجمهور عند الضرورة
• نقل الأعمال: في حال الاندماج أو الاستحواذ، مع إخطارك مسبقاً

عند مشاركة البيانات مع أطراف ثالثة، نضمن توفير مستوى حماية مكافئ لما تنص عليه هذه السياسة.`,
    },
    {
      id: 'cross-border',
      icon: Globe,
      title: '٦. نقل البيانات عبر الحدود',
      content: `وفقاً للمادة (١٦) من نظام PDPL، قد تُنقل بياناتك إلى خوادم خارج المملكة العربية السعودية. نلتزم بالضمانات التالية:
• نضمن أن الدول المستقبلة توفر مستوى حماية مناسباً للبيانات
• نستخدم ضمانات تعاقدية معتمدة عند الضرورة
• نحتفظ بسجل بعمليات نقل البيانات عبر الحدود وفق متطلبات SDAIA`,
    },
    {
      id: 'retention',
      icon: Database,
      title: '٧. مدة الاحتفاظ بالبيانات',
      content: `نحتفظ ببياناتك الشخصية للمدة اللازمة لتحقيق الأغراض المذكورة في هذه السياسة:
• بيانات الحساب: طوال مدة نشاط حسابك وحتى ٣ سنوات بعد إغلاقه
• بيانات الاستخدام: ١٢ شهراً من تاريخ الجمع
• السجلات المالية والقانونية: ١٠ سنوات وفق متطلبات الأنظمة السعودية
• بيانات الدعم الفني: ٢ سنة من تاريخ حل الطلب

بعد انتهاء مدة الاحتفاظ، نحذف بياناتك أو نجهّلها بصورة آمنة.`,
    },
    {
      id: 'rights',
      icon: UserCheck,
      title: '٨. حقوقك بموجب نظام PDPL',
      content: `يمنحك نظام حماية البيانات الشخصية السعودي الحقوق التالية:

• حق الاطلاع: الحصول على نسخة من بياناتك الشخصية التي نحتفظ بها
• حق التصحيح: تصحيح أي بيانات غير دقيقة أو ناقصة
• حق الحذف: طلب حذف بياناتك في الحالات التي يسمح بها النظام
• حق الاعتراض: الاعتراض على معالجة بياناتك في حالات معينة
• حق تقييد المعالجة: طلب تقييد معالجة بياناتك في ظروف محددة
• حق نقل البيانات: الحصول على بياناتك بصيغة قابلة للقراءة الآلية

لممارسة أي من هذه الحقوق، يُرجى التواصل معنا على: privacy@polarisarabia.com
سنرد على طلبك خلال ١٥ يوم عمل وفق متطلبات النظام.`,
    },
    {
      id: 'security',
      icon: Lock,
      title: '٩. أمن البيانات',
      content: `نطبّق تدابير أمنية تقنية وتنظيمية مناسبة لحماية بياناتك، تشمل:
• تشفير البيانات أثناء النقل باستخدام بروتوكول TLS 1.3
• تشفير البيانات المخزنة باستخدام معايير AES-256
• ضوابط صارمة للوصول وإدارة الهويات
• مراجعات أمنية دورية واختبارات الاختراق
• خطط الاستجابة للحوادث الأمنية

في حال وقوع أي اختراق أمني قد يؤثر على بياناتك، سنخطرك والجهات التنظيمية المختصة وفق المتطلبات النظامية.`,
    },
    {
      id: 'cookies',
      icon: Database,
      title: '١٠. ملفات تعريف الارتباط (Cookies)',
      content: `نستخدم ملفات تعريف الارتباط للأغراض التالية:
• الضرورية: لتشغيل المنصة وإدارة جلسات المستخدمين (لا يمكن تعطيلها)
• التحليلية: لفهم كيفية استخدام المنصة وتحسينها (يمكن رفضها)
• التفضيلات: لحفظ إعداداتك ولغتك المفضلة

يمكنك إدارة تفضيلات ملفات تعريف الارتباط من خلال إعدادات متصفحك. يُرجى ملاحظة أن تعطيل بعض ملفات تعريف الارتباط قد يؤثر على وظائف المنصة.`,
    },
    {
      id: 'minors',
      icon: Shield,
      title: '١١. حماية بيانات القاصرين',
      content: `لا تستهدف منصتنا الأشخاص دون سن ١٨ عاماً، ولا نجمع بياناتهم الشخصية عن قصد. إذا علمنا بأننا جمعنا بيانات شخصية لشخص دون هذا السن، سنحذفها فوراً. إذا كنت تعتقد أن طفلاً قاصراً قدّم بياناته لنا، يُرجى التواصل معنا.`,
    },
    {
      id: 'complaints',
      icon: Mail,
      title: '١٢. تقديم الشكاوى',
      content: `إذا كانت لديك شكوى تتعلق بمعالجة بياناتك الشخصية، يُرجى:
١. التواصل معنا أولاً على: privacy@polarisarabia.com
٢. إذا لم تكن راضياً عن ردنا، يحق لك تقديم شكوى إلى الهيئة السعودية للبيانات والذكاء الاصطناعي (SDAIA) عبر: sdaia.gov.sa`,
    },
    {
      id: 'updates',
      icon: Shield,
      title: '١٣. تحديثات سياسة الخصوصية',
      content: `قد نُحدّث هذه السياسة دورياً. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني المسجل أو إشعار بارز على المنصة قبل ٣٠ يوماً من سريانها. تاريخ آخر تحديث مذكور في أعلى هذه الصفحة.`,
    },
  ] : [
    {
      id: 'controller',
      icon: Shield,
      title: '1. Data Controller Identity',
      content: `In accordance with the Saudi Personal Data Protection Law (PDPL), the data controller is:

Name: Polaris Arabia
Website: polarisarabia.com
Email: privacy@polarisarabia.com
Address: Kingdom of Saudi Arabia, Riyadh

For any questions regarding the processing of your personal data, please contact us at the email above.`,
    },
    {
      id: 'data-collected',
      icon: Database,
      title: '2. Data We Collect',
      content: `We collect the following types of personal data:

a) Data you provide directly:
• Full name and email address upon registration
• Startup information (name, sector, stage, revenue)
• Cap table data (founder names, ownership percentages)
• Employee data in ESOP plans (names only, no sensitive personal data)
• Any content you enter into Platform tools

b) Data we collect automatically:
• Usage data and session logs
• IP address, browser type, and operating system
• Pages visited and time spent
• Cookies and similar tracking technologies

c) Data from third parties:
• Authentication data from login providers (Manus OAuth)`,
    },
    {
      id: 'legal-basis',
      icon: Shield,
      title: '3. Legal Basis for Processing',
      content: `Under the PDPL, we process your personal data based on:

• Your explicit consent: When you register on the Platform and accept this Privacy Policy
• Contract performance: To provide the services you have requested
• Legitimate interests: To improve the Platform, ensure its security, and prevent fraud
• Legal obligation: To comply with Saudi regulatory requirements

You have the right to withdraw your consent at any time without affecting the lawfulness of processing prior to withdrawal.`,
    },
    {
      id: 'purpose',
      icon: Eye,
      title: '4. Purposes of Processing',
      content: `We use your personal data for the following purposes:
• Providing, operating, and improving Platform services
• Creating and managing your account and verifying your identity
• Personalizing your experience and saving your settings and data
• Sending service notifications and material updates
• Responding to your inquiries and support requests
• Complying with legal and regulatory requirements
• Analyzing usage patterns to develop the Platform (in aggregated, anonymized form)

We will not use your data for direct marketing without your explicit consent.`,
    },
    {
      id: 'sharing',
      icon: Globe,
      title: '5. Data Sharing with Third Parties',
      content: `We do not sell your personal data to any third party. We may share your data in the following cases:

• Technical service providers: We use trusted cloud and technology services (such as storage and authentication) under strict data processing agreements
• Legal compliance: When requested by competent government or judicial authorities under Saudi regulations
• Rights protection: To protect the rights of Polaris Arabia, its users, or the public when necessary
• Business transfers: In the event of a merger or acquisition, with prior notice to you

When sharing data with third parties, we ensure an equivalent level of protection to that described in this Policy.`,
    },
    {
      id: 'cross-border',
      icon: Globe,
      title: '6. Cross-Border Data Transfers',
      content: `In accordance with Article 16 of the PDPL, your data may be transferred to servers outside the Kingdom of Saudi Arabia. We comply with the following safeguards:
• We ensure receiving countries provide an adequate level of data protection
• We use approved contractual safeguards where necessary
• We maintain records of cross-border data transfers as required by SDAIA`,
    },
    {
      id: 'retention',
      icon: Database,
      title: '7. Data Retention',
      content: `We retain your personal data for as long as necessary to fulfill the purposes described in this Policy:
• Account data: For the duration of your active account and up to 3 years after closure
• Usage data: 12 months from the date of collection
• Financial and legal records: 10 years as required by Saudi regulations
• Technical support data: 2 years from the date of resolution

After the retention period, we securely delete or anonymize your data.`,
    },
    {
      id: 'rights',
      icon: UserCheck,
      title: '8. Your Rights Under PDPL',
      content: `The Saudi Personal Data Protection Law grants you the following rights:

• Right of Access: Obtain a copy of the personal data we hold about you
• Right to Rectification: Correct any inaccurate or incomplete data
• Right to Erasure: Request deletion of your data in cases permitted by law
• Right to Object: Object to the processing of your data in certain cases
• Right to Restrict Processing: Request restriction of data processing in specific circumstances
• Right to Data Portability: Receive your data in a machine-readable format

To exercise any of these rights, please contact us at: privacy@polarisarabia.com
We will respond to your request within 15 business days as required by law.`,
    },
    {
      id: 'security',
      icon: Lock,
      title: '9. Data Security',
      content: `We implement appropriate technical and organizational security measures to protect your data, including:
• Data encryption in transit using TLS 1.3 protocol
• Data encryption at rest using AES-256 standards
• Strict access controls and identity management
• Regular security reviews and penetration testing
• Incident response plans for security breaches

In the event of a security breach that may affect your data, we will notify you and the relevant regulatory authorities in accordance with legal requirements.`,
    },
    {
      id: 'cookies',
      icon: Database,
      title: '10. Cookies',
      content: `We use cookies for the following purposes:
• Essential: To operate the Platform and manage user sessions (cannot be disabled)
• Analytical: To understand how the Platform is used and improve it (can be declined)
• Preferences: To save your settings and preferred language

You can manage cookie preferences through your browser settings. Please note that disabling certain cookies may affect Platform functionality.`,
    },
    {
      id: 'minors',
      icon: Shield,
      title: '11. Protection of Minors\' Data',
      content: `Our Platform is not directed at persons under 18 years of age, and we do not knowingly collect their personal data. If we become aware that we have collected personal data from a person under this age, we will delete it immediately. If you believe a minor has submitted data to us, please contact us.`,
    },
    {
      id: 'complaints',
      icon: Mail,
      title: '12. Filing Complaints',
      content: `If you have a complaint about the processing of your personal data, please:
1. Contact us first at: privacy@polarisarabia.com
2. If you are not satisfied with our response, you have the right to file a complaint with the Saudi Data & AI Authority (SDAIA) at: sdaia.gov.sa`,
    },
    {
      id: 'updates',
      icon: Shield,
      title: '13. Privacy Policy Updates',
      content: `We may update this Policy periodically. We will notify you of any material changes via your registered email address or a prominent notice on the Platform at least 30 days before they take effect. The date of the last update is shown at the top of this page.`,
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
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ fontFamily: "'Nunito', sans-serif" }}>
                {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRTL ? `آخر تحديث: ${LAST_UPDATED_AR}` : `Last updated: ${LAST_UPDATED}`}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-2xl text-muted-foreground">
            {isRTL
              ? 'تلتزم بولاريس أرابيا بحماية خصوصيتك وفق نظام حماية البيانات الشخصية السعودي (PDPL). توضح هذه السياسة كيفية جمع بياناتك الشخصية واستخدامها وحمايتها.'
              : 'Polaris Arabia is committed to protecting your privacy in accordance with the Saudi Personal Data Protection Law (PDPL). This Policy explains how your personal data is collected, used, and protected.'}
          </p>
          {/* PDPL compliance badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Shield className="w-3.5 h-3.5" />
            {isRTL ? 'متوافق مع نظام PDPL السعودي' : 'Compliant with Saudi PDPL'}
          </div>
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
              <div>
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

        {/* SDAIA notice */}
        <div className="mt-10 p-5 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
            <div>
              <p className="text-sm font-semibold mb-1 text-foreground">
                {isRTL ? 'الهيئة السعودية للبيانات والذكاء الاصطناعي (SDAIA)' : 'Saudi Data & AI Authority (SDAIA)'}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {isRTL
                  ? 'هذه السياسة متوافقة مع نظام حماية البيانات الشخصية السعودي (PDPL) الصادر بالمرسوم الملكي م/١٩ ولوائحه التنفيذية الصادرة عن هيئة SDAIA. لمزيد من المعلومات حول حقوقك، يُرجى زيارة sdaia.gov.sa'
                  : 'This Policy is compliant with the Saudi Personal Data Protection Law (PDPL) issued by Royal Decree M/19 and its implementing regulations issued by SDAIA. For more information about your rights, please visit sdaia.gov.sa'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
