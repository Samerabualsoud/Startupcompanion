import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Globe } from 'lucide-react';
import jsPDF from 'jspdf';

type Language = 'en' | 'ar';
type ResolutionType = 'equity-grant' | 'financing' | 'officer-appointment' | 'stock-split' | 'dividend' | 'acquisition' | 'merger' | 'amendment' | 'option-pool' | 'esop';

interface ResolutionTemplate {
  id: ResolutionType;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  fields: {
    key: string;
    labelEn: string;
    labelAr: string;
    type: 'text' | 'number' | 'date' | 'textarea';
    placeholder?: string;
  }[];
}

const templates: ResolutionTemplate[] = [
  {
    id: 'equity-grant',
    nameEn: 'Equity Grant Resolution',
    nameAr: 'قرار منح الأسهم',
    descriptionEn: 'Grant equity to employees or advisors',
    descriptionAr: 'منح أسهم للموظفين أو المستشارين',
    fields: [
      { key: 'grantee_name', labelEn: 'Grantee Name', labelAr: 'اسم المستقبل', type: 'text' },
      { key: 'equity_percentage', labelEn: 'Equity Percentage (%)', labelAr: 'نسبة الأسهم (%)', type: 'number' },
      { key: 'vesting_period', labelEn: 'Vesting Period (Years)', labelAr: 'فترة الاستحقاق (سنوات)', type: 'number' },
      { key: 'cliff_period', labelEn: 'Cliff Period (Months)', labelAr: 'فترة الانتظار (أشهر)', type: 'number' },
      { key: 'grant_date', labelEn: 'Grant Date', labelAr: 'تاريخ المنح', type: 'date' },
    ],
  },
  {
    id: 'financing',
    nameEn: 'Financing Round Resolution',
    nameAr: 'قرار جولة التمويل',
    descriptionEn: 'Approve a financing round',
    descriptionAr: 'الموافقة على جولة تمويل',
    fields: [
      { key: 'round_name', labelEn: 'Round Name (e.g., Seed, Series A)', labelAr: 'اسم الجولة (مثل Seed, Series A)', type: 'text' },
      { key: 'amount_raised', labelEn: 'Amount Raised (USD)', labelAr: 'المبلغ المجمع (دولار أمريكي)', type: 'number' },
      { key: 'valuation', labelEn: 'Post-Money Valuation (USD)', labelAr: 'التقييم بعد التمويل (دولار أمريكي)', type: 'number' },
      { key: 'investor_name', labelEn: 'Lead Investor Name', labelAr: 'اسم المستثمر الرئيسي', type: 'text' },
      { key: 'close_date', labelEn: 'Expected Close Date', labelAr: 'تاريخ الإغلاق المتوقع', type: 'date' },
    ],
  },
  {
    id: 'officer-appointment',
    nameEn: 'Officer Appointment Resolution',
    nameAr: 'قرار تعيين الضابط',
    descriptionEn: 'Appoint a company officer (CEO, CFO, etc.)',
    descriptionAr: 'تعيين ضابط في الشركة (الرئيس التنفيذي، المدير المالي، إلخ)',
    fields: [
      { key: 'officer_name', labelEn: 'Officer Name', labelAr: 'اسم الضابط', type: 'text' },
      { key: 'position', labelEn: 'Position', labelAr: 'المنصب', type: 'text', placeholder: 'CEO, CFO, CTO, etc.' },
      { key: 'salary', labelEn: 'Annual Salary (USD)', labelAr: 'الراتب السنوي (دولار أمريكي)', type: 'number' },
      { key: 'start_date', labelEn: 'Start Date', labelAr: 'تاريخ البدء', type: 'date' },
      { key: 'responsibilities', labelEn: 'Key Responsibilities', labelAr: 'المسؤوليات الرئيسية', type: 'textarea' },
    ],
  },
  {
    id: 'stock-split',
    nameEn: 'Stock Split Resolution',
    nameAr: 'قرار تقسيم الأسهم',
    descriptionEn: 'Approve a stock split',
    descriptionAr: 'الموافقة على تقسيم الأسهم',
    fields: [
      { key: 'split_ratio', labelEn: 'Split Ratio (e.g., 2:1)', labelAr: 'نسبة التقسيم (مثل 2:1)', type: 'text' },
      { key: 'effective_date', labelEn: 'Effective Date', labelAr: 'تاريخ السريان', type: 'date' },
      { key: 'reason', labelEn: 'Reason for Split', labelAr: 'سبب التقسيم', type: 'textarea' },
    ],
  },
  {
    id: 'dividend',
    nameEn: 'Dividend Declaration',
    nameAr: 'إعلان توزيع الأرباح',
    descriptionEn: 'Declare a dividend distribution',
    descriptionAr: 'إعلان توزيع الأرباح',
    fields: [
      { key: 'dividend_per_share', labelEn: 'Dividend Per Share (USD)', labelAr: 'الأرباح لكل سهم (دولار أمريكي)', type: 'number' },
      { key: 'record_date', labelEn: 'Record Date', labelAr: 'تاريخ السجل', type: 'date' },
      { key: 'payment_date', labelEn: 'Payment Date', labelAr: 'تاريخ الدفع', type: 'date' },
      { key: 'total_amount', labelEn: 'Total Dividend Amount (USD)', labelAr: 'إجمالي مبلغ الأرباح (دولار أمريكي)', type: 'number' },
    ],
  },
  {
    id: 'acquisition',
    nameEn: 'Acquisition Approval',
    nameAr: 'موافقة الاستحواذ',
    descriptionEn: 'Approve acquisition of another company',
    descriptionAr: 'الموافقة على الاستحواذ على شركة أخرى',
    fields: [
      { key: 'target_company', labelEn: 'Target Company Name', labelAr: 'اسم الشركة المستهدفة', type: 'text' },
      { key: 'purchase_price', labelEn: 'Purchase Price (USD)', labelAr: 'سعر الشراء (دولار أمريكي)', type: 'number' },
      { key: 'closing_date', labelEn: 'Expected Closing Date', labelAr: 'تاريخ الإغلاق المتوقع', type: 'date' },
      { key: 'terms', labelEn: 'Key Terms & Conditions', labelAr: 'الشروط والأحكام الرئيسية', type: 'textarea' },
    ],
  },
  {
    id: 'merger',
    nameEn: 'Merger Resolution',
    nameAr: 'قرار الدمج',
    descriptionEn: 'Approve merger with another company',
    descriptionAr: 'الموافقة على الدمج مع شركة أخرى',
    fields: [
      { key: 'merger_partner', labelEn: 'Merger Partner Name', labelAr: 'اسم شريك الدمج', type: 'text' },
      { key: 'merger_ratio', labelEn: 'Merger Ratio', labelAr: 'نسبة الدمج', type: 'text', placeholder: 'e.g., 1:2' },
      { key: 'effective_date', labelEn: 'Effective Date', labelAr: 'تاريخ السريان', type: 'date' },
      { key: 'terms', labelEn: 'Merger Terms', labelAr: 'شروط الدمج', type: 'textarea' },
    ],
  },
  {
    id: 'amendment',
    nameEn: 'Bylaws Amendment',
    nameAr: 'تعديل النظام الأساسي',
    descriptionEn: 'Amend company bylaws or articles',
    descriptionAr: 'تعديل النظام الأساسي أو المواد الأساسية للشركة',
    fields: [
      { key: 'amendment_description', labelEn: 'Amendment Description', labelAr: 'وصف التعديل', type: 'textarea' },
      { key: 'effective_date', labelEn: 'Effective Date', labelAr: 'تاريخ السريان', type: 'date' },
      { key: 'rationale', labelEn: 'Rationale', labelAr: 'المنطق', type: 'textarea' },
    ],
  },
  {
    id: 'option-pool',
    nameEn: 'Option Pool Expansion',
    nameAr: 'توسيع مجموعة الخيارات',
    descriptionEn: 'Increase employee stock option pool',
    descriptionAr: 'زيادة مجموعة خيارات الأسهم للموظفين',
    fields: [
      { key: 'new_pool_size', labelEn: 'New Pool Size (%)', labelAr: 'حجم المجموعة الجديد (%)', type: 'number' },
      { key: 'current_pool_size', labelEn: 'Current Pool Size (%)', labelAr: 'حجم المجموعة الحالي (%)', type: 'number' },
      { key: 'purpose', labelEn: 'Purpose', labelAr: 'الغرض', type: 'textarea' },
      { key: 'effective_date', labelEn: 'Effective Date', labelAr: 'تاريخ السريان', type: 'date' },
    ],
  },
  {
    id: 'esop',
    nameEn: 'ESOP Establishment',
    nameAr: 'إنشاء خطة ملكية الموظفين',
    descriptionEn: 'Establish Employee Stock Ownership Plan',
    descriptionAr: 'إنشاء خطة ملكية الموظفين للأسهم',
    fields: [
      { key: 'esop_size', labelEn: 'ESOP Size (%)', labelAr: 'حجم ESOP (%)', type: 'number' },
      { key: 'vesting_schedule', labelEn: 'Vesting Schedule', labelAr: 'جدول الاستحقاق', type: 'text', placeholder: '4 years with 1-year cliff' },
      { key: 'eligibility', labelEn: 'Employee Eligibility', labelAr: 'أهلية الموظف', type: 'textarea' },
      { key: 'effective_date', labelEn: 'Effective Date', labelAr: 'تاريخ السريان', type: 'date' },
    ],
  },
];

