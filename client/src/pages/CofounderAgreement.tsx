import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Plus, Trash2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface Founder {
  id: string;
  name: string;
  address: string;
  equity: number;
  role: string;
  responsibilities: string;
}

export default function CofounderAgreement() {
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

  const generatePDF = () => {
    if (!companyName || founders.some(f => !f.name || f.equity === 0)) {
      alert('Please fill in all required fields');
      return;
    }

    const totalEquity = founders.reduce((sum, f) => sum + f.equity, 0);
    if (Math.abs(totalEquity - 100) > 0.01) {
      alert('Total equity must equal 100%');
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

    // Title
    addText('CO-FOUNDER AGREEMENT', 16, true, 8);
    yPosition += 5;

    // Header info
    addText(`This Co-Founder Agreement is entered into as of ${agreementDate}`, 11, false, 6);
    yPosition += 3;

    founders.forEach((founder, index) => {
      addText(`${founder.name}, residing at ${founder.address} ("Founder ${index + 1}")`, 11, false, 5);
    });

    yPosition += 5;
    addText('Collectively referred to as the "Founders" and the "Company".', 11, false, 6);
    yPosition += 8;

    // Section 1
    addText('1. FORMATION AND PURPOSE', 12, true, 6);
    addText(
      `The Founders agree to form a company for the purpose of ${businessDescription}. The Founders intend to work together as equal partners in building this venture and agree to be bound by the terms and conditions set forth in this Agreement.`,
      11,
      false,
      6
    );
    yPosition += 5;

    // Section 2
    addText('2. EQUITY OWNERSHIP AND VESTING', 12, true, 6);
    addText('2.1 Initial Equity Allocation', 11, true, 5);
    yPosition += 3;

    founders.forEach(founder => {
      addText(`${founder.name}: ${founder.equity}%`, 11, false, 4);
    });

    yPosition += 5;
    addText('2.2 Vesting Schedule', 11, true, 5);
    const cliffYears = (parseInt(cliffMonths) / 12).toFixed(1);
    addText(
      `All equity is subject to a ${vestingYears}-year vesting schedule with a ${cliffMonths}-month cliff. Upon the 1-year anniversary, 25% of equity vests. The remaining 75% vests monthly over the following ${parseInt(vestingYears) - 1} years.`,
      11,
      false,
      6
    );
    yPosition += 5;

    // Section 3
    addText('3. ROLES AND RESPONSIBILITIES', 12, true, 6);
    founders.forEach((founder, index) => {
      addText(`Founder ${index + 1}: ${founder.role}`, 11, true, 4);
      addText(`Responsibilities: ${founder.responsibilities}`, 11, false, 5);
      yPosition += 2;
    });

    yPosition += 5;

    // Section 4
    addText('4. DECISION-MAKING AND GOVERNANCE', 12, true, 6);
    addText(
      'Each Founder has equal voting rights. Major decisions including admission of new equity holders, sale/merger of the Company, hiring C-level executives, and amendments to this Agreement require unanimous written consent.',
      11,
      false,
      6
    );
    yPosition += 5;

    // Section 5
    addText('5. INTELLECTUAL PROPERTY', 12, true, 6);
    addText(
      'All intellectual property created by any Founder in connection with the Company\'s business shall be the exclusive property of the Company.',
      11,
      false,
      6
    );
    yPosition += 5;

    // Section 6
    addText('6. COMPENSATION AND DISTRIBUTIONS', 12, true, 6);
    addText(
      `During the Company\'s early stage, Founders agree to work at a salary of $${salaryPerMonth} per month, with the understanding that salary shall be reviewed annually as the Company\'s financial situation improves.`,
      11,
      false,
      6
    );
    yPosition += 5;

    // Section 7
    addText('7. CONFIDENTIALITY AND NON-COMPETE', 12, true, 6);
    addText(
      `Each Founder agrees to maintain strict confidentiality regarding business information. For ${nonCompeteMonths} months after departure, Founders shall not engage in competing businesses or solicit Company employees.`,
      11,
      false,
      6
    );
    yPosition += 5;

    // Section 8
    addText('8. DISPUTE RESOLUTION', 12, true, 6);
    addText(
      'If Founders cannot reach consensus on a major decision within 14 days, the matter shall be submitted to mediation with a neutral third party. If mediation fails, the matter may be submitted to binding arbitration.',
      11,
      false,
      6
    );
    yPosition += 10;

    // Signatures
    addText('SIGNATURES', 12, true, 6);
    yPosition += 5;

    founders.forEach((founder, index) => {
      addText(`FOUNDER ${index + 1}:`, 11, true, 4);
      addText(`Name: ${founder.name}`, 11, false, 4);
      addText(`Signature: _____________________`, 11, false, 4);
      addText(`Date: _____________________`, 11, false, 6);
      yPosition += 3;
    });

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      'This agreement was generated using Polaris Arabia Legal Tools. Consult a lawyer before signing.',
      margin,
      pageHeight - 10
    );

    doc.save(`${companyName.replace(/\s+/g, '_')}_CofounderAgreement.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Co-Founder Agreement Generator</h1>
          <p className="text-lg text-gray-600">Create a professional co-founder agreement in minutes</p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle>Co-Founder Agreement Details</CardTitle>
            <CardDescription className="text-blue-100">
              Fill in your company and founder information to generate a customized agreement
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            {/* Company Information */}
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
                  <Label htmlFor="agreement-date" className="text-gray-700 font-semibold">
                    Agreement Date *
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

              <div className="mt-6">
                <Label htmlFor="business-description" className="text-gray-700 font-semibold">
                  Business Description *
                </Label>
                <Textarea
                  id="business-description"
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="Describe your company's business purpose..."
                  className="mt-2 min-h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <Label htmlFor="jurisdiction" className="text-gray-700 font-semibold">
                    Jurisdiction
                  </Label>
                  <Select value={jurisdiction} onValueChange={setJurisdiction}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saudi-arabia">Saudi Arabia</SelectItem>
                      <SelectItem value="uae">UAE</SelectItem>
                      <SelectItem value="delaware">Delaware (US)</SelectItem>
                      <SelectItem value="california">California (US)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vesting-years" className="text-gray-700 font-semibold">
                    Vesting Period (Years)
                  </Label>
                  <Select value={vestingYears} onValueChange={setVestingYears}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Years</SelectItem>
                      <SelectItem value="4">4 Years</SelectItem>
                      <SelectItem value="5">5 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cliff-months" className="text-gray-700 font-semibold">
                    Cliff Period (Months)
                  </Label>
                  <Select value={cliffMonths} onValueChange={setCliffMonths}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                      <SelectItem value="24">24 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <Label htmlFor="salary" className="text-gray-700 font-semibold">
                    Monthly Salary (USD)
                  </Label>
                  <Input
                    id="salary"
                    type="number"
                    value={salaryPerMonth}
                    onChange={(e) => setSalaryPerMonth(e.target.value)}
                    placeholder="0"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="non-compete" className="text-gray-700 font-semibold">
                    Non-Compete Period (Months)
                  </Label>
                  <Select value={nonCompeteMonths} onValueChange={setNonCompeteMonths}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                      <SelectItem value="24">24 Months</SelectItem>
                      <SelectItem value="36">36 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Founders Section */}
            <div className="mb-8 border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Founders</h2>

              <div className="space-y-6">
                {founders.map((founder, index) => (
                  <Card key={founder.id} className="bg-gray-50 border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Founder {index + 1}</h3>
                        {founders.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFounder(founder.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-700 font-semibold">Full Name *</Label>
                          <Input
                            value={founder.name}
                            onChange={(e) => updateFounder(founder.id, 'name', e.target.value)}
                            placeholder="Full name"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label className="text-gray-700 font-semibold">Equity % *</Label>
                          <Input
                            type="number"
                            value={founder.equity}
                            onChange={(e) => updateFounder(founder.id, 'equity', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            min="0"
                            max="100"
                            className="mt-2"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label className="text-gray-700 font-semibold">Address</Label>
                          <Input
                            value={founder.address}
                            onChange={(e) => updateFounder(founder.id, 'address', e.target.value)}
                            placeholder="Full address"
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label className="text-gray-700 font-semibold">Role/Title *</Label>
                          <Input
                            value={founder.role}
                            onChange={(e) => updateFounder(founder.id, 'role', e.target.value)}
                            placeholder="e.g., CEO, CTO"
                            className="mt-2"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label className="text-gray-700 font-semibold">Responsibilities</Label>
                          <Textarea
                            value={founder.responsibilities}
                            onChange={(e) => updateFounder(founder.id, 'responsibilities', e.target.value)}
                            placeholder="Key responsibilities..."
                            className="mt-2 min-h-20"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                onClick={addFounder}
                variant="outline"
                className="mt-6 w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Founder
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-8 border-t">
              <Button
                onClick={generatePDF}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Download PDF Agreement
              </Button>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>⚠️ Important:</strong> This tool generates a template agreement. Before signing, have a qualified lawyer in your jurisdiction review and advise on this agreement. This is not legal advice.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
