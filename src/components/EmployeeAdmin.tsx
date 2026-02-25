import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { getUsers, saveUser } from '../hooks/useAuth';
import { auth, db } from '../utils/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const departments = ['技術部', '設計部', '產品部', '業務部', '管理部', '人力資源部', '財務部'];
const employmentTypes = ['實習生/應屆畢業', '內勤人員', '主管', '業務/外勤'];

export default function EmployeeAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    department: '技術部',
    employmentType: '內勤人員'
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const fetchedUsers = await getUsers();
    setUsers(fetchedUsers.filter(u => u.role === 'employee'));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSubmit = async () => {
    if (!formData.username || !formData.name || !formData.email) {
      alert('請填寫必填欄位');
      return;
    }

    if (!formData.email.includes('@')) {
      alert('請輸入有效的電子郵件格式');
      return;
    }

    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      alert('密碼至少需要 6 個字元');
      return;
    }

    if (editingUser && formData.password && formData.password.length < 6) {
      alert('密碼至少需要 6 個字元');
      return;
    }

    setSubmitting(true);

    try {
      let userId: string;

      console.log('Current auth state:', auth.currentUser?.uid);
      console.log('Creating user with email:', formData.email);

      if (editingUser) {
        const updatedUser: User = {
          ...editingUser,
          username: formData.username,
          password: formData.password,
          email: formData.email,
          name: formData.name,
          department: formData.department,
          employmentType: formData.employmentType
        };
        await saveUser(updatedUser);
        userId = editingUser.id;
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        userId = userCredential.user.uid;
        console.log('Firebase Auth user created:', userId);

        const newUser: User = {
          id: userId,
          username: formData.username,
          password: formData.password,
          email: formData.email,
          name: formData.name,
          role: 'employee',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.username}`,
          department: formData.department,
          employmentType: formData.employmentType
        };
        await saveUser(newUser);
        console.log('Firestore user saved');
        
        // Also save to accounts collection for login lookup (name + uid)
        await setDoc(doc(db, 'accounts', formData.username), {
          name: formData.name,
          uid: userId
        });
        console.log('Account saved to accounts collection');
        
        // Re-login as admin using stored credentials
        const adminEmail = sessionStorage.getItem('adminEmail');
        const adminPassword = sessionStorage.getItem('adminPassword');
        
        if (adminEmail && adminPassword) {
          try {
            await auth.signOut();
            await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
            console.log('Admin re-logged in');
          } catch (reloginError) {
            console.error('Failed to re-login admin:', reloginError);
            // Don't redirect to login, just stay on the page
          } finally {
            sessionStorage.removeItem('adminEmail');
            sessionStorage.removeItem('adminPassword');
          }
        }
      }

      await loadUsers();
      setShowModal(false);
      setEditingUser(null);
      setFormData({ username: '', password: '', email: '', name: '', department: '技術部', employmentType: '內勤人員' });
      alert(editingUser ? '員工資料已更新' : '員工已新增');
    } catch (error: any) {
      console.error('Error creating user:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/email-already-in-use') {
        alert('此電子郵件已被使用');
      } else if (error.code === 'auth/weak-password') {
        alert('密碼強度不足，至少需要 6 個字元');
      } else if (error.code === 'auth/invalid-email') {
        alert('無效的電子郵件格式');
      } else if (error.code === 'auth/operation-not-allowed') {
        alert('電子郵件/密碼登入未啟用，請至 Firebase Console 開啟');
      } else {
        alert('建立帳號失敗：' + (error.message || error.code));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: user.password,
      email: user.email || '',
      name: user.name,
      department: user.department,
      employmentType: user.employmentType || '內勤人員'
    });
    setShowModal(true);
  };

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
            <h2 className="text-lg font-semibold text-gray-900">員工管理</h2>
            <p className="text-sm text-gray-500">管理員工帳號、部門與聘用資訊</p>
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ username: '', password: '', email: '', name: '', department: '技術部', employmentType: '內勤人員' });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            + 新增員工
          </button>
        </div>

        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">員工</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">電子郵件</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">帳號</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">部門</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">聘用類型</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">契約狀態</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full bg-gray-200" />
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{user.email || '-'}</td>
                  <td className="py-3 px-4 text-gray-600">{user.username}</td>
                  <td className="py-3 px-4 text-gray-600">{user.department}</td>
                  <td className="py-3 px-4 text-gray-600">{user.employmentType || '-'}</td>
                  <td className="py-3 px-4">
                    {user.signedContractAt ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">已簽署</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">未簽署</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(user)}
                        className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                      >
                        編輯
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{editingUser ? '編輯員工' : '新增員工'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件 <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">帳號 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  disabled={!!editingUser}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">密碼 <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
              )}
              {editingUser && (
                <p className="text-xs text-gray-500">如需修改密碼，請通知員工透過個人設定頁面修改</p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">部門</label>
                <select
                  value={formData.department}
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                >
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">聘用類型</label>
                <select
                  value={formData.employmentType}
                  onChange={e => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                >
                  {employmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setEditingUser(null); }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400"
              >
                {submitting ? '處理中...' : (editingUser ? '儲存' : '新增')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
