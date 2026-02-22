import { useState, useEffect } from 'react';
import type { Contract, User } from '../types';
import { getContract, saveContract } from '../utils/storage';
import { getUsers } from '../hooks/useAuth';

export default function ContractAdmin() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');

  useEffect(() => {
    setContract(getContract());
    setUsers(getUsers());
  }, []);

  const handleSave = () => {
    if (!contract) return;
    const updated: Contract = {
      ...contract,
      content,
      version: contract.version + 1,
      updatedAt: new Date().toISOString(),
    };
    saveContract(updated);
    setContract(updated);
    setIsEditing(false);
    alert('契約已儲存，新版本：v' + updated.version);
  };

  const employees = users.filter(u => u.role === 'employee');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">勞動契約管理</h2>
            <p className="text-sm text-gray-500">版本 {contract?.version} | 最後更新：{contract?.updatedAt.split('T')[0]}</p>
          </div>
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
        <div className="p-6">
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
