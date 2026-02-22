import { useState, useEffect } from 'react';
import type { Contract } from '../types';
import { getContract, saveContract } from '../utils/storage';

interface ContractEditorProps {
  onSuccess?: () => void;
}

export default function ContractEditor({ onSuccess }: ContractEditorProps) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const c = getContract();
    setContract(c);
    setContent(c.content);
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
    alert('合同已保存，新版本：v' + updated.version);
    onSuccess?.();
  };

  if (!contract) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">劳动合同管理</h2>
          <p className="text-sm text-gray-500">版本 {contract.version} | 最后更新：{contract.updatedAt.split('T')[0]}</p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={() => { setContent(contract.content); setIsEditing(false); }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              保存
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            编辑合同
          </button>
        )}
      </div>

      <div className="p-6">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-96 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-sm"
          />
        ) : (
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: contract.content }}
          />
        )}
      </div>
    </div>
  );
}
