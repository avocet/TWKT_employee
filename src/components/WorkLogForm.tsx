import { useState, useEffect } from 'react';
import type { WorkLog, WorkLogFormData, WorkItem } from '../types';

interface WorkLogFormProps {
  isOpen?: boolean;
  onClose: () => void;
  onSubmit: (data: WorkLogFormData) => void | Promise<void>;
  editingLog?: WorkLog | null;
  initialData?: WorkLog;
}

export default function WorkLogForm({ onClose, onSubmit, editingLog, initialData }: WorkLogFormProps) {
  const log = editingLog || initialData;
  const [date, setDate] = useState('');
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [newWorkItem, setNewWorkItem] = useState('');
  const [newWorkItemStatus, setNewWorkItemStatus] = useState<'pending' | 'processing' | 'completed'>('pending');
  const [response, setResponse] = useState('');
  const [problems, setProblems] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (log) {
      setDate(log.date);
      setWorkItems(log.workItems || []);
      setResponse(log.response);
      setProblems(log.problems || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setWorkItems([]);
      setResponse('');
      setProblems('');
    }
  }, [log]);

  const addWorkItem = () => {
    if (!newWorkItem.trim()) return;
    const item: WorkItem = {
      id: Date.now().toString(),
      content: newWorkItem,
      status: newWorkItemStatus
    };
    setWorkItems([...workItems, item]);
    setNewWorkItem('');
    setNewWorkItemStatus('pending');
  };

  const removeWorkItem = (id: string) => {
    setWorkItems(workItems.filter(item => item.id !== id));
  };

  const updateWorkItemStatus = (id: string, status: 'pending' | 'processing' | 'completed') => {
    setWorkItems(workItems.map(item => 
      item.id === id ? { ...item, status } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      date,
      workItems,
      response,
      problems
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{log ? '編輯日誌' : '新增日誌'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">工作事項</label>
            <div className="space-y-2 mb-2">
              {workItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <select
                    value={item.status}
                    onChange={(e) => updateWorkItemStatus(item.id, e.target.value as 'pending' | 'processing' | 'completed')}
                    className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:border-primary"
                  >
                    <option value="pending">待處理</option>
                    <option value="processing">處理中</option>
                    <option value="completed">已完成</option>
                  </select>
                  <span className="flex-1 text-sm">{item.content}</span>
                  <button
                    type="button"
                    onClick={() => removeWorkItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newWorkItem}
                onChange={(e) => setNewWorkItem(e.target.value)}
                placeholder="新增工作事項..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
              <select
                value={newWorkItemStatus}
                onChange={(e) => setNewWorkItemStatus(e.target.value as 'pending' | 'processing' | 'completed')}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="pending">待處理</option>
                <option value="processing">處理中</option>
                <option value="completed">已完成</option>
              </select>
              <button
                type="button"
                onClick={addWorkItem}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                新增
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">回覆</label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={2}
              placeholder="對上級或客戶的回覆..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">遇到的問題</label>
            <textarea
              value={problems}
              onChange={(e) => setProblems(e.target.value)}
              rows={2}
              placeholder="描述遇到的問題..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">
              取消
            </button>
            <button type="submit" disabled={saving || workItems.length === 0} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
              {saving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
