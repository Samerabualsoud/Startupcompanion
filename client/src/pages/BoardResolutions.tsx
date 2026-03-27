import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Globe, FileText, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

type Language = 'en' | 'ar';
type ResolutionType = 'equity-grant' | 'financing' | 'officer-appointment' | 'stock-split' | 'dividend' | 'acquisition' | 'merger' | 'amendment' | 'option-pool' | 'esop';

interface ResolutionTemplate {
  id: ResolutionType;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
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
    nameEn: 'Equity Grant',
    nameAr: 'منح الأسهم',
    descriptionEn: 'Grant equity to employees or advisors',
    descriptionAr: 'منح أسهم للموظفين أو المستشارين',
    icon: '📊',
    fields: [
      { key: 'grantee_name', labelEn: 'Grantee Name', labelAr: 'اسم المستقبل', type: 'text' },
      { key: 'equity_percentage', labelEn: 'Equity %', labelAr: 'نسبة الأسهم %', type: 'number' },
      { key: 'vesting_period', labelEn: 'Vesting Period (Years)', labelAr: 'فترة الاستحقاق (سنوات)', type: 'number' },
      { key: 'cliff_period', labelEn: 'Cliff Period (Months)', labelAr: 'فترة الانتظار (أشهر)', type: 'number' },
    ],
  },
  {
    id: 'financing',
    nameEn: 'Financing Round',
    nameAr: 'جولة تمويل',
    descriptionEn: 'Approve a financing round',
    descriptionAr: 'الموافقة على جولة تمويل',
    icon: '💰',
    fields: [
      { key: 'investment_amount', labelEn: 'Investment Amount (USD)', labelAr: 'مبلغ الاستثمار (دولار)', type: 'number' },
      { key: 'investor_name', labelEn: 'Investor Name', labelAr: 'اسم المستثمر', type: 'text' },
      { key: 'valuation', labelEn: 'Valuation (USD)', labelAr: 'التقييم (دولار)', type: 'number' },
      { key: 'terms', labelEn: 'Key Terms', labelAr: 'الشروط الرئيسية', type: 'textarea' },
    ],
  },
  {
    id: 'officer-appointment',
    nameEn: 'Officer Appointment',
    nameAr: 'تعيين مسؤول',
    descriptionEn: 'Appoint a new officer/executive',
    descriptionAr: 'تعيين مسؤول/تنفيذي جديد',
    icon: '👔',
    fields: [
      { key: 'officer_name', labelEn: 'Officer Name', labelAr: 'اسم المسؤول', type: 'text' },
      { key: 'position', labelEn: 'Position', labelAr: 'المنصب', type: 'text' },
      { key: 'start_date', labelEn: 'Start Date', labelAr: 'تاريخ البدء', type: 'date' },
      { key: 'compensation', labelEn: 'Annual Compensation (USD)', labelAr: 'التعويض السنوي (دولار)', type: 'number' },
    ],
  },
  {
    id: 'stock-split',
    nameEn: 'Stock Split',
    nameAr: 'تقسيم الأسهم',
    descriptionEn: 'Approve a stock split',
    descriptionAr: 'الموافقة على تقسيم الأسهم',
    icon: '🔀',
    fields: [
      { key: 'split_ratio', labelEn: 'Split Ratio (e.g., 2:1)', labelAr: 'نسبة التقسيم (مثال: 2:1)', type: 'text' },
      { key: 'effective_date', labelEn: 'Effective Date', labelAr: 'التاريخ الفعلي', type: 'date' },
      { key: 'reason', labelEn: 'Reason for Split', labelAr: 'سبب التقسيم', type: 'textarea' },
    ],
  },
  {
    id: 'dividend',
    nameEn: 'Dividend Declaration',
    nameAr: 'إعلان توزيع أرباح',
    descriptionEn: 'Declare a dividend payment',
    descriptionAr: 'إعلان دفع أرباح',
    icon: '💵',
    fields: [
      { key: 'dividend_per_share', labelEn: 'Dividend per Share (USD)', labelAr: 'الأرباح لكل سهم (دولار)', type: 'number' },
      { key: 'record_date', labelEn: 'Record Date', labelAr: 'تاريخ السجل', type: 'date' },
      { key: 'payment_date', labelEn: 'Payment Date', labelAr: 'تاريخ الدفع', type: 'date' },
      { key: 'total_amount', labelEn: 'Total Amount (USD)', labelAr: 'المبلغ الإجمالي (دولار)', type: 'number' },
    ],
  },
  {
    id: 'acquisition',
    nameEn: 'Acquisition',
    nameAr: 'استحواذ',
    descriptionEn: 'Approve an acquisition',
    descriptionAr: 'الموافقة على استحواذ',
    icon: '🤝',
    fields: [
      { key: 'target_company', labelEn: 'Target Company', labelAr: 'الشركة المستهدفة', type: 'text' },
      { key: 'acquisition_price', labelEn: 'Acquisition Price (USD)', labelAr: 'سعر الاستحواذ (دولار)', type: 'number' },
      { key: 'terms_and_conditions', labelEn: 'Terms & Conditions', labelAr: 'الشروط والأحكام', type: 'textarea' },
    ],
  },
  {
    id: 'merger',
    nameEn: 'Merger',
    nameAr: 'دمج',
    descriptionEn: 'Approve a merger',
    descriptionAr: 'الموافقة على دمج',
    icon: '🔗',
    fields: [
      { key: 'merger_partner', labelEn: 'Merger Partner', labelAr: 'شريك الدمج', type: 'text' },
      { key: 'merger_ratio', labelEn: 'Merger Ratio', labelAr: 'نسبة الدمج', type: 'text' },
      { key: 'merger_terms', labelEn: 'Merger Terms', labelAr: 'شروط الدمج', type: 'textarea' },
    ],
  },
  {
    id: 'amendment',
    nameEn: 'Bylaw Amendment',
    nameAr: 'تعديل النظام الأساسي',
    descriptionEn: 'Amend company bylaws',
    descriptionAr: 'تعديل النظام الأساسي للشركة',
    icon: '📝',
    fields: [
      { key: 'amendment_description', labelEn: 'Amendment Description', labelAr: 'وصف التعديل', type: 'textarea' },
      { key: 'effective_date', labelEn: 'Effective Date', labelAr: 'التاريخ الفعلي', type: 'date' },
    ],
  },
  {
    id: 'option-pool',
    nameEn: 'Option Pool',
    nameAr: 'مجموعة الخيارات',
    descriptionEn: 'Establish an option pool',
    descriptionAr: 'إنشاء مجموعة خيارات',
    icon: '📈',
    fields: [
      { key: 'pool_size', labelEn: 'Pool Size (%)', labelAr: 'حجم المجموعة (%)', type: 'number' },
      { key: 'exercise_price', labelEn: 'Exercise Price (USD)', labelAr: 'سعر التمرين (دولار)', type: 'number' },
      { key: 'vesting_schedule', labelEn: 'Vesting Schedule', labelAr: 'جدول الاستحقاق', type: 'text' },
    ],
  },
  {
    id: 'esop',
    nameEn: 'ESOP',
    nameAr: 'خطة ملكية الموظفين',
    descriptionEn: 'Establish an ESOP',
    descriptionAr: 'إنشاء خطة ملكية الموظفين',
    icon: '👥',
    fields: [
      { key: 'esop_percentage', labelEn: 'ESOP Percentage (%)', labelAr: 'نسبة ESOP (%)', type: 'number' },
      { key: 'eligible_employees', labelEn: 'Eligible Employees', labelAr: 'الموظفون المؤهلون', type: 'number' },
      { key: 'terms', labelEn: 'ESOP Terms', labelAr: 'شروط ESOP', type: 'textarea' },
    ],
  },
];

