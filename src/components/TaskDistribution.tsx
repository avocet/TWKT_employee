import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskFormData, User } from '../types';
import { getTasks, addTask, updateTask } from '../utils/storage';
import { getUsers } from '../hooks/useAuth';

interface TaskListProps {
  userId: string;
  userName: string;
  isAdmin: boolean;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

const statusLabels = {
  pending: '待處理',
  processing: '處理中',
  completed: '已完成',
};

export function TaskDistribution({ userId, userName, isAdmin }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'inProgress' | 'completed'>('inProgress');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [fetchedTasks, fetchedUsers] = await Promise.all([
      getTasks(userId, isAdmin),
      getUsers()
    ]);
    setTasks(fetchedTasks);
    setUsers(fetchedUsers);
    setLoading(false);
  }, [userId, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async (data: TaskFormData) => {
    await addTask(data);
    await loadData();
    setShowForm(false);
  };

  const handleUpdate = async (id: string, data: Partial<Task>) => {
    await updateTask(id, data);
    await loadData();
  };

  const getUserName = (uids: string[]) => uids.map(uid => users.find(u => u.id === uid)?.name || '未知').join('、');

  const filteredTasks = filter === 'all' 
    ? tasks 
    : filter === 'inProgress'
    ? tasks.filter(t => t.status === 'pending' || t.status === 'processing')
    : tasks.filter(t => t.status === filter);

  const sortedTasks = [...filteredTasks].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">載入中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">交辦事項</h2>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="inProgress">進行中</option>
            <option value="completed">已完成</option>
            <option value="all">全部</option>
          </select>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              分派工作
            </button>
          )}
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>暫無交辦事項</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              isAdmin={isAdmin}
              currentUserId={userId}
              currentUserName={userName}
              onUpdate={handleUpdate}
              getUserName={getUserName}
            />
          ))}
        </div>
      )}

      {showForm && (
        <TaskFormModal
          users={users.filter(u => u.role === 'employee')}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  isAdmin: boolean;
  currentUserId: string;
  currentUserName: string;
  onUpdate: (id: string, data: Partial<Task>) => Promise<void>;
  getUserName: (ids: string[]) => string;
}

function TaskCard({ task, isAdmin, currentUserId, currentUserName, onUpdate, getUserName }: TaskCardProps) {
  const [showResponse, setShowResponse] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [completionDate, setCompletionDate] = useState(task.completionDate);

  const responses = task.responses || [];
  const canEdit = isAdmin || task.assignedTo.includes(currentUserId);

  const handleAddResponse = async () => {
    if (!responseText.trim()) return;
    
    const newResponse = {
      id: Date.now().toString(),
      content: responseText,
      by: currentUserId,
      byName: currentUserName,
      createdAt: new Date().toISOString()
    };

    await onUpdate(task.id, { 
      addResponse: newResponse,
      completionDate: task.completionDate || completionDate,
      status: 'processing'
    });
    
    setResponseText('');
    setShowResponse(false);
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
            {statusLabels[task.status]}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.source === 'client' ? 'bg-purple-100 text-purple-700' : task.source === 'vendor' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
            {task.source === 'client' ? '客戶' : task.source === 'vendor' ? '廠商' : task.source}
          </span>
        </div>
        <span className="text-sm text-gray-400">
          {new Date(task.createdAt).toLocaleDateString('zh-TW')}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
      <p className="text-gray-600 text-sm mb-3">{task.description}</p>

      {(task.attachment || task.attachmentFile) && (
        <div className="flex flex-col gap-2 text-sm text-gray-500 mb-3">
          {task.attachmentFile && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <a
                href={task.attachmentFile.url || task.attachmentFile.data}
                download={task.attachmentFile.name}
                className="text-blue-600 hover:underline"
              >
                {task.attachmentFile.name}
              </a>
              <span className="text-xs text-gray-400">
                ({(task.attachmentFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}
          {task.attachment && (
            <div className="text-gray-500">
              說明：{task.attachment}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
        <span>指派給：<span className="font-medium text-gray-700">{getUserName(task.assignedTo)}</span></span>
        {task.completionDate && (
          <span>完成日期：<span className="font-medium text-gray-700">{task.completionDate}</span></span>
        )}
      </div>

      {responses.length > 0 && (
        <div className="space-y-3 mb-3">
          {responses.map((resp, index) => {
            const isOwn = resp.by === currentUserId;
            return (
              <div key={resp.id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  <div className={`px-4 py-2 rounded-2xl ${
                    isOwn 
                      ? 'bg-primary text-white rounded-br-md' 
                      : 'bg-gray-100 text-gray-700 rounded-bl-md'
                  }`}>
                    <p className="text-sm">{resp.content}</p>
                  </div>
                  <p className={`text-xs text-gray-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                    {resp.byName} · {new Date(resp.createdAt).toLocaleString('zh-TW')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canEdit && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          {showResponse ? (
            <div className="space-y-3">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="輸入回覆內容..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              />
              <div className="flex gap-3">
                {isAdmin && (
                  <>
                    <input
                      type="date"
                      value={completionDate}
                      onChange={(e) => setCompletionDate(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    />
                    <select
                      value={task.status}
                      onChange={(e) => onUpdate(task.id, { status: e.target.value as Task['status'] })}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
                    >
                      <option value="pending">待處理</option>
                      <option value="processing">處理中</option>
                      <option value="completed">已完成</option>
                    </select>
                  </>
                )}
                <button
                  onClick={() => setShowResponse(false)}
                  className="px-3 py-1.5 text-gray-700 bg-gray-100 rounded-lg text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleAddResponse}
                  disabled={!responseText.trim()}
                  className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
                >
                  送出
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResponse(true)}
              className="text-sm text-primary hover:underline"
            >
              回覆
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface TaskFormModalProps {
  users: User[];
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
}

function TaskFormModal({ users, onClose, onSubmit }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('client');
  const [customSource, setCustomSource] = useState('');
  const [useCustomSource, setUseCustomSource] = useState(false);
  const [attachment, setAttachment] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<{ name: string; size: number; type: string; data?: string } | null>(null);
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || assignedTo.length === 0) return;
    setSaving(true);
    const finalSource = useCustomSource ? customSource : source;
    await onSubmit({
      title,
      description,
      source: finalSource,
      attachment,
      attachmentFile: attachmentFile || undefined,
      assignedTo,
      responses: [],
      completionDate: '',
      status: 'pending',
    });
    setSaving(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('檔案大小不能超過 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setAttachmentFile(null);
  };

  const toggleUser = (userId: string) => {
    setAssignedTo(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">分派新工作</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">工作標題</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">工作描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">來源</label>
              {useCustomSource ? (
                <input
                  type="text"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  placeholder="自行輸入來源"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              ) : (
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                >
                  <option value="client">客戶</option>
                  <option value="vendor">廠商</option>
                </select>
              )}
              <button
                type="button"
                onClick={() => setUseCustomSource(!useCustomSource)}
                className="text-xs text-primary mt-1 hover:underline"
              >
                {useCustomSource ? '使用選項' : '自行輸入'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">附件</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
              />
              {attachmentFile && (
                <div className="mt-2 flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-sm text-gray-600 truncate">{attachmentFile.name}</span>
                  <button type="button" onClick={removeFile} className="text-red-500 text-sm hover:underline">
                    移除
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">附件說明</label>
            <input
              type="text"
              value={attachment}
              onChange={(e) => setAttachment(e.target.value)}
              placeholder="Email或文件名描述"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">指派給（可複選）</label>
            <div className="grid grid-cols-2 gap-2 border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
              {users.map(u => (
                <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignedTo.includes(u.id)}
                    onChange={() => toggleUser(u.id)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-sm">{u.name} ({u.department})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">
              取消
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
              {saving ? '儲存中...' : '分派'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
