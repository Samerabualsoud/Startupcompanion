import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';

type ResolutionType = 
  | 'equity-grant' 
  | 'seed-financing' 
  | 'officer-appointment' 
  | 'annual-budget' 
  | 'related-party' 
  | 'acquisition' 
  | 'bank-account' 
  | 'stock-option-plan' 
  | 'certificate-amendment' 
  | 'major-contract';

interface ResolutionTemplate {
  id: ResolutionType;
  title: string;
  description: string;
  fields: { name: string; label: string; type: 'text' | 'number' | 'textarea' | 'date' }[];
}

const RESOLUTION_TEMPLATES: ResolutionTemplate[] = [
  {
    id: 'equity-grant',
    title: 'Equity Grant to Employee',
    description: 'Grant stock options, RSUs, or restricted stock to an employee',
    fields: [
      { name: 'employeeName', label: 'Employee Name', type: 'text' },
      { name: 'position', label: 'Position/Title', type: 'text' },
      { name: 'grantType', label: 'Grant Type (Stock Options/RSUs/Restricted Stock)', type: 'text' },
      { name: 'numberOfShares', label: 'Number of Shares/Units', type: 'number' },
      { name: 'exercisePrice', label: 'Exercise Price ($)', type: 'number' },
      { name: 'grantDate', label: 'Grant Date', type: 'date' },
    ],
  },
  {
    id: 'seed-financing',
    title: 'Seed Financing Approval',
    description: 'Approve a seed round of financing (SAFE, convertible note, or equity)',
    fields: [
      { name: 'financingType', label: 'Financing Type (SAFE/Convertible Note/Equity)', type: 'text' },
      { name: 'totalAmount', label: 'Total Amount ($)', type: 'number' },
      { name: 'leadInvestor', label: 'Lead Investor Name(s)', type: 'text' },
      { name: 'valuation', label: 'Pre-Money Valuation ($)', type: 'number' },
      { name: 'investorEquity', label: 'Investor Equity (%)', type: 'number' },
      { name: 'useOfProceeds', label: 'Use of Proceeds', type: 'textarea' },
      { name: 'closingDate', label: 'Expected Closing Date', type: 'date' },
    ],
  },
  {
    id: 'officer-appointment',
    title: 'Appointment of Officers',
    description: 'Appoint CEO, CFO, CTO, Secretary, or other officers',
    fields: [
      { name: 'ceoName', label: 'CEO Name', type: 'text' },
      { name: 'cfoName', label: 'CFO Name', type: 'text' },
      { name: 'ctoName', label: 'CTO Name', type: 'text' },
      { name: 'secretaryName', label: 'Secretary Name', type: 'text' },
      { name: 'effectiveDate', label: 'Effective Date', type: 'date' },
    ],
  },
  {
    id: 'annual-budget',
    title: 'Annual Budget Approval',
    description: 'Approve the company\'s annual budget',
    fields: [
      { name: 'fiscalYear', label: 'Fiscal Year', type: 'text' },
      { name: 'revenueProjection', label: 'Revenue Projection ($)', type: 'number' },
      { name: 'operatingExpenses', label: 'Operating Expenses ($)', type: 'number' },
      { name: 'capitalExpenditure', label: 'Capital Expenditure ($)', type: 'number' },
      { name: 'headcount', label: 'Planned Headcount', type: 'number' },
      { name: 'capexApprovalLimit', label: 'CapEx Approval Limit ($)', type: 'number' },
    ],
  },
  {
    id: 'related-party',
    title: 'Related-Party Transaction Approval',
    description: 'Approve a transaction with a founder, investor, or related party',
    fields: [
      { name: 'relatedParty', label: 'Related Party Name', type: 'text' },
      { name: 'relationship', label: 'Relationship (Founder/Investor/Family/Other)', type: 'text' },
      { name: 'transactionType', label: 'Transaction Type (Lease/Loan/Service/Other)', type: 'text' },
      { name: 'amount', label: 'Transaction Amount ($)', type: 'number' },
      { name: 'terms', label: 'Key Terms', type: 'textarea' },
      { name: 'businessPurpose', label: 'Business Purpose', type: 'textarea' },
    ],
  },
  {
    id: 'acquisition',
    title: 'Acquisition or Merger Approval',
    description: 'Approve an acquisition, merger, or asset purchase',
    fields: [
      { name: 'transactionType', label: 'Transaction Type (Acquisition/Merger/Asset Purchase)', type: 'text' },
      { name: 'targetCompany', label: 'Target Company Name', type: 'text' },
      { name: 'consideration', label: 'Consideration Amount ($)', type: 'number' },
      { name: 'valuation', label: 'Valuation ($)', type: 'number' },
      { name: 'closingDate', label: 'Expected Closing Date', type: 'date' },
      { name: 'keyTerms', label: 'Key Terms & Conditions', type: 'textarea' },
    ],
  },
  {
    id: 'bank-account',
    title: 'Bank Account & Credit Facilities',
    description: 'Establish banking arrangements and credit lines',
    fields: [
      { name: 'bankName', label: 'Bank Name', type: 'text' },
      { name: 'accountType', label: 'Account Type (Checking/Savings/Money Market)', type: 'text' },
      { name: 'creditLineAmount', label: 'Credit Line Amount ($)', type: 'number' },
      { name: 'authorizedSignatory1', label: 'Authorized Signatory 1', type: 'text' },
      { name: 'authorizedSignatory2', label: 'Authorized Signatory 2', type: 'text' },
      { name: 'signingLimit', label: 'Individual Signing Limit ($)', type: 'number' },
    ],
  },
  {
    id: 'stock-option-plan',
    title: 'Stock Option Plan Adoption',
    description: 'Adopt a stock option or equity compensation plan',
    fields: [
      { name: 'planName', label: 'Plan Name', type: 'text' },
      { name: 'effectiveDate', label: 'Effective Date', type: 'date' },
      { name: 'sharesReserved', label: 'Total Shares Reserved', type: 'number' },
      { name: 'vestingSchedule', label: 'Vesting Schedule (e.g., 4-year with 1-year cliff)', type: 'text' },
      { name: 'planTerm', label: 'Plan Term (Years)', type: 'number' },
    ],
  },
  {
    id: 'certificate-amendment',
    title: 'Certificate of Incorporation Amendment',
    description: 'Amend the company\'s Certificate of Incorporation',
    fields: [
      { name: 'currentProvision', label: 'Current Provision', type: 'textarea' },
      { name: 'proposedAmendment', label: 'Proposed Amendment', type: 'textarea' },
      { name: 'reason', label: 'Reason for Amendment', type: 'textarea' },
      { name: 'effectiveDate', label: 'Effective Date', type: 'date' },
    ],
  },
  {
    id: 'major-contract',
    title: 'Major Contract Approval',
    description: 'Approve a major service agreement, partnership, or contract',
    fields: [
      { name: 'contractType', label: 'Contract Type', type: 'text' },
      { name: 'counterparty', label: 'Counterparty Name', type: 'text' },
      { name: 'contractValue', label: 'Contract Value ($)', type: 'number' },
      { name: 'term', label: 'Contract Term (Years)', type: 'number' },
      { name: 'keyTerms', label: 'Key Terms', type: 'textarea' },
      { name: 'businessPurpose', label: 'Business Purpose', type: 'textarea' },
    ],
  },
];

