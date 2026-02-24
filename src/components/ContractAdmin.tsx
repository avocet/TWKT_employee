import { useState, useEffect, useCallback } from 'react';
import type { Contract, User } from '../types';
import { getContract, saveContract } from '../utils/storage';
import { getUsers } from '../hooks/useAuth';
import html2pdf from 'html2pdf.js';

function generateContractPDF(emp: User, contract: Contract): void {
  const employeeName = emp.name || '__________';
  const empType = emp.employmentType || '__________';
  const startDate = emp.contractStartDate || '__________';
  const signedDate = emp.signedContractAt ? new Date(emp.signedContractAt).toLocaleDateString('zh-TW') : '__________';

  // Strip HTML tags and <style> blocks
  let cleanContent = contract.content
    .replace(/<style>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();

  // Split content into paragraphs and wrap each in <p> tags for better pagination
  const paragraphs = cleanContent.split('\n\n').filter(p => p.trim());
  const contentHtml = paragraphs.map(p => `<p style="margin-bottom: 10px;">${p.replace(/\n/g, '<br>')}</p>`).join('');

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
    margin: [10, 10, 10, 10] as [number, number, number, number],
    filename: `勞動契約_${employeeName}_${signedDate}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, pagebreak: { mode: ['avoid-all', 'csslegacy'] } },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
  };

  html2pdf().set(opt).from(container).save().then(() => {
    document.body.removeChild(container);
  });
}

export default function ContractAdmin() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [contractCollapsed, setContractCollapsed] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [fetchedContract, fetchedUsers] = await Promise.all([
      getContract(),
      getUsers()
    ]);
    setContract(fetchedContract);
    setUsers(fetchedUsers);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!contract) return;
    const updated: Contract = {
      ...contract,
      content,
      version: contract.version + 1,
      updatedAt: new Date().toISOString(),
    };
    await saveContract(updated);
    setContract(updated);
    setIsEditing(false);
    alert('契約已儲存，新版本：v' + updated.version);
  };

  const employees = users.filter(u => u.role === 'employee');

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">載入中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">勞動契約管理</h2>
            <p className="text-sm text-gray-500">版本 {contract?.version} | 最後更新：{contract?.updatedAt?.split('T')[0] || '-'}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setContractCollapsed(!contractCollapsed)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              {contractCollapsed ? '展開契約' : '收合契約'}
            </button>
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => { setContent(contract?.content || ''); setIsEditing(false); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  儲存
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setContent(contract?.content || ''); setIsEditing(true); }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                編輯契約
              </button>
            )}
          </div>
        </div>
        <div className="p-6">
          {!contractCollapsed && (
            <>
              {isEditing ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-64 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-sm"
                />
              ) : (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: contract?.content || '' }}
                />
              )}
            </>
          )}
          {contractCollapsed && (
            <p className="text-gray-500 text-center py-4">契約已收合</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">簽署記錄</h2>
          <p className="text-sm text-gray-500">查看所有員工的契約簽署狀態</p>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">員工姓名</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">部門</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">簽署狀態</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">簽署時間</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">PDF下載</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full bg-gray-200" />
                        <span className="font-medium text-gray-900">{emp.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{emp.department}</td>
                    <td className="py-3 px-4">
                      {emp.signedContractAt ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          已簽署
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          未簽署
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">
                      {emp.signedContractAt 
                        ? new Date(emp.signedContractAt).toLocaleString('zh-TW')
                        : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {emp.signedContractAt && contract ? (
                        emp.contractPdfUrl ? (
                          <a
                            href={emp.contractPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-lg hover:bg-green-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            下載
                          </a>
                        ) : (
                          <button
                            onClick={() => generateContractPDF(emp, contract)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            下載
                          </button>
                        )
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
