import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../utils/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../utils/firebase';
import type { User } from '../types';

function getDefaultAvatar(): string {
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" x="50" text-anchor="middle" font-size="80">😃</text></svg>`;
}

export default function UserSettings() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
    if (user?.avatar) {
      setAvatarPreview(user.avatar);
    } else {
      setAvatarPreview(getDefaultAvatar());
    }
  }, [user]);

  if (!user) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage('圖片大小不能超過 2MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
        setCropPosition({ x: 0, y: 0 });
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const moveImage = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 5;
    setCropPosition(prev => ({
      x: direction === 'left' ? prev.x - step : direction === 'right' ? prev.x + step : prev.x,
      y: direction === 'up' ? prev.y - step : direction === 'down' ? prev.y + step : prev.y
    }));
  };

  const resetPosition = () => {
    setCropPosition({ x: 0, y: 0 });
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(getDefaultAvatar());
    setShowCropper(false);
    setCropPosition({ x: 0, y: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cropAndUploadAvatar = async (): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const size = 400;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(avatarPreview);
          return;
        }

        ctx.clearRect(0, 0, size, size);
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const outputSize = 400;
        
        const srcX = img.width > img.height 
          ? (img.width - img.height) / 2 
          : 0;
        const srcY = img.width > img.height 
          ? 0 
          : (img.height - img.width) / 2;
        const srcSize = Math.min(img.width, img.height);
        
        const cropSize = srcSize;
        const offsetX = cropPosition.x * 1.5 * (cropSize / 128);
        const offsetY = cropPosition.y * 1.5 * (cropSize / 128);

        ctx.drawImage(img, srcX - offsetX, srcY - offsetY, cropSize, cropSize, 0, 0, outputSize, outputSize);

        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const storageRef = ref(storage, `avatars/${user.id}_${Date.now()}.jpg`);
              await uploadBytes(storageRef, blob);
              const url = await getDownloadURL(storageRef);
              resolve(url);
            } catch (error) {
              console.error('Upload error:', error);
              resolve(avatarPreview);
            }
          } else {
            resolve(avatarPreview);
          }
        }, 'image/jpeg', 0.9);
      };
      img.onerror = () => resolve(avatarPreview);
      img.src = avatarPreview;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!name.trim()) {
      setMessage('姓名不能為空');
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setMessage('請輸入目前密碼');
        return;
      }
      if (newPassword.length < 6) {
        setMessage('新密碼至少需要6個字元');
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage('新密碼與確認密碼不一致');
        return;
      }

      try {
        if (!auth.currentUser || !auth.currentUser.email) {
          setMessage('無法取得使用者資訊');
          return;
        }

        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);
      } catch (error: any) {
        console.error('Password change error:', error);
        if (error.code === 'auth/wrong-password') {
          setMessage('目前密碼錯誤');
          return;
        }
        setMessage('密碼更新失敗：' + (error.message || error.code));
        return;
      }
    }

    setUploading(true);

    let newAvatar = avatarPreview;

    if (avatarFile) {
      try {
        newAvatar = await cropAndUploadAvatar();
      } catch (error) {
        console.error('Avatar processing error:', error);
        setMessage('頭像處理失敗，請重試');
        setUploading(false);
        return;
      }
    }

    const updatedUser: User = {
      ...user,
      name: name.trim(),
      avatar: newAvatar,
    };

    if (newPassword) {
      updatedUser.password = newPassword;
    }

    try {
      const success = await updateUser(updatedUser);
      if (success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setAvatarFile(null);
        setShowCropper(false);
        setMessage('資料已更新');
      } else {
        setMessage('更新失敗，請重試');
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage('更新失敗，請重試');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">個人資料設定</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">帳號</label>
            <input
              type="text"
              value={user.username}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">帳號無法修改</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">頭像</label>
            <div className="flex flex-col items-center gap-4">
              {showCropper && avatarFile ? (
                <div className="relative">
                  <div className="w-48 h-48 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    <div 
                      className="relative overflow-hidden rounded-full bg-gray-200"
                      style={{ width: '192px', height: '192px' }}
                    >
                      <img 
                        src={avatarPreview} 
                        alt="頭像預覽" 
                        className="absolute"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          transform: `translate(${-cropPosition.x * 1.5}px, ${-cropPosition.y * 1.5}px)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img 
                    src={avatarPreview} 
                    alt="頭像預覽" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {!showCropper && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5"
                    >
                      上傳照片
                    </button>
                    {(avatarPreview && !avatarPreview.includes('data:image/svg')) && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-4 py-2 text-sm text-red-500 border border-red-500 rounded-lg hover:bg-red-50"
                      >
                        恢復預設
                      </button>
                    )}
                  </div>
                </>
              )}

              {showCropper && (
                <div className="w-full p-4 bg-gray-50 rounded-lg space-y-3">
                  <p className="text-xs text-gray-500 text-center">使用下方按鈕調整位置</p>
                  
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => moveImage('up')}
                      className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300"
                    >
                      ↑
                    </button>
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => moveImage('left')}
                      className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={resetPosition}
                      className="px-3 h-10 flex items-center justify-center bg-gray-300 rounded-full hover:bg-gray-400 text-sm"
                    >
                      重置
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImage('right')}
                      className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300"
                    >
                      →
                    </button>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => moveImage('down')}
                      className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300"
                    >
                      ↓
                    </button>
                  </div>

                  <div className="flex justify-center gap-2 pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(getDefaultAvatar());
                        setShowCropper(false);
                        setCropPosition({ x: 0, y: 0 });
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="px-4 py-2 text-sm text-red-500 border border-red-500 rounded-lg hover:bg-red-50"
                    >
                      恢復預設
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                      className="px-4 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5"
                    >
                      重新選擇
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">支援 JPG、PNG 格式，最大 2MB</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目前密碼</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="修改密碼時需要輸入"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密碼</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="留空表示不修改密碼"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">確認新密碼</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="留空表示不修改密碼"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          {message && (
            <p className={`text-sm ${message === '資料已更新' ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:bg-gray-400"
          >
            {uploading ? '儲存中...' : '儲存變更'}
          </button>
        </form>
      </div>
    </div>
  );
}