export default function BoardResolutions() {
  const [companyName, setCompanyName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ResolutionType | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [resolutionDate, setResolutionDate] = useState(new Date().toISOString().split('T')[0]);
  const [directorNames, setDirectorNames] = useState(['', '', '']);

  const template = selectedTemplate ? RESOLUTION_TEMPLATES.find(t => t.id === selectedTemplate) : null;

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleDirectorChange = (index: number, value: string) => {
    const newDirectors = [...directorNames];
    newDirectors[index] = value;
    setDirectorNames(newDirectors);
  };

  const generatePDF = () => {
    if (!companyName || !selectedTemplate || !template) {
      alert('Please select a template and enter company name');
      return;
    }

    if (directorNames.filter(d => d.trim()).length === 0) {
      alert('Please add at least one director name');
      return;
    }

    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;

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
        doc.text(line, margin, yPosition);
        yPosition += spacing;
      });
    };

    // Header
    addText(`${companyName}`, 16, true, 8);
    addText('BOARD RESOLUTION', 14, true, 8);
    yPosition += 5;

    addText(`Date: ${resolutionDate}`, 11, false, 6);
    yPosition += 8;

    // Resolution Title
    addText(`RESOLVED: ${template.title}`, 12, true, 6);
    yPosition += 5;

    // Whereas clauses
    addText('WHEREAS, the Board of Directors of ' + companyName + ' has reviewed and approved this resolution;', 11, false, 6);
    yPosition += 5;

    // Now Therefore Be It Resolved
    addText('NOW, THEREFORE, BE IT RESOLVED, that:', 12, true, 6);
    yPosition += 5;

    // Details from form
    Object.entries(formData).forEach(([key, value]) => {
      if (value && value !== '') {
        const field = template.fields.find(f => f.name === key);
        if (field) {
          const label = field.label.replace(/\*/g, '');
          addText(`${label}: ${value}`, 11, false, 5);
          yPosition += 2;
        }
      }
    });

    yPosition += 8;

    // Signature section
    addText('APPROVED BY:', 12, true, 6);
    yPosition += 8;

    directorNames.filter(d => d.trim()).forEach((director) => {
      addText(`${director}`, 11, true, 4);
      addText('Signature: _____________________', 11, false, 4);
      addText('Date: _____________________', 11, false, 6);
      yPosition += 5;
    });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      'This resolution was generated using Polaris Arabia Legal Tools. Consult a lawyer before adopting.',
      margin,
      pageHeight - 10
    );

    doc.save(`${companyName.replace(/\s+/g, '_')}_BoardResolution_${selectedTemplate}.pdf`);
  };

  if (!selectedTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Board Resolution Generator</h1>
            <p className="text-lg text-gray-600">Select a resolution type to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RESOLUTION_TEMPLATES.map(tmpl => (
              <Card
                key={tmpl.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedTemplate(tmpl.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{tmpl.title}</CardTitle>
                  <CardDescription>{tmpl.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Select <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          onClick={() => setSelectedTemplate(null)}
          className="mb-6"
        >
          ← Back to Templates
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle>{template?.title}</CardTitle>
            <CardDescription className="text-purple-100">{template?.description}</CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {/* Company & Basic Info */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="company-name" className="text-gray-700 font-semibold">
                    Company Name *
                  </Label>
                  <Input
                    id="company-name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Tech Startup Inc."
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="resolution-date" className="text-gray-700 font-semibold">
                    Resolution Date *
                  </Label>
                  <Input
                    id="resolution-date"
                    type="date"
                    value={resolutionDate}
                    onChange={(e) => setResolutionDate(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Template-Specific Fields */}
            <div className="mb-8 border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Resolution Details</h2>

              <div className="space-y-6">
                {template?.fields.map(field => (
                  <div key={field.name}>
                    <Label htmlFor={field.name} className="text-gray-700 font-semibold">
                      {field.label}
                    </Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.name}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="mt-2 min-h-24"
                      />
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="mt-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Directors */}
            <div className="mb-8 border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Board Members</h2>

              <div className="space-y-4">
                {directorNames.map((director, index) => (
                  <div key={index}>
                    <Label className="text-gray-700 font-semibold">
                      Director {index + 1} {index === 0 && '*'}
                    </Label>
                    <Input
                      value={director}
                      onChange={(e) => handleDirectorChange(index, e.target.value)}
                      placeholder="Director name"
                      className="mt-2"
                    />
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
                Download PDF Resolution
              </Button>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>⚠️ Important:</strong> This tool generates a template resolution. Before adopting, have a qualified lawyer review and advise on this resolution. This is not legal advice.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
