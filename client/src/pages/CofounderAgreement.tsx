import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Plus, Trash2, Globe, FileText, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

interface Founder {
  id: string;
  name: string;
  address: string;
  equity: number;
  role: string;
  responsibilities: string;
}

type Language = 'en' | 'ar';

const translations = {
  en: {
    title: 'Co-Founder Agreement',
    subtitle: 'Generate professional co-founder agreements',
    companyInfo: 'Company Information',
    companyName: 'Company Name',
    businessDescription: 'Business Description',
    agreementDate: 'Agreement Date',
    jurisdiction: 'Jurisdiction',
    vestingPeriod: 'Vesting Period (Years)',
    cliffPeriod: 'Cliff Period (Months)',
    monthlySalary: 'Monthly Salary (USD)',
    nonCompete: 'Non-Compete Period (Months)',
    founders: 'Founders',
    founder: 'Founder',
    fullName: 'Full Name',
    address: 'Address',
    equity: 'Equity %',
    roleTitle: 'Role/Title',
    responsibilities: 'Responsibilities',
    addFounder: 'Add Another Founder',
    downloadPDF: 'Download PDF',
    downloadWord: 'Download Word',
    fillRequired: 'Please fill in all required fields',
    totalEquity: 'Total equity must equal 100%',
    important: 'Important:',
    disclaimer: 'This tool generates a template agreement. Before signing, have a qualified lawyer in your jurisdiction review and advise on this agreement. This is not legal advice.',
    months: 'Months',
    years: 'Years',
    saudi: 'Saudi Arabia',
    uae: 'UAE',
    delaware: 'Delaware (US)',
    california: 'California (US)',
    step: 'Step',
    of: 'of',
    equityTotal: 'Total Equity',
    requiredField: 'Required',
  },
  ar: {
    title: 'اتفاقية المؤسسين المشاركين',
    subtitle: 'قم بإنشاء اتفاقية مؤسسين احترافية',
    companyInfo: 'معلومات الشركة',
    companyName: 'اسم الشركة',
    businessDescription: 'وصف النشاط التجاري',
    agreementDate: 'تاريخ الاتفاقية',
    jurisdiction: 'الاختصاص القضائي',
    vestingPeriod: 'فترة الاستحقاق (سنوات)',
    cliffPeriod: 'فترة الانتظار (أشهر)',
    monthlySalary: 'الراتب الشهري (دولار أمريكي)',
    nonCompete: 'فترة عدم المنافسة (أشهر)',
    founders: 'المؤسسون',
    founder: 'المؤسس',
    fullName: 'الاسم الكامل',
    address: 'العنوان',
    equity: 'النسبة المئوية للملكية',
    roleTitle: 'المسمى الوظيفي',
    responsibilities: 'المسؤوليات',
    addFounder: 'إضافة مؤسس آخر',
    downloadPDF: 'تحميل PDF',
    downloadWord: 'تحميل Word',
    fillRequired: 'يرجى ملء جميع الحقول المطلوبة',
    totalEquity: 'يجب أن تساوي إجمالي الملكية 100٪',
    important: 'مهم:',
    disclaimer: 'تنشئ هذه الأداة اتفاقية نموذجية. قبل التوقيع، اطلب من محام مؤهل في اختصاصك القضائي مراجعة هذه الاتفاقية والإدلاء برأيه. هذا ليس استشارة قانونية.',
    months: 'أشهر',
    years: 'سنوات',
    saudi: 'المملكة العربية السعودية',
    uae: 'الإمارات العربية المتحدة',
    delaware: 'ديلاوير (الولايات المتحدة)',
    california: 'كاليفورنيا (الولايات المتحدة)',
    step: 'الخطوة',
    of: 'من',
    equityTotal: 'إجمالي الملكية',
    requiredField: 'مطلوب',
  },
};

