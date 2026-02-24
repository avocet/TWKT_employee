import { useState, useEffect, useCallback } from 'react';
import type { Contract, User } from '../types';
import { getContract, uploadContractPdf } from '../utils/storage';
import { useAuth } from '../hooks/useAuth';
import html2pdf from 'html2pdf.js';

const employmentTypes = [
  '實習生/應屆畢業',
  '內勤人員',
  '主管',
  '業務/外勤'
];

async function generateAndUploadPdf(emp: User, contract: Contract): Promise<string> {
  const employeeName = emp.name || '__________';
  const empType = emp.employmentType || '__________';
  const startDate = emp.contractStartDate || '__________';
  const signedDate = emp.signedContractAt ? new Date(emp.signedContractAt).toLocaleDateString('zh-TW') : '__________';

  let cleanContent = contract.content
    .replace(/<style>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();

  // Split content into paragraphs and wrap each in <p> tags with page-break-inside: avoid
  const paragraphs = cleanContent.split('\n\n').filter(p => p.trim());
  const contentHtml = paragraphs.map(p => {
    const lines = p.split('\n').filter(l => l.trim());
    return lines.map(line => 
      `<p style="margin: 8px 0; page-break-inside: avoid; orphans: 4; widows: 4;">${line}</p>`
    ).join('');
  }).join('');

  const htmlContent = `
    <div style="font-family: 'Microsoft JhengHei', 'PingFang TC', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.8;">
      <h1 style="text-align: center; font-size: 24px; margin-bottom: 10px;">阿克索生醫（股）員工聘用契約書</h1>
      <p style="text-align: center; color: #666; margin-bottom: 20px;">版本：${contract.version} | 更新日期：${contract.updatedAt.split('T')[0]}</p>
      <hr style="margin: 20px 0;">
      <p><strong>甲方：</strong>阿克索生醫股份有限公司</p>
      <p><strong>乙方：</strong>${employeeName}</p>
      <p><strong>聘用類型：</strong>${empType}</p>
      <p><strong>契約起始日期：</strong>${startDate}</p>
      <hr style="margin: 20px 0;">
      <div style="page-break-inside: avoid;">${contentHtml}</div>
      <hr style="margin: 20px 0;">
      <p><strong>甲方：</strong>阿克索生醫股份有限公司</p>
      <p><strong>乙方：</strong>${employeeName}</p>
      <p><strong>簽署日期：</strong>${signedDate}</p>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  const opt = {
    margin: [15, 15, 15, 15] as [number, number, number, number],
    filename: `勞動契約_${employeeName}_${signedDate}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      pagebreak: { mode: ['avoid-all', 'legacy', 'csslegacy'] }
    },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
  };

  // Generate PDF as blob
  const pdfBlob = await html2pdf().set(opt).from(container).outputPdf('blob');
  document.body.removeChild(container);

  // Upload to Firebase Storage
  const pdfUrl = await uploadContractPdf(pdfBlob, emp.id, employeeName);
  return pdfUrl;
}

export default function ContractSigning() {
  const [contract, setContract] = useState<Contract | null>(null);
  const { user, updateUser } = useAuth();
  const [hasSigned, setHasSigned] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showContract, setShowContract] = useState(true);
  const [employmentType, setEmploymentType] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const fetchedContract = await getContract();
    setContract(fetchedContract);
    setHasSigned(!!user?.signedContractAt);
    setEmploymentType(user?.employmentType || '');
    setContractStartDate(user?.contractStartDate || '');
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSign = async () => {
    if (!user || !employmentType || !contractStartDate || !contract) return;
    
    const signedAt = new Date().toISOString();
    const updatedUser: User = {
      ...user,
      signedContractAt: signedAt,
      employmentType,
      contractStartDate,
    };
    
    try {
      const pdfUrl = await generateAndUploadPdf(updatedUser, contract);
      updatedUser.contractPdfUrl = pdfUrl;
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
    }
    
    await updateUser(updatedUser);
    setHasSigned(true);
  };

  const getContractContent = () => {
    if (!contract) return '';
    let content = contract.content;
    
    if (user?.name) {
      content = content.replace(
        '受僱人 : （以下簡稱乙方）',
        `受僱人 : <span class="highlight">${user.name}</span>（以下簡稱乙方）`
      );
    }
    
    if (user?.name) {
      content = content.replace(
        '<strong>乙方：</strong>____________',
        `<strong>乙方：</strong><span class="highlight">${user.name}</span>`
      );
    }
    
    if (employmentType) {
      content = content.replace(
        '僱用乙方為 ____________',
        `僱用乙方為 <span class="highlight">${employmentType}</span>`
      );
    }
    if (contractStartDate) {
      content = content.replace(
        '甲方自 年 月 日起',
        `甲方自 <span class="highlight">${contractStartDate}</span> 起`
      );
    }
    
    if (hasSigned || confirmed) {
      const today = new Date().toLocaleDateString('zh-TW');
      const target = '中華民國 年 月 日';
      const idx = content.indexOf(target);
      if (idx !== -1) {
        content = content.slice(0, idx) + `<span class="highlight">${today}</span>` + content.slice(idx + target.length);
      }
    }
    return content;
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium text-yellow-800">請閱讀並簽署勞動契約</span>
        </div>
      </div>

      {!hasSigned && (
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="text-red-500">*</span> 契約起始日期：
            </label>
            <input
              type="date"
              value={contractStartDate}
              onChange={(e) => setContractStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="text-red-500">*</span> 請選擇您的聘用類型：
            </label>
            <div className="grid grid-cols-2 gap-2">
              {employmentTypes.map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    employmentType === type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="employmentType"
                    value={type}
                    checked={employmentType === type}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {showContract && (
        <div className="p-6 max-h-96 overflow-y-auto">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: getContractContent() }}
          />
        </div>
      )}

      {hasSigned && (
        <>
          <div className="mx-6 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">
                已於 {new Date(user?.signedContractAt || '').toLocaleString('zh-TW')} 簽署
                {user?.employmentType && `（${user.employmentType}）`}
              </span>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowContract(!showContract)}
              className="text-sm text-primary hover:underline"
            >
              {showContract ? '隱藏契約內容' : '顯示契約內容'}
            </button>
          </div>
        </>
      )}

      {!hasSigned && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <label className="flex items-center gap-3 mb-4">
            <input 
              type="checkbox" 
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 text-primary" 
            />
            <span className="text-sm text-gray-600">我已閱讀並理解上述勞動契約條款</span>
          </label>
          <button
            onClick={handleSign}
            disabled={!confirmed || !employmentType || !contractStartDate}
            className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            確認簽署
          </button>
        </div>
      )}
    </div>
  );
}