const translations = {
  en: {
    title: 'Board Resolution Generator',
    subtitle: 'Create professional board resolutions in minutes',
    selectTemplate: 'Select Resolution Type',
    selectTemplateDesc: 'Choose the type of board resolution you need',
    fillDetails: 'Fill in Resolution Details',
    companyName: 'Company Name',
    meetingDate: 'Board Meeting Date',
    boardMembers: 'Board Members Present',
    downloadPDF: 'Download Resolution PDF',
    fillRequired: 'Please fill in all required fields',
    important: 'Important:',
    disclaimer: 'This tool generates a template resolution. Have your company lawyer review before presenting to the board. This is not legal advice.',
    months: 'Months',
    years: 'Years',
  },
  ar: {
    title: 'منشئ قرارات مجلس الإدارة',
    subtitle: 'قم بإنشاء قرارات احترافية لمجلس الإدارة في دقائق',
    selectTemplate: 'اختر نوع القرار',
    selectTemplateDesc: 'اختر نوع قرار مجلس الإدارة الذي تحتاجه',
    fillDetails: 'ملء تفاصيل القرار',
    companyName: 'اسم الشركة',
    meetingDate: 'تاريخ اجتماع مجلس الإدارة',
    boardMembers: 'أعضاء مجلس الإدارة الحاضرون',
    downloadPDF: 'تحميل قرار PDF',
    fillRequired: 'يرجى ملء جميع الحقول المطلوبة',
    important: 'مهم:',
    disclaimer: 'تنشئ هذه الأداة قرار نموذجي. اطلب من محام الشركة المراجعة قبل تقديمه إلى مجلس الإدارة. هذا ليس استشارة قانونية.',
    months: 'أشهر',
    years: 'سنوات',
  },
};