export default function CofounderAgreement() {
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];
  const isRTL = language === 'ar';

  const [companyName, setCompanyName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [vestingYears, setVestingYears] = useState('4');
  const [cliffMonths, setCliffMonths] = useState('12');
  const [founders, setFounders] = useState<Founder[]>([
    { id: '1', name: '', address: '', equity: 0, role: '', responsibilities: '' },
    { id: '2', name: '', address: '', equity: 0, role: '', responsibilities: '' },
  ]);
  const [jurisdiction, setJurisdiction] = useState('saudi-arabia');
  const [nonCompeteMonths, setNonCompeteMonths] = useState('12');
  const [salaryPerMonth, setSalaryPerMonth] = useState('0');
  const [agreementDate, setAgreementDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedFounder, setExpandedFounder] = useState<string | null>('1');

  const totalEquity = founders.reduce((sum, f) => sum + f.equity, 0);
  const isEquityValid = Math.abs(totalEquity - 100) < 0.01;

  const addFounder = () => {
    const newId = String(Math.max(...founders.map(f => parseInt(f.id)), 0) + 1);
    setFounders([...founders, { id: newId, name: '', address: '', equity: 0, role: '', responsibilities: '' }]);
  };

  const removeFounder = (id: string) => {
    if (founders.length > 2) {
      setFounders(founders.filter(f => f.id !== id));
    }
  };

  const updateFounder = (id: string, field: keyof Founder, value: any) => {
    setFounders(founders.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const generateWordContent = () => {
    if (!companyName || founders.some(f => !f.name || f.equity === 0)) {
      alert(t.fillRequired);
      return '';
    }

    if (!isEquityValid) {
      alert(t.totalEquity);
      return '';
    }

    let content = '';
    content += `${language === 'en' ? 'CO-FOUNDER AGREEMENT' : 'اتفاقية المؤسسين المشاركين'}\n\n`;
    content += `${language === 'en' ? `This Co-Founder Agreement is entered into as of ${agreementDate}` : `تم إبرام اتفاقية المؤسسين المشاركين هذه بتاريخ ${agreementDate}`}\n\n`;

    founders.forEach((founder, index) => {
      const founderLabel = language === 'en' ? `Founder ${index + 1}` : `المؤسس ${index + 1}`;
      content += `${founder.name}, ${language === 'en' ? 'residing at' : 'يقيم في'} ${founder.address} ("${founderLabel}")\n`;
    });

    content += `\n${language === 'en' ? 'Collectively referred to as the "Founders" and the "Company".' : 'يشار إليهم بشكل جماعي باسم "المؤسسين" و"الشركة".'}\n\n`;
    content += `${language === 'en' ? '1. FORMATION AND PURPOSE' : '1. التكوين والغرض'}\n\n`;
    content += `${language === 'en' ? `The Founders agree to form a company for the purpose of ${businessDescription}. The Founders intend to work together as equal partners in building this venture and agree to be bound by the terms and conditions set forth in this Agreement.` : `يوافق المؤسسون على تشكيل شركة لغرض ${businessDescription}. ينوي المؤسسون العمل معاً كشركاء متساويين في بناء هذا المشروع ويوافقون على الالتزام بالشروط والأحكام المنصوص عليها في هذه الاتفاقية.`}\n\n`;
    content += `${language === 'en' ? '2. EQUITY OWNERSHIP AND VESTING' : '2. ملكية الأسهم والاستحقاق'}\n\n`;
    content += `${language === 'en' ? '2.1 Initial Equity Allocation' : '2.1 تخصيص الأسهم الأولي'}\n\n`;

    founders.forEach(founder => {
      content += `${founder.name}: ${founder.equity}%\n`;
    });

    content += `\n${language === 'en' ? '2.2 Vesting Schedule' : '2.2 جدول الاستحقاق'}\n\n`;
    content += `${language === 'en' ? `All equity is subject to a ${vestingYears}-year vesting schedule with a ${cliffMonths}-month cliff. Upon the 1-year anniversary, 25% of equity vests. The remaining 75% vests monthly over the following ${parseInt(vestingYears) - 1} years.` : `جميع الأسهم تخضع لجدول استحقاق مدته ${vestingYears} سنة مع فترة انتظار ${cliffMonths} شهراً. عند الذكرى السنوية الأولى، يتم استحقاق 25٪ من الأسهم. يتم استحقاق الـ 75٪ المتبقية شهرياً على مدى السنوات الـ ${parseInt(vestingYears) - 1} التالية.`}\n\n`;

    content += `${language === 'en' ? '3. ROLES AND RESPONSIBILITIES' : '3. الأدوار والمسؤوليات'}\n\n`;
    founders.forEach((founder, index) => {
      const founderLabel = language === 'en' ? `Founder ${index + 1}` : `المؤسس ${index + 1}`;
      content += `${founderLabel}: ${founder.role}\n`;
      content += `${language === 'en' ? 'Responsibilities' : 'المسؤوليات'}: ${founder.responsibilities}\n\n`;
    });

    content += `${language === 'en' ? '4. DECISION-MAKING AND GOVERNANCE' : '4. صنع القرار والحوكمة'}\n\n`;
    content += `${language === 'en' ? 'Each Founder has equal voting rights. Major decisions including admission of new equity holders, sale/merger of the Company, hiring C-level executives, and amendments to this Agreement require unanimous written consent.' : 'لكل مؤسس حقوق تصويت متساوية. القرارات الرئيسية بما في ذلك قبول مالكي أسهم جدد، بيع/دمج الشركة، توظيف المديرين التنفيذيين، والتعديلات على هذه الاتفاقية تتطلب موافقة كتابية إجماعية.'}\n\n`;

    content += `${language === 'en' ? '5. INTELLECTUAL PROPERTY' : '5. الملكية الفكرية'}\n\n`;
    content += `${language === 'en' ? 'All intellectual property created by any Founder in connection with the Company\'s business shall be the exclusive property of the Company.' : 'جميع الملكية الفكرية التي ينشئها أي مؤسس فيما يتعلق بنشاط الشركة تكون ملكاً حصرياً للشركة.'}\n\n`;

    content += `${language === 'en' ? '6. COMPENSATION AND DISTRIBUTIONS' : '6. التعويض والتوزيعات'}\n\n`;
    content += `${language === 'en' ? `During the Company's early stage, Founders agree to work at a salary of $${salaryPerMonth} per month.` : `خلال المرحلة الأولى من الشركة، يوافق المؤسسون على العمل براتب ${salaryPerMonth} دولار شهرياً.`}\n\n`;

    content += `${language === 'en' ? '7. CONFIDENTIALITY AND NON-COMPETE' : '7. السرية وعدم المنافسة'}\n\n`;
    content += `${language === 'en' ? `Each Founder agrees to maintain strict confidentiality. For ${nonCompeteMonths} months after departure, Founders shall not engage in competing businesses.` : `يوافق كل مؤسس على الحفاظ على السرية الصارمة. لمدة ${nonCompeteMonths} شهراً بعد المغادرة، لا يجوز للمؤسسين الانخراط في أعمال تنافسية.`}\n\n`;

    content += `${language === 'en' ? 'SIGNATURES' : 'التوقيعات'}\n\n`;

    founders.forEach((founder, index) => {
      const founderLabel = language === 'en' ? `FOUNDER ${index + 1}` : `المؤسس ${index + 1}`;
      content += `${founderLabel}\n`;
      content += `${language === 'en' ? 'Name' : 'الاسم'}: ${founder.name}\n`;
      content += `${language === 'en' ? 'Signature' : 'التوقيع'}: _____________________\n`;
      content += `${language === 'en' ? 'Date' : 'التاريخ'}: _____________________\n\n`;
    });

    return content;
  };

  const generateWord = () => {
    const content = generateWordContent();
    if (!content) return;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${companyName.replace(/\s+/g, '_')}_CofounderAgreement.txt`);
  };

  const generatePDF = () => {
    if (!companyName || founders.some(f => !f.name || f.equity === 0)) {
      alert(t.fillRequired);
      return;
    }

    if (!isEquityValid) {
      alert(t.totalEquity);
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

    addText(language === 'en' ? 'CO-FOUNDER AGREEMENT' : 'اتفاقية المؤسسين المشاركين', 16, true, 8);
    yPosition += 5;

    addText(
      language === 'en'
        ? `This Co-Founder Agreement is entered into as of ${agreementDate}`
        : `تم إبرام اتفاقية المؤسسين المشاركين هذه بتاريخ ${agreementDate}`,
      11,
      false,
      6
    );
    yPosition += 3;

    founders.forEach((founder, index) => {
      const founderLabel = language === 'en' ? `Founder ${index + 1}` : `المؤسس ${index + 1}`;
      addText(`${founder.name}, ${language === 'en' ? 'residing at' : 'يقيم في'} ${founder.address} ("${founderLabel}")`, 11, false, 5);
    });

    yPosition += 5;
    addText(
      language === 'en'
        ? 'Collectively referred to as the "Founders" and the "Company".'
        : 'يشار إليهم بشكل جماعي باسم "المؤسسين" و"الشركة".',
      11,
      false,
      6
    );
    yPosition += 8;

    addText(language === 'en' ? '1. FORMATION AND PURPOSE' : '1. التكوين والغرض', 12, true, 6);
    addText(
      language === 'en'
        ? `The Founders agree to form a company for the purpose of ${businessDescription}. The Founders intend to work together as equal partners in building this venture and agree to be bound by the terms and conditions set forth in this Agreement.`
        : `يوافق المؤسسون على تشكيل شركة لغرض ${businessDescription}. ينوي المؤسسون العمل معاً كشركاء متساويين في بناء هذا المشروع ويوافقون على الالتزام بالشروط والأحكام المنصوص عليها في هذه الاتفاقية.`,
      11,
      false,
      6
    );
    yPosition += 5;

    addText(language === 'en' ? '2. EQUITY OWNERSHIP AND VESTING' : '2. ملكية الأسهم والاستحقاق', 12, true, 6);
    addText(language === 'en' ? '2.1 Initial Equity Allocation' : '2.1 تخصيص الأسهم الأولي', 11, true, 5);
    yPosition += 3;

    founders.forEach(founder => {
      addText(`${founder.name}: ${founder.equity}%`, 11, false, 4);
    });

    yPosition += 5;
    addText(language === 'en' ? '2.2 Vesting Schedule' : '2.2 جدول الاستحقاق', 11, true, 5);
    addText(
      language === 'en'
        ? `All equity is subject to a ${vestingYears}-year vesting schedule with a ${cliffMonths}-month cliff. Upon the 1-year anniversary, 25% of equity vests. The remaining 75% vests monthly over the following ${parseInt(vestingYears) - 1} years.`
        : `جميع الأسهم تخضع لجدول استحقاق مدته ${vestingYears} سنة مع فترة انتظار ${cliffMonths} شهراً. عند الذكرى السنوية الأولى، يتم استحقاق 25٪ من الأسهم. يتم استحقاق الـ 75٪ المتبقية شهرياً على مدى السنوات الـ ${parseInt(vestingYears) - 1} التالية.`,
      11,
      false,
      6
    );
    yPosition += 5;

    addText(language === 'en' ? '3. ROLES AND RESPONSIBILITIES' : '3. الأدوار والمسؤوليات', 12, true, 6);
    founders.forEach((founder, index) => {
      const founderLabel = language === 'en' ? `Founder ${index + 1}` : `المؤسس ${index + 1}`;
      addText(`${founderLabel}: ${founder.role}`, 11, true, 4);
      addText(
        language === 'en'
          ? `Responsibilities: ${founder.responsibilities}`
          : `المسؤوليات: ${founder.responsibilities}`,
        11,
        false,
        5
      );
      yPosition += 2;
    });

    yPosition += 5;

    addText(language === 'en' ? '4. DECISION-MAKING AND GOVERNANCE' : '4. صنع القرار والحوكمة', 12, true, 6);
    addText(
      language === 'en'
        ? 'Each Founder has equal voting rights. Major decisions including admission of new equity holders, sale/merger of the Company, hiring C-level executives, and amendments to this Agreement require unanimous written consent.'
        : 'لكل مؤسس حقوق تصويت متساوية. القرارات الرئيسية بما في ذلك قبول مالكي أسهم جدد، بيع/دمج الشركة، توظيف المديرين التنفيذيين، والتعديلات على هذه الاتفاقية تتطلب موافقة كتابية إجماعية.',
      11,
      false,
      6
    );
    yPosition += 5;

    addText(language === 'en' ? '5. INTELLECTUAL PROPERTY' : '5. الملكية الفكرية', 12, true, 6);
    addText(
      language === 'en'
        ? 'All intellectual property created by any Founder in connection with the Company\'s business shall be the exclusive property of the Company.'
        : 'جميع الملكية الفكرية التي ينشئها أي مؤسس فيما يتعلق بنشاط الشركة تكون ملكاً حصرياً للشركة.',
      11,
      false,
      6
    );
    yPosition += 5;

    addText(language === 'en' ? '6. COMPENSATION AND DISTRIBUTIONS' : '6. التعويض والتوزيعات', 12, true, 6);
    addText(
      language === 'en'
        ? `During the Company's early stage, Founders agree to work at a salary of $${salaryPerMonth} per month.`
        : `خلال المرحلة الأولى من الشركة، يوافق المؤسسون على العمل براتب ${salaryPerMonth} دولار شهرياً.`,
      11,
      false,
      6
    );
    yPosition += 5;

    addText(language === 'en' ? '7. CONFIDENTIALITY AND NON-COMPETE' : '7. السرية وعدم المنافسة', 12, true, 6);
    addText(
      language === 'en'
        ? `Each Founder agrees to maintain strict confidentiality. For ${nonCompeteMonths} months after departure, Founders shall not engage in competing businesses.`
        : `يوافق كل مؤسس على الحفاظ على السرية الصارمة. لمدة ${nonCompeteMonths} شهراً بعد المغادرة، لا يجوز للمؤسسين الانخراط في أعمال تنافسية.`,
      11,
      false,
      6
    );
    yPosition += 10;

    addText(language === 'en' ? 'SIGNATURES' : 'التوقيعات', 12, true, 6);
    yPosition += 5;

    founders.forEach((founder, index) => {
      const founderLabel = language === 'en' ? `FOUNDER ${index + 1}` : `المؤسس ${index + 1}`;
      addText(founderLabel, 11, true, 4);
      addText(`${language === 'en' ? 'Name' : 'الاسم'}: ${founder.name}`, 11, false, 4);
      addText(`${language === 'en' ? 'Signature' : 'التوقيع'}: _____________________`, 11, false, 4);
      addText(`${language === 'en' ? 'Date' : 'التاريخ'}: _____________________`, 11, false, 6);
      yPosition += 3;
    });

    doc.setFontSize(9);
    doc.setTextColor(100);
    const footerText =
      language === 'en'
        ? 'This agreement was generated using Polaris Arabia Legal Tools. Consult a lawyer before signing.'
        : 'تم إنشاء هذه الاتفاقية باستخدام أدوات Polaris Arabia القانونية. استشر محامياً قبل التوقيع.';
    doc.text(footerText, isRTL ? pageWidth - margin : margin, pageHeight - 10, { align: isRTL ? 'right' : 'left' });

    doc.save(`${companyName.replace(/\s+/g, '_')}_CofounderAgreement.pdf`);
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
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t.equityTotal}: {totalEquity.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${isEquityValid ? 'bg-primary' : 'bg-destructive'}`}
              style={{ width: `${Math.min(totalEquity, 100)}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Company Information Section */}
          <Card className="border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg">{t.companyInfo}</CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
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
                  <Label htmlFor="agreement-date" className="text-sm font-medium flex items-center gap-2">
                    {t.agreementDate}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="agreement-date"
                    type="date"
                    value={agreementDate}
                    onChange={(e) => setAgreementDate(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="business-description" className="text-sm font-medium flex items-center gap-2">
                  {t.businessDescription}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="business-description"
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder={language === 'en' ? 'Describe your company\'s business purpose...' : 'صف غرض عمل شركتك...'}
                  className="mt-2 min-h-20"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div>
                  <Label htmlFor="jurisdiction" className="text-xs font-medium">
                    {t.jurisdiction}
                  </Label>
                  <Select value={jurisdiction} onValueChange={setJurisdiction}>
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saudi-arabia">{t.saudi}</SelectItem>
                      <SelectItem value="uae">{t.uae}</SelectItem>
                      <SelectItem value="delaware">{t.delaware}</SelectItem>
                      <SelectItem value="california">{t.california}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vesting-years" className="text-xs font-medium">
                    {t.vestingPeriod}
                  </Label>
                  <Select value={vestingYears} onValueChange={setVestingYears}>
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 {t.years}</SelectItem>
                      <SelectItem value="4">4 {t.years}</SelectItem>
                      <SelectItem value="5">5 {t.years}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cliff-months" className="text-xs font-medium">
                    {t.cliffPeriod}
                  </Label>
                  <Select value={cliffMonths} onValueChange={setCliffMonths}>
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 {t.months}</SelectItem>
                      <SelectItem value="12">12 {t.months}</SelectItem>
                      <SelectItem value="24">24 {t.months}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="non-compete" className="text-xs font-medium">
                    {t.nonCompete}
                  </Label>
                  <Select value={nonCompeteMonths} onValueChange={setNonCompeteMonths}>
                    <SelectTrigger className="mt-1 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 {t.months}</SelectItem>
                      <SelectItem value="12">12 {t.months}</SelectItem>
                      <SelectItem value="24">24 {t.months}</SelectItem>
                      <SelectItem value="36">36 {t.months}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-3">
                <Label htmlFor="salary" className="text-xs font-medium">
                  {t.monthlySalary}
                </Label>
                <Input
                  id="salary"
                  type="number"
                  value={salaryPerMonth}
                  onChange={(e) => setSalaryPerMonth(e.target.value)}
                  placeholder="0"
                  className="mt-1 h-9 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Founders Section */}
          <Card className="border-border">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg">{t.founders}</CardTitle>
              <CardDescription className="text-xs">
                {language === 'en' ? `${founders.length} founders added` : `تم إضافة ${founders.length} مؤسسين`}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <div className="space-y-2">
                {founders.map((founder, index) => (
                  <div key={founder.id} className="border border-border rounded-md overflow-hidden">
                    <button
                      onClick={() => setExpandedFounder(expandedFounder === founder.id ? null : founder.id)}
                      className="w-full px-4 py-3 bg-secondary hover:bg-secondary/80 flex items-center justify-between transition-colors text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center text-primary font-semibold text-xs">
                          {index + 1}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-foreground">{founder.name || `${t.founder} ${index + 1}`}</p>
                          <p className="text-xs text-muted-foreground">{founder.equity}% {language === 'en' ? 'equity' : 'ملكية'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {founder.equity > 0 && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedFounder === founder.id ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {expandedFounder === founder.id && (
                      <div className="p-4 bg-background border-t border-border space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-medium flex items-center gap-2">
                              {t.fullName}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              value={founder.name}
                              onChange={(e) => updateFounder(founder.id, 'name', e.target.value)}
                              placeholder={language === 'en' ? 'Full name' : 'الاسم الكامل'}
                              className="mt-1 h-8 text-sm"
                              dir={isRTL ? 'rtl' : 'ltr'}
                            />
                          </div>

                          <div>
                            <Label className="text-xs font-medium flex items-center gap-2">
                              {t.equity}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              type="number"
                              value={founder.equity}
                              onChange={(e) => updateFounder(founder.id, 'equity', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              min="0"
                              max="100"
                              className="mt-1 h-8 text-sm"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Label className="text-xs font-medium">
                              {t.address}
                            </Label>
                            <Input
                              value={founder.address}
                              onChange={(e) => updateFounder(founder.id, 'address', e.target.value)}
                              placeholder={language === 'en' ? 'Full address' : 'العنوان الكامل'}
                              className="mt-1 h-8 text-sm"
                              dir={isRTL ? 'rtl' : 'ltr'}
                            />
                          </div>

                          <div>
                            <Label className="text-xs font-medium flex items-center gap-2">
                              {t.roleTitle}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              value={founder.role}
                              onChange={(e) => updateFounder(founder.id, 'role', e.target.value)}
                              placeholder={language === 'en' ? 'e.g., CEO, CTO' : 'مثال: الرئيس التنفيذي'}
                              className="mt-1 h-8 text-sm"
                              dir={isRTL ? 'rtl' : 'ltr'}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <Label className="text-xs font-medium">
                              {t.responsibilities}
                            </Label>
                            <Textarea
                              value={founder.responsibilities}
                              onChange={(e) => updateFounder(founder.id, 'responsibilities', e.target.value)}
                              placeholder={language === 'en' ? 'Key responsibilities...' : 'المسؤوليات الرئيسية...'}
                              className="mt-1 min-h-16 text-sm"
                              dir={isRTL ? 'rtl' : 'ltr'}
                            />
                          </div>
                        </div>

                        {founders.length > 2 && (
                          <Button
                            onClick={() => removeFounder(founder.id)}
                            variant="destructive"
                            size="sm"
                            className="w-full h-8 text-xs"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            {language === 'en' ? 'Remove Founder' : 'إزالة المؤسس'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button
                onClick={addFounder}
                variant="outline"
                className="w-full mt-3 h-9 text-sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                {t.addFounder}
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
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
      </div>
    </div>
  );
}
