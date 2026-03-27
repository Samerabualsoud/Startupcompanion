import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Globe, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

type Language = 'en' | 'ar';
type ResolutionType = 
  | 'equity-grant'
  | 'financing'
  | 'officer-appointment'
  | 'stock-split'
  | 'dividend'
  | 'acquisition'
  | 'merger'
  | 'nda-approval'
  | 'budget-approval'
  | 'director-removal';

interface ResolutionTemplate {
  id: ResolutionType;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  fieldsEn: string[];
  fieldsAr: string[];
}

const templates: ResolutionTemplate[] = [
  {
    id: 'equity-grant',
    titleEn: 'Equity Grant Resolution',
    titleAr: 'قرار منح الأسهم',
    descriptionEn: 'Grant equity to employees or advisors',
    descriptionAr: 'منح أسهم للموظفين أو المستشارين',
    fieldsEn: ['Recipient Name', 'Number of Shares', 'Vesting Period (Years)', 'Strike Price (USD)', 'Grant Date'],
    fieldsAr: ['اسم المستقبل', 'عدد الأسهم', 'فترة الاستحقاق (سنوات)', 'سعر الممارسة (دولار أمريكي)', 'تاريخ المنح'],
  },
  {
    id: 'financing',
    titleEn: 'Financing Round Approval',
    titleAr: 'موافقة جولة التمويل',
    descriptionEn: 'Approve a new financing round',
    descriptionAr: 'الموافقة على جولة تمويل جديدة',
    fieldsEn: ['Round Type', 'Total Amount (USD)', 'Valuation (USD)', 'Lead Investor', 'Terms Summary'],
    fieldsAr: ['نوع الجولة', 'المبلغ الإجمالي (دولار أمريكي)', 'التقييم (دولار أمريكي)', 'المستثمر الرئيسي', 'ملخص الشروط'],
  },
  {
    id: 'officer-appointment',
    titleEn: 'Officer Appointment',
    titleAr: 'تعيين الضابط',
    descriptionEn: 'Appoint a new officer or director',
    descriptionAr: 'تعيين ضابط أو مدير جديد',
    fieldsEn: ['Officer Name', 'Position', 'Effective Date', 'Compensation (Annual USD)', 'Responsibilities'],
    fieldsAr: ['اسم الضابط', 'المنصب', 'تاريخ السريان', 'التعويض (سنوي بالدولار الأمريكي)', 'المسؤوليات'],
  },
  {
    id: 'stock-split',
    titleEn: 'Stock Split Resolution',
    titleAr: 'قرار تقسيم الأسهم',
    descriptionEn: 'Approve a stock split',
    descriptionAr: 'الموافقة على تقسيم الأسهم',
    fieldsEn: ['Split Ratio', 'Current Shares Outstanding', 'New Shares Outstanding', 'Effective Date', 'Reason'],
    fieldsAr: ['نسبة التقسيم', 'الأسهم المصدرة الحالية', 'الأسهم المصدرة الجديدة', 'تاريخ السريان', 'السبب'],
  },
  {
    id: 'dividend',
    titleEn: 'Dividend Declaration',
    titleAr: 'إعلان توزيع الأرباح',
    descriptionEn: 'Declare a dividend payment',
    descriptionAr: 'إعلان دفع توزيع الأرباح',
    fieldsEn: ['Dividend Per Share (USD)', 'Record Date', 'Payment Date', 'Total Amount (USD)', 'Shareholder Classes'],
    fieldsAr: ['الأرباح لكل سهم (دولار أمريكي)', 'تاريخ السجل', 'تاريخ الدفع', 'المبلغ الإجمالي (دولار أمريكي)', 'فئات المساهمين'],
  },
  {
    id: 'acquisition',
    titleEn: 'Acquisition Approval',
    titleAr: 'موافقة الاستحواذ',
    descriptionEn: 'Approve acquisition of another company',
    descriptionAr: 'الموافقة على الاستحواذ على شركة أخرى',
    fieldsEn: ['Target Company Name', 'Purchase Price (USD)', 'Payment Terms', 'Closing Date', 'Key Terms'],
    fieldsAr: ['اسم الشركة المستهدفة', 'سعر الشراء (دولار أمريكي)', 'شروط الدفع', 'تاريخ الإغلاق', 'الشروط الرئيسية'],
  },
  {
    id: 'merger',
    titleEn: 'Merger Resolution',
    titleAr: 'قرار الدمج',
    descriptionEn: 'Approve merger with another entity',
    descriptionAr: 'الموافقة على الدمج مع كيان آخر',
    fieldsEn: ['Merger Partner Name', 'Merger Structure', 'Exchange Ratio', 'Effective Date', 'Consideration'],
    fieldsAr: ['اسم شريك الدمج', 'هيكل الدمج', 'نسبة الصرف', 'تاريخ السريان', 'المقابل'],
  },
  {
    id: 'nda-approval',
    titleEn: 'NDA Approval',
    titleAr: 'موافقة اتفاقية السرية',
    descriptionEn: 'Approve NDA with third party',
    descriptionAr: 'الموافقة على اتفاقية السرية مع طرف ثالث',
    fieldsEn: ['Third Party Name', 'Purpose', 'Confidentiality Period (Years)', 'Approved By', 'Effective Date'],
    fieldsAr: ['اسم الطرف الثالث', 'الغرض', 'فترة السرية (سنوات)', 'وافق عليه', 'تاريخ السريان'],
  },
  {
    id: 'budget-approval',
    titleEn: 'Budget Approval',
    titleAr: 'موافقة الميزانية',
    descriptionEn: 'Approve annual or quarterly budget',
    descriptionAr: 'الموافقة على الميزانية السنوية أو الفصلية',
    fieldsEn: ['Budget Period', 'Total Budget (USD)', 'Department Budgets', 'Prepared By', 'Effective Date'],
    fieldsAr: ['فترة الميزانية', 'إجمالي الميزانية (دولار أمريكي)', 'ميزانيات الأقسام', 'أعده', 'تاريخ السريان'],
  },
  {
    id: 'director-removal',
    titleEn: 'Director Removal',
    titleAr: 'إزالة المدير',
    descriptionEn: 'Remove a director from the board',
    descriptionAr: 'إزالة مدير من المجلس',
    fieldsEn: ['Director Name', 'Reason for Removal', 'Effective Date', 'Successor Director', 'Severance Details'],
    fieldsAr: ['اسم المدير', 'سبب الإزالة', 'تاريخ السريان', 'مدير الخلف', 'تفاصيل التسوية'],
  },
];