export default function BoardResolutions() {
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];
  const isRTL = language === 'ar';

  const [selectedTemplate, setSelectedTemplate] = useState<ResolutionType | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [boardMembers, setBoardMembers] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const template = templates.find(t => t.id === selectedTemplate);

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [key]: value }));
  };

  const generatePDF = () => {
    if (!companyName || !selectedTemplate || !template || !meetingDate || !boardMembers) {
      alert(t.fillRequired);
      return;
    }

    const missingFields = template.fields.filter(f => !fieldValues[f.key]);
    if (missingFields.length > 0) {
      alert(t.fillRequired);
      return;
    }

    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;

    if (isRTL) {
      doc.setR2L(true);
    }

    const addText = (text: string, fontSize: number = 12, bold: boolean = false, spacing: number = 5) => {
      doc.setFontSize(fontSize);
      if (bold) doc.setFont('helvetica', 'bold');
      else doc.setFont('helvetica', 'normal');

      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        if (isRTL) {
          doc.text(line, pageWidth - margin, yPosition, { align: 'right' });
        } else {
          doc.text(line, margin, yPosition);
        }
        yPosition += spacing;
      });
    };

    // Title
    const templateName = language === 'en' ? template.nameEn : template.nameAr;
    addText(templateName.toUpperCase(), 16, true, 8);
    yPosition += 5;

    // Header
    addText(
      language === 'en'
        ? `BOARD RESOLUTION OF ${companyName.toUpperCase()}`
        : `قرار مجلس إدارة ${companyName}`,
      14,
      true,
      8
    );
    yPosition += 8;

    // Meeting Details
    addText(
      language === 'en'
        ? `Meeting Date: ${meetingDate}`
        : `تاريخ الاجتماع: ${meetingDate}`,
      11,
      false,
      5
    );
    addText(
      language === 'en'
        ? `Board Members Present: ${boardMembers}`
        : `أعضاء مجلس الإدارة الحاضرون: ${boardMembers}`,
      11,
      false,
      6
    );
    yPosition += 5;

    // Resolution Content
    addText(
      language === 'en'
        ? 'WHEREAS, the Board of Directors deems it necessary and appropriate to take the following action:'
        : 'حيث يرى مجلس الإدارة أنه من الضروري والمناسب اتخاذ الإجراء التالي:',
      11,
      true,
      6
    );
    yPosition += 5;

    addText(
      language === 'en'
        ? 'NOW, THEREFORE, BE IT RESOLVED:'
        : 'الآن، لذا يتم القرار:',
      11,
      true,
      6
    );
    yPosition += 5;

    // Resolution Details
    template.fields.forEach((field, index) => {
      const fieldLabel = language === 'en' ? field.labelEn : field.labelAr;
      const fieldValue = fieldValues[field.key];
      addText(`${index + 1}. ${fieldLabel}: ${fieldValue}`, 11, false, 5);
    });

    yPosition += 8;

    // Certification
    addText(
      language === 'en'
        ? 'IN WITNESS WHEREOF, the undersigned certifies that the foregoing is a true and correct copy of the Board Resolution adopted at the meeting held on the date stated above.'
        : 'شهادة: يشهد الموقع أدناه بأن ما سبق نسخة صحيحة وصحيحة من قرار مجلس الإدارة المعتمد في الاجتماع المعقود في التاريخ المذكور أعلاه.',
      11,
      false,
      6
    );
    yPosition += 15;

    // Signature Lines
    addText(
      language === 'en'
        ? '_____________________'
        : '_____________________',
      11,
      false,
      2
    );
    addText(
      language === 'en'
        ? 'Board Secretary Signature'
        : 'توقيع أمين مجلس الإدارة',
      10,
      false,
      4
    );
    addText(
      language === 'en'
        ? '_____________________'
        : '_____________________',
      11,
      false,
      2
    );
    addText(
      language === 'en'
        ? 'Date'
        : 'التاريخ',
      10,
      false,
      8
    );

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(100);
    const footerText =
      language === 'en'
        ? 'This resolution was generated using Polaris Arabia Legal Tools. Have your lawyer review before use.'
        : 'تم إنشاء هذا القرار باستخدام أدوات Polaris Arabia القانونية. اطلب من محاميك المراجعة قبل الاستخدام.';
    doc.text(footerText, isRTL ? pageWidth - margin : margin, pageHeight - 10, { align: isRTL ? 'right' : 'left' });

    doc.save(`${companyName.replace(/\s+/g, '_')}_${templateName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        {/* Language Toggle */}
        <div className="flex justify-end mb-6">
          <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              English
            </Button>
            <Button
              variant={language === 'ar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('ar')}
              className="gap-2"
            >
              <Globe className="w-4 h-4" />
              العربية
            </Button>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-lg text-gray-600">{t.subtitle}</p>
        </div>

        {/* Template Selection */}
        <Card className="shadow-lg mb-8">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle>{t.selectTemplate}</CardTitle>
            <CardDescription className="text-purple-100">{t.selectTemplateDesc}</CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplate(tmpl.id);
                    setFieldValues({});
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedTemplate === tmpl.id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 bg-white'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">
                    {language === 'en' ? tmpl.nameEn : tmpl.nameAr}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {language === 'en' ? tmpl.descriptionEn : tmpl.descriptionAr}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resolution Details */}
        {selectedTemplate && template && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle>{t.fillDetails}</CardTitle>
            </CardHeader>

            <CardContent className="p-8">
              {/* Company Info */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{language === 'en' ? 'Meeting Information' : 'معلومات الاجتماع'}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-700 font-semibold">{t.companyName} *</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={language === 'en' ? 'Company name' : 'اسم الشركة'}
                      className="mt-2"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700 font-semibold">{t.meetingDate} *</Label>
                    <Input
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-gray-700 font-semibold">{t.boardMembers} *</Label>
                    <Input
                      value={boardMembers}
                      onChange={(e) => setBoardMembers(e.target.value)}
                      placeholder={language === 'en' ? 'e.g., John Doe, Jane Smith' : 'مثال: أحمد محمد، فاطمة علي'}
                      className="mt-2"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>
              </div>

              {/* Template Fields */}
              <div className="border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {language === 'en' ? template.nameEn : template.nameAr}
                </h2>

                <div className="space-y-6">
                  {template.fields.map(field => (
                    <div key={field.key}>
                      <Label className="text-gray-700 font-semibold">
                        {language === 'en' ? field.labelEn : field.labelAr} *
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          value={fieldValues[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder || ''}
                          className="mt-2 min-h-24"
                          dir={isRTL ? 'rtl' : 'ltr'}
                        />
                      ) : (
                        <Input
                          type={field.type}
                          value={fieldValues[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder || ''}
                          className="mt-2"
                          dir={isRTL ? 'rtl' : 'ltr'}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-8 border-t">
                <Button
                  onClick={generatePDF}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  {t.downloadPDF}
                </Button>
              </div>

              {/* Info Box */}
              <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>⚠️ {t.important}</strong> {t.disclaimer}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
