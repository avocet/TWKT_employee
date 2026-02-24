import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../utils/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('請輸入用戶名和密碼');
      return;
    }
    setLoading(true);
    setError('');
    console.log('Attempting login with:', username);
    try {
      const result = await login(username, password);
      console.log('Login result:', result);
      if (!result.success) {
        setError(result.error || '用戶名或密碼錯誤');
      }
    } catch (err: any) {
      console.error('Login exception:', err);
      setError('登入失敗: ' + (err.message || err.code || '未知錯誤'));
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setResetMessage('請輸入電子郵件');
      return;
    }
    
    if (!resetEmail.includes('@')) {
      setResetMessage('請輸入有效的電子郵件格式');
      return;
    }
    
    setResetLoading(true);
    setResetMessage('');
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage('密碼重設連結已發送到您的電子郵件');
    } catch (err: any) {
      console.error('Reset password error:', err);
      if (err.code === 'auth/user-not-found') {
        setResetMessage('此電子郵件尚未註冊');
      } else if (err.code === 'auth/invalid-email') {
        setResetMessage('無效的電子郵件格式');
      } else if (err.code === 'auth/too-many-requests') {
        setResetMessage('操作太頻繁，請稍後再試');
      } else {
        setResetMessage('發送失敗: ' + (err.message || err.code));
      }
    } finally {
      setResetLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">忘記密碼</h1>
              <p className="text-gray-500 mt-1">請輸入您的電子郵件，我們會寄送密碼重設連結</p>
            </div>

            {resetMessage && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${resetMessage.includes('失敗') || resetMessage.includes('錯誤') || resetMessage.includes('尚未') ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-green-50 border border-green-200 text-green-600'}`}>
                {resetMessage}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">電子郵件</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="請輸入電子郵件"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:bg-gray-400"
              >
                {resetLoading ? '發送中...' : '發送重設連結'}
              </button>

              <button
                type="button"
                onClick={() => { setShowForgotPassword(false); setResetMessage(''); }}
                className="w-full py-2 text-gray-600 hover:text-gray-800"
              >
                返回登入
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">阿克索工作日誌系統</h1>
            <p className="text-gray-500 mt-1">AKSO Work Log System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">用戶名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="請輸入用戶名"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? '登入中...' : '登 入'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline"
              >
                忘記密碼？
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