const translations = {
  en: {
    title: 'Board Resolutions',
    subtitle: 'Generate professional board resolutions',
    selectTemplate: 'Select Resolution Type',
    companyName: 'Company Name',
    boardMeetingDate: 'Board Meeting Date',
    boardMembers: 'Board Members Present',
    resolutionDetails: 'Resolution Details',
    downloadPDF: 'Download PDF',
    downloadWord: 'Download Word',
    fillRequired: 'Please fill in all required fields',
    important: 'Important:',
    disclaimer: 'This tool generates a template resolution. Before adoption, have a qualified lawyer review this resolution. This is not legal advice.',
    step: 'Step',
    of: 'of',
    selectResolutionType: 'Select a resolution type to begin',
    nextStep: 'Continue',
    backStep: 'Back',
    requiredField: 'Required',
  },
  ar: {
    title: 'قرارات المجلس',
    subtitle: 'قم بإنشاء قرارات مجلس احترافية',
    selectTemplate: 'اختر نوع القرار',
    companyName: 'اسم الشركة',
    boardMeetingDate: 'تاريخ اجتماع المجلس',
    boardMembers: 'أعضاء المجلس الحاضرون',
    resolutionDetails: 'تفاصيل القرار',
    downloadPDF: 'تحميل PDF',
    downloadWord: 'تحميل Word',
    fillRequired: 'يرجى ملء جميع الحقول المطلوبة',
    important: 'مهم:',
    disclaimer: 'تنشئ هذه الأداة قرار نموذجي. قبل الموافقة عليه، اطلب من محام مؤهل مراجعة هذا القرار. هذا ليس استشارة قانونية.',
    step: 'الخطوة',
    of: 'من',
    selectResolutionType: 'اختر نوع القرار للبدء',
    nextStep: 'متابعة',
    backStep: 'رجوع',
    requiredField: 'مطلوب',
  },
};

