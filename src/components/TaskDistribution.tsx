import { useState, useEffect } from 'react';
import type { Task, TaskFormData, User } from '../types';
import { getTasks, saveTasks, generateId } from '../utils/storage';
import { getUsers } from '../hooks/useAuth';

interface TaskListProps {
  userId: string;
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

export function TaskDistribution({ userId, isAdmin }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'my'>('all');

  useEffect(() => {
    setTasks(getTasks());
    setUsers(getUsers());
  }, []);

  const handleCreate = (data: TaskFormData) => {
    const newTask: Task = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveTasks(updated);
    setShowForm(false);
  };

  const handleUpdate = (id: string, data: Partial<Task>) => {
    const updated = tasks.map(task =>
      task.id === id
        ? { ...task, ...data, updatedAt: new Date().toISOString() }
        : task
    );
    setTasks(updated);
    saveTasks(updated);
  };

  const getUserName = (uid: string) => users.find(u => u.id === uid)?.name || '未知';

  const filteredTasks = filter === 'my' 
    ? tasks.filter(t => t.assignedTo === userId)
    : tasks;

  const sortedTasks = [...filteredTasks].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">問題分派</h2>
        <div className="flex gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="all">全部</option>
            <option value="my">我的任務</option>
          </select>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              分派問題
            </button>
          )}
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>暫無問題分派</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              isAdmin={isAdmin}
              currentUserId={userId}
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
  onUpdate: (id: string, data: Partial<Task>) => void;
  getUserName: (id: string) => string;
}

function TaskCard({ task, isAdmin, currentUserId, onUpdate, getUserName }: TaskCardProps) {
  const [showResponse, setShowResponse] = useState(false);
  const [response, setResponse] = useState(task.response);
  const [completionDate, setCompletionDate] = useState(task.completionDate);

  const canEdit = isAdmin || task.assignedTo === currentUserId;

  const handleSaveResponse = () => {
    onUpdate(task.id, { response, completionDate, status: response ? 'processing' : task.status });
    setShowResponse(false);
  };

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status]}`}>
            {statusLabels[task.status]}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${task.source === 'client' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
            {task.source === 'client' ? '客戶' : '廠商'}
          </span>
        </div>
        <span className="text-sm text-gray-400">
          {new Date(task.createdAt).toLocaleDateString('zh-TW')}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
      <p className="text-gray-600 text-sm mb-3">{task.description}</p>

      {task.attachment && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          {task.attachment}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
        <span>指派給：<span className="font-medium text-gray-700">{getUserName(task.assignedTo)}</span></span>
        {task.completionDate && (
          <span>完成日期：<span className="font-medium text-gray-700">{task.completionDate}</span></span>
        )}
      </div>

      {task.response && (
        <div className="p-3 bg-gray-50 rounded-lg mb-3">
          <p className="text-xs text-gray-400 mb-1">處理情況</p>
          <p className="text-gray-700 text-sm">{task.response}</p>
        </div>
      )}

      {canEdit && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          {showResponse ? (
            <div className="space-y-3">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="填寫處理情況..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
              />
              <div className="flex gap-3">
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
                <button
                  onClick={handleSaveResponse}
                  className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark"
                >
                  儲存
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResponse(true)}
              className="text-sm text-primary hover:underline"
            >
              填寫處理情況
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
  onSubmit: (data: TaskFormData) => void;
}

function TaskFormModal({ users, onClose, onSubmit }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState<'client' | 'vendor'>('client');
  const [attachment, setAttachment] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !assignedTo) return;
    onSubmit({
      title,
      description,
      source,
      attachment,
      assignedTo,
      response: '',
      completionDate: '',
      status: 'pending',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">分派新問題</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">問題標題</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">問題描述</label>
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
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as typeof source)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="client">客戶</option>
                <option value="vendor">廠商</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">附件說明</label>
              <input
                type="text"
                value={attachment}
                onChange={(e) => setAttachment(e.target.value)}
                placeholder="Email或文件名"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">指派給</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              required
            >
              <option value="">選擇員工</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">
              取消
            </button>
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg">
              分派
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
