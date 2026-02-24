import { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '../utils/firebase';

export default function SetupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('技術部');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const auth = getAuth(app);
      const db = getFirestore(app);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        `${username}@twkt.com`, 
        password
      );

      // Save user data to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        id: userCredential.user.uid,
        username,
        name,
        role,
        department,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        employmentType: '',
        signedContractAt: null,
        contractStartDate: null,
        createdAt: new Date().toISOString()
      });

      setSuccess(`用戶 ${name} (${role === 'admin' ? '管理員' : '員工'}) 已建立！`);
      setUsername('');
      setPassword('');
      setName('');
      
    } catch (err: any) {
      console.error('Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('這個帳號已經被註冊過了');
      } else if (err.code === 'auth/weak-password') {
        setError('密碼太弱，至少需要6個字元');
      } else {
        setError('建立失敗: ' + err.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">建立第一個帳號</h1>
            <p className="text-gray-500 mt-1">請先建立管理員帳號</p>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="請輸入姓名"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">帳號</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="請輸入帳號（不含 @twkt.com）"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼（至少6個字元）"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">部門</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="技術部">技術部</option>
                <option value="設計部">設計部</option>
                <option value="產品部">產品部</option>
                <option value="業務部">業務部</option>
                <option value="管理部">管理部</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">權限</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'employee')}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="employee">員工</option>
                <option value="admin">管理員</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? '建立中...' : '建立帳號'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">
              建立後，請使用此帳號登入系統。<br/>
              登入後可在「員工管理」中新增更多帳號。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
