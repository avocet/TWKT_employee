import { useState, useEffect } from 'react';
import type { Contract, User } from '../types';
import { getContract } from '../utils/storage';
import { useAuth } from '../hooks/useAuth';

export default function ContractSigning() {
  const [contract, setContract] = useState<Contract | null>(null);
  const { user, updateUser } = useAuth();
  const [hasSigned, setHasSigned] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    setContract(getContract());
    setHasSigned(!!user?.signedContractAt);
  }, [user]);

  const handleSign = () => {
    if (!user) return;
    const updatedUser: User = {
      ...user,
      signedContractAt: new Date().toISOString(),
    };
    updateUser(updatedUser);
    setHasSigned(true);
  };

  if (!contract) return null;

  if (hasSigned) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">已簽署勞動契約</h3>
          <p className="text-gray-500 mb-4">
            簽署時間：{user?.signedContractAt ? new Date(user.signedContractAt).toLocaleString('zh-TW') : '-'}
          </p>
          <p className="text-sm text-gray-400">
            如有更新，請留意最新通知
          </p>
        </div>
      </div>
    );
  }

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

      <div className="p-6 max-h-96 overflow-y-auto">
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: contract.content }}
        />
      </div>

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
          disabled={!confirmed}
          className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          確認簽署
        </button>
      </div>
    </div>
  );
}
