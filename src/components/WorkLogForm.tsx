import { useState, useEffect } from 'react';
import type { WorkLog, WorkLogFormData } from '../types';

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
  const [task, setTask] = useState('');
  const [response, setResponse] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [problems, setProblems] = useState('');
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed'>('pending');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (log) {
      setDate(log.date);
      setTask(log.task);
      setResponse(log.response);
      setCompletionDate(log.completionDate);
      setTimeSpent(log.timeSpent);
      setProblems(log.problems);
      setStatus(log.status);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setTask('');
      setResponse('');
      setCompletionDate('');
      setTimeSpent('');
      setProblems('');
      setStatus('pending');
    }
  }, [log]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      date,
      task,
      response,
      completionDate,
      timeSpent,
      problems,
      status
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              >
                <option value="pending">待處理</option>
                <option value="processing">處理中</option>
                <option value="completed">已完成</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">工作事項</label>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              rows={3}
              placeholder="今日完成的事項..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              required
            />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">完成日期</label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">花費時間</label>
              <input
                type="text"
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                placeholder="如：6小時"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
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
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
              {saving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