export default function BoardResolutions() {
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];
  const isRTL = language === 'ar';

  const [step, setStep] = useState<'select' | 'details'>(isRTL ? 'select' : 'select');
  const [selectedTemplate, setSelectedTemplate] = useState<ResolutionType | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [boardMeetingDate, setBoardMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [boardMembers, setBoardMembers] = useState('');
  const [resolutionValues, setResolutionValues] = useState<Record<string, string>>({});

  const template = templates.find(t => t.id === selectedTemplate);

  const handleTemplateSelect = (templateId: ResolutionType) => {
    setSelectedTemplate(templateId);
    setStep('details');
    setResolutionValues({});
  };

  const handleValueChange = (field: string, value: string) => {
    setResolutionValues(prev => ({ ...prev, [field]: value }));
  };

  const generateWordContent = () => {
    if (!companyName || !template || !boardMembers) {
      alert(t.fillRequired);
      return '';
    }

    const fields = language === 'en' ? template.fieldsEn : template.fieldsAr;
    const allFieldsFilled = fields.every(field => resolutionValues[field]);
    if (!allFieldsFilled) {
      alert(t.fillRequired);
      return '';
    }

    let content = '';
    const templateTitle = language === 'en' ? template.titleEn : template.titleAr;
    content += `${templateTitle}\n\n`;
    content += `${language === 'en' ? 'BOARD RESOLUTION' : 'قرار المجلس'}\n\n`;
    content += `${language === 'en' ? `Company: ${companyName}` : `الشركة: ${companyName}`}\n`;
    content += `${language === 'en' ? `Date: ${boardMeetingDate}` : `التاريخ: ${boardMeetingDate}`}\n`;
    content += `${language === 'en' ? `Board Members Present: ${boardMembers}` : `أعضاء المجلس الحاضرون: ${boardMembers}`}\n\n`;

    content += `${language === 'en' ? 'WHEREAS' : 'حيث'}\n\n`;
    content += `${language === 'en' ? `The Board of Directors of ${companyName} convened on ${boardMeetingDate} to consider the following matter.` : `انعقد مجلس إدارة ${companyName} في ${boardMeetingDate} للنظر في المسألة التالية.`}\n\n`;

    content += `${language === 'en' ? 'NOW, THEREFORE, BE IT RESOLVED' : 'والآن، لذا يتم قرار ما يلي'}\n\n`;

    fields.forEach(field => {
      const value = resolutionValues[field];
      content += `${field}: ${value}\n`;
    });

    content += `\n${language === 'en' ? 'IN WITNESS WHEREOF' : 'شهادة على ذلك'}\n\n`;
    content += `${language === 'en' ? 'The undersigned, being the Secretary of the Board, certifies that the foregoing resolution was duly adopted by the Board of Directors.' : 'يشهد الموقع أدناه، بصفته أمين المجلس، بأن القرار أعلاه تم اعتماده بشكل صحيح من قبل مجلس الإدارة.'}\n\n`;
    content += `${language === 'en' ? 'Secretary of the Board' : 'أمين المجلس'}\n`;
    content += `${language === 'en' ? 'Signature: _____________________' : 'التوقيع: _____________________'}\n`;
    content += `${language === 'en' ? 'Date: _____________________' : 'التاريخ: _____________________'}\n`;

    return content;
  };

  const generateWord = () => {
    const content = generateWordContent();
    if (!content) return;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const templateTitle = language === 'en' ? template?.titleEn : template?.titleAr;
    saveAs(blob, `${companyName.replace(/\s+/g, '_')}_${templateTitle?.replace(/\s+/g, '_')}.txt`);
  };

  const generatePDF = () => {
    if (!companyName || !template || !boardMembers) {
      alert(t.fillRequired);
      return;
    }

    const fields = language === 'en' ? template.fieldsEn : template.fieldsAr;
    const allFieldsFilled = fields.every(field => resolutionValues[field]);
    if (!allFieldsFilled) {
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

    const templateTitle = language === 'en' ? template.titleEn : template.titleAr;
    addText(templateTitle, 16, true, 8);
    yPosition += 5;

    addText(language === 'en' ? 'BOARD RESOLUTION' : 'قرار المجلس', 14, true, 7);
    yPosition += 5;

    addText(`${language === 'en' ? 'Company: ' : 'الشركة: '}${companyName}`, 11, false, 5);
    addText(`${language === 'en' ? 'Date: ' : 'التاريخ: '}${boardMeetingDate}`, 11, false, 5);
    addText(`${language === 'en' ? 'Board Members Present: ' : 'أعضاء المجلس الحاضرون: '}${boardMembers}`, 11, false, 6);
    yPosition += 5;

    addText(language === 'en' ? 'WHEREAS' : 'حيث', 12, true, 6);
    addText(
      language === 'en'
        ? `The Board of Directors of ${companyName} convened on ${boardMeetingDate} to consider the following matter.`
        : `انعقد مجلس إدارة ${companyName} في ${boardMeetingDate} للنظر في المسألة التالية.`,
      11,
      false,
      6
    );
    yPosition += 5;

    addText(language === 'en' ? 'NOW, THEREFORE, BE IT RESOLVED' : 'والآن، لذا يتم قرار ما يلي', 12, true, 6);
    yPosition += 3;

    fields.forEach(field => {
      const value = resolutionValues[field];
      addText(`${field}: ${value}`, 11, false, 5);
    });

    yPosition += 5;
    addText(language === 'en' ? 'IN WITNESS WHEREOF' : 'شهادة على ذلك', 12, true, 6);
    addText(
      language === 'en'
        ? 'The undersigned, being the Secretary of the Board, certifies that the foregoing resolution was duly adopted by the Board of Directors.'
        : 'يشهد الموقع أدناه، بصفته أمين المجلس، بأن القرار أعلاه تم اعتماده بشكل صحيح من قبل مجلس الإدارة.',
      11,
      false,
      6
    );
    yPosition += 5;

    addText(language === 'en' ? 'Secretary of the Board' : 'أمين المجلس', 11, true, 4);
    addText(`${language === 'en' ? 'Signature: ' : 'التوقيع: '}_____________________`, 11, false, 4);
    addText(`${language === 'en' ? 'Date: ' : 'التاريخ: '}_____________________`, 11, false, 6);

    doc.setFontSize(9);
    doc.setTextColor(100);
    const footerText =
      language === 'en'
        ? 'This resolution was generated using Polaris Arabia Legal Tools. Consult a lawyer before adoption.'
        : 'تم إنشاء هذا القرار باستخدام أدوات Polaris Arabia القانونية. استشر محامياً قبل الموافقة عليه.';
    doc.text(footerText, isRTL ? pageWidth - margin : margin, pageHeight - 10, { align: isRTL ? 'right' : 'left' });

    const templateFileName = templateTitle?.replace(/\s+/g, '_');
    doc.save(`${companyName.replace(/\s+/g, '_')}_${templateFileName}.pdf`);
  };

  return (
    <div className={`min-h-screen p-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              {t.title}
            </h1>
            <p className="text-sm text-muted-foreground">{t.subtitle}</p>
          </div>

          {/* Language Toggle */}
          <div className="flex gap-1 bg-secondary rounded-md p-1 border border-border">
            <Button
              variant={language === 'en' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="rounded"
            >
              EN
            </Button>
            <Button
              variant={language === 'ar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLanguage('ar')}
              className="rounded"
            >
              AR
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            {t.step} {step === 'select' ? '1' : '2'} {t.of} 2
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div 
              className="h-1.5 rounded-full bg-primary transition-all duration-300"
              style={{ width: step === 'select' ? '50%' : '100%' }}
            />
          </div>
        </div>

        {/* Step 1: Select Template */}
        {step === 'select' && (
          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-lg">{t.selectTemplate}</CardTitle>
                <CardDescription className="text-xs">
                  {language === 'en' ? `Choose from ${templates.length} resolution types` : `اختر من ${templates.length} نوع قرار`}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => handleTemplateSelect(tmpl.id)}
                      className="p-4 border border-border rounded-md hover:bg-secondary hover:border-primary transition-colors text-left group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                          {language === 'en' ? tmpl.titleEn : tmpl.titleAr}
                        </h3>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {language === 'en' ? tmpl.descriptionEn : tmpl.descriptionAr}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Info Box */}
            <div className="p-3 bg-secondary border border-border rounded-md flex gap-3">
              <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-foreground mb-1">{t.important}</p>
                <p className="text-xs text-muted-foreground">{t.disclaimer}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Resolution Details */}
        {step === 'details' && template && (
          <div className="space-y-6">
            <Card className="border-border">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-lg">
                  {language === 'en' ? template.titleEn : template.titleAr}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Company Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company-name" className="text-sm font-medium flex items-center gap-2">
                        {t.companyName}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="company-name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder={language === 'en' ? 'e.g., Tech Startup Inc.' : 'مثال: شركة تقنية'}
                        className="mt-2"
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>

                    <div>
                      <Label htmlFor="board-date" className="text-sm font-medium flex items-center gap-2">
                        {t.boardMeetingDate}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="board-date"
                        type="date"
                        value={boardMeetingDate}
                        onChange={(e) => setBoardMeetingDate(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="board-members" className="text-sm font-medium flex items-center gap-2">
                      {t.boardMembers}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="board-members"
                      value={boardMembers}
                      onChange={(e) => setBoardMembers(e.target.value)}
                      placeholder={language === 'en' ? 'List board members present (comma-separated)' : 'قائمة أعضاء المجلس الحاضرين (مفصولة بفواصل)'}
                      className="mt-2 min-h-16"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>

                  {/* Dynamic Fields */}
                  <div className="border-t border-border pt-4 mt-4">
                    <h3 className="text-sm font-medium text-foreground mb-4">{t.resolutionDetails}</h3>
                    <div className="space-y-3">
                      {(language === 'en' ? template.fieldsEn : template.fieldsAr).map((field, index) => (
                        <div key={index}>
                          <Label htmlFor={`field-${index}`} className="text-xs font-medium flex items-center gap-2">
                            {field}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`field-${index}`}
                            value={resolutionValues[field] || ''}
                            onChange={(e) => handleValueChange(field, e.target.value)}
                            placeholder={language === 'en' ? `Enter ${field.toLowerCase()}` : `أدخل ${field}`}
                            className="mt-1 h-8 text-sm"
                            dir={isRTL ? 'rtl' : 'ltr'}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setStep('select')}
                variant="outline"
                className="h-10 text-sm"
              >
                {t.backStep}
              </Button>
              <Button
                onClick={generatePDF}
                className="flex-1 h-10 text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                {t.downloadPDF}
              </Button>
              <Button
                onClick={generateWord}
                variant="outline"
                className="flex-1 h-10 text-sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                {t.downloadWord}
              </Button>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-secondary border border-border rounded-md flex gap-3">
              <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-foreground mb-1">{t.important}</p>
                <p className="text-xs text-muted-foreground">{t.disclaimer}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
