import { useState, useEffect, useCallback } from 'react';
import type { Contract } from '../types';
import { getContract, saveContract } from '../utils/storage';

export default function ContractEditor() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const fetchedContract = await getContract();
    setContract(fetchedContract);
    setContent(fetchedContract?.content || '');
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
    alert('契約已儲存，新版本：v' + updated.version);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">載入中...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">編輯勞動契約</h2>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          儲存
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-96 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-mono text-sm"
      />
    </div>
  );
}