const translations = {
  en: {
    title: 'Board Resolution',
    subtitle: 'Generate professional board resolutions in minutes',
    selectTemplate: 'Select Resolution Type',
    selectTemplateDesc: 'Choose the type of board resolution you need',
    companyName: 'Company Name',
    meetingDate: 'Meeting Date',
    boardMembers: 'Board Members (comma-separated)',
    fillRequired: 'Please fill in all required fields',
    downloadPDF: 'Download PDF',
    downloadWord: 'Download Word',
    important: 'Important:',
    disclaimer: 'This tool generates a template resolution. Before adoption, have a qualified lawyer review this resolution. This is not legal advice.',
    requiredField: 'Required',
    step: 'Step',
    of: 'of',
  },
  ar: {
    title: 'قرار مجلس الإدارة',
    subtitle: 'قم بإنشاء قرارات مجلس إدارة احترافية في دقائق',
    selectTemplate: 'اختر نوع القرار',
    selectTemplateDesc: 'اختر نوع قرار مجلس الإدارة الذي تحتاجه',
    companyName: 'اسم الشركة',
    meetingDate: 'تاريخ الاجتماع',
    boardMembers: 'أعضاء مجلس الإدارة (مفصولة بفواصل)',
    fillRequired: 'يرجى ملء جميع الحقول المطلوبة',
    downloadPDF: 'تحميل PDF',
    downloadWord: 'تحميل Word',
    important: 'مهم:',
    disclaimer: 'تنشئ هذه الأداة قرار نموذجي. قبل الاعتماد، اطلب من محام مؤهل مراجعة هذا القرار. هذا ليس استشارة قانونية.',
    requiredField: 'مطلوب',
    step: 'الخطوة',
    of: 'من',
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

  const generateWord = () => {
    if (!selectedTemplate || !companyName) {
      alert(t.fillRequired);
      return;
    }

    let content = '';
    content += `${language === 'en' ? 'BOARD RESOLUTION' : 'قرار مجلس الإدارة'}\n\n`;
    content += `${language === 'en' ? 'Company: ' : 'الشركة: '}${companyName}\n`;
    content += `${language === 'en' ? 'Date: ' : 'التاريخ: '}${meetingDate}\n\n`;

    if (template) {
      content += `${language === 'en' ? 'RESOLUTION: ' : 'القرار: '}${language === 'en' ? template.nameEn : template.nameAr}\n\n`;
      content += `${language === 'en' ? template.descriptionEn : template.descriptionAr}\n\n`;

      template.fields.forEach(field => {
        const value = fieldValues[field.key] || '';
        const label = language === 'en' ? field.labelEn : field.labelAr;
        content += `${label}: ${value}\n`;
      });
    }

    content += `\n\n${language === 'en' ? 'BOARD APPROVAL' : 'موافقة مجلس الإدارة'}\n\n`;
    content += `${language === 'en' ? 'This resolution is hereby adopted by the Board of Directors.' : 'يتم بموجب هذا اعتماد هذا القرار من قبل مجلس الإدارة.'}\n\n`;
    content += `${language === 'en' ? 'SIGNATURES' : 'التوقيعات'}\n\n`;
    content += `${language === 'en' ? 'Board Member 1' : 'عضو مجلس الإدارة 1'}: _____________________\n`;
    content += `${language === 'en' ? 'Board Member 2' : 'عضو مجلس الإدارة 2'}: _____________________\n`;
    content += `${language === 'en' ? 'Board Member 3' : 'عضو مجلس الإدارة 3'}: _____________________\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${companyName.replace(/\s+/g, '_')}_BoardResolution.txt`);
  };

  const generatePDF = () => {
    if (!companyName || !selectedTemplate || !template || !meetingDate || !boardMembers) {
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

    addText(language === 'en' ? 'BOARD RESOLUTION' : 'قرار مجلس الإدارة', 16, true, 8);
    yPosition += 5;

    addText(`${language === 'en' ? 'Company: ' : 'الشركة: '}${companyName}`, 11, false, 5);
    addText(`${language === 'en' ? 'Date: ' : 'التاريخ: '}${meetingDate}`, 11, false, 5);
    addText(`${language === 'en' ? 'Board Members: ' : 'أعضاء مجلس الإدارة: '}${boardMembers}`, 11, false, 8);

    addText(language === 'en' ? 'RESOLUTION' : 'القرار', 12, true, 6);
    addText(language === 'en' ? template.nameEn : template.nameAr, 11, true, 5);
    addText(language === 'en' ? template.descriptionEn : template.descriptionAr, 11, false, 6);
    yPosition += 5;

    template.fields.forEach(field => {
      const value = fieldValues[field.key] || '';
      const label = language === 'en' ? field.labelEn : field.labelAr;
      addText(`${label}: ${value}`, 11, false, 4);
    });

    yPosition += 10;

    addText(language === 'en' ? 'BOARD APPROVAL' : 'موافقة مجلس الإدارة', 12, true, 6);
    addText(
      language === 'en'
        ? 'This resolution is hereby adopted by the Board of Directors.'
        : 'يتم بموجب هذا اعتماد هذا القرار من قبل مجلس الإدارة.',
      11,
      false,
      6
    );
    yPosition += 10;

    addText(language === 'en' ? 'SIGNATURES' : 'التوقيعات', 12, true, 6);
    yPosition += 5;

    const members = boardMembers.split(',').map(m => m.trim());
    members.slice(0, 3).forEach((member, index) => {
      addText(`${language === 'en' ? 'Board Member ' : 'عضو مجلس الإدارة '}${index + 1}: ${member}`, 11, false, 4);
      addText('_____________________', 11, false, 6);
      yPosition += 2;
    });

    doc.setFontSize(9);
    doc.setTextColor(100);
    const footerText =
      language === 'en'
        ? 'This resolution was generated using Polaris Arabia Legal Tools. Consult a lawyer before adoption.'
        : 'تم إنشاء هذا القرار باستخدام أدوات Polaris Arabia القانونية. استشر محامياً قبل الاعتماد.';
    doc.text(footerText, isRTL ? pageWidth - margin : margin, pageHeight - 10, { align: isRTL ? 'right' : 'left' });

    doc.save(`${companyName.replace(/\s+/g, '_')}_BoardResolution.pdf`);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100 p-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {t.title}
            </h1>
            <p className="text-lg text-gray-600">{t.subtitle}</p>
          </div>

          {/* Language Toggle */}
          <div className="flex gap-2 bg-white rounded-full p-1 shadow-md border border-gray-200">
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="rounded-full"
            >
              EN
            </Button>
            <Button
              variant={language === 'ar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('ar')}
              className="rounded-full"
            >
              AR
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <span className="text-sm font-semibold text-gray-700">
            {t.step} {selectedTemplate ? '2' : '1'} {t.of} 2
          </span>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="h-2 rounded-full transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-500"
              style={{ width: `${selectedTemplate ? '100' : '50'}%` }}
            />
          </div>
        </div>

        {!selectedTemplate ? (
          // Template Selection
          <div className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-white">{t.selectTemplate}</CardTitle>
                    <CardDescription className="text-purple-100">{t.selectTemplateDesc}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group text-left"
                    >
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{tmpl.icon}</div>
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                        {language === 'en' ? tmpl.nameEn : tmpl.nameAr}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {language === 'en' ? tmpl.descriptionEn : tmpl.descriptionAr}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Resolution Details
          <div className="space-y-6">
            {/* Back Button */}
            <Button
              onClick={() => {
                setSelectedTemplate(null);
                setFieldValues({});
              }}
              variant="outline"
              className="mb-4"
            >
              ← {language === 'en' ? 'Back' : 'رجوع'}
            </Button>

            {/* Company Info */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold">1</span>
                  </div>
                  <div>
                    <CardTitle className="text-white">{language === 'en' ? 'Company Details' : 'تفاصيل الشركة'}</CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-gray-700 font-semibold flex items-center gap-2">
                      {t.companyName}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={language === 'en' ? 'Company name' : 'اسم الشركة'}
                      className="mt-2 border-gray-300"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700 font-semibold flex items-center gap-2">
                      {t.meetingDate}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="mt-2 border-gray-300"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700 font-semibold flex items-center gap-2">
                      {t.boardMembers}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={boardMembers}
                      onChange={(e) => setBoardMembers(e.target.value)}
                      placeholder={language === 'en' ? 'John Doe, Jane Smith' : 'أحمد محمد، فاطمة علي'}
                      className="mt-2 border-gray-300"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resolution Template */}
            {template && (
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg pb-6">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{template.icon}</div>
                    <div>
                      <CardTitle className="text-white">
                        {language === 'en' ? template.nameEn : template.nameAr}
                      </CardTitle>
                      <CardDescription className="text-purple-100">
                        {language === 'en' ? template.descriptionEn : template.descriptionAr}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {template.fields.map(field => (
                      <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                        <Label className="text-gray-700 font-semibold">
                          {language === 'en' ? field.labelEn : field.labelAr}
                        </Label>
                        {field.type === 'textarea' ? (
                          <Textarea
                            value={fieldValues[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="mt-2 min-h-24 border-gray-300"
                            dir={isRTL ? 'rtl' : 'ltr'}
                          />
                        ) : (
                          <Input
                            type={field.type}
                            value={fieldValues[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="mt-2 border-gray-300"
                            dir={isRTL ? 'rtl' : 'ltr'}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={generatePDF}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-6 text-lg rounded-lg shadow-lg"
              >
                <Download className="w-5 h-5 mr-2" />
                {t.downloadPDF}
              </Button>
              <Button
                onClick={generateWord}
                className="flex-1 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white py-6 text-lg rounded-lg shadow-lg"
              >
                <FileText className="w-5 h-5 mr-2" />
                {t.downloadWord}
              </Button>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 mb-1">{t.important}</p>
                <p className="text-sm text-amber-800">{t.disclaimer}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
