import { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import type { User } from '../types';

interface EvaluationItemData {
  score: number;
  note: string;
}

interface MonthEvaluation {
  item1: EvaluationItemData;
  item2: EvaluationItemData;
  item3: EvaluationItemData;
  item4: EvaluationItemData;
  totalScore: number;
  createdAt: string;
  updatedAt: string;
}

type EvaluationData = Record<string, MonthEvaluation>;

interface EmployeeEvaluationProps {
  users: User[];
}

export default function EmployeeEvaluation({ users }: EmployeeEvaluationProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [evaluationData, setEvaluationData] = useState<EvaluationData>({});
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const employees = users.filter(u => u.role === 'employee');

  const evaluationItems = [
    { key: 'item1', label: '工作日誌', description: '每個工作日有更新進度，主管口頭交辦事項有寫入工作日誌並主動每日跟進與更新。' },
    { key: 'item2', label: '即時回覆', description: '客戶、廠商、同仁之間Line工作群組有即時回覆與處理。' },
    { key: 'item3', label: '主動性', description: '工作主動性與積極性、正確率。' },
    { key: 'item4', label: '完成度', description: '客戶訂單出貨、物料到場、各職位應交表格有標註於行事曆，並按預定時間完成和出貨。' },
  ];

  const getMonthOptions = () => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      months.push({ value, label });
    }
    return months;
  };

  const loadEvaluation = async (userId: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, 'evaluations', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setEvaluationData(docSnap.data() as EvaluationData);
      } else {
        setEvaluationData({});
      }
    } catch (error) {
      console.error('Error loading evaluation:', error);
    }
    setLoading(false);
  };

  const handleSelectEmployee = (employee: User) => {
    setSelectedEmployee(employee);
    loadEvaluation(employee.id);
    setSelectedMonth('');
  };

  const handleSelectMonth = (month: string) => {
    setSelectedMonth(month);
  };

  const handleScoreChange = (itemKey: string, score: number) => {
    if (!selectedMonth) return;
    
    setEvaluationData(prev => {
      const updated = { ...prev };
      if (!updated[selectedMonth]) {
        updated[selectedMonth] = {
          item1: { score: 0, note: '' },
          item2: { score: 0, note: '' },
          item3: { score: 0, note: '' },
          item4: { score: 0, note: '' },
          totalScore: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      
      const itemData = updated[selectedMonth] as any;
      itemData[itemKey] = { ...itemData[itemKey], score };
      
      const items = ['item1', 'item2', 'item3', 'item4'];
      let total = 0;
      for (const key of items) {
        total += (itemData[key]?.score || 0);
      }
      itemData.totalScore = total;
      itemData.updatedAt = new Date().toISOString();
      
      return updated;
    });
  };

  const handleNoteChange = (itemKey: string, note: string) => {
    if (!selectedMonth) return;
    
    setEvaluationData(prev => {
      const updated = { ...prev };
      if (!updated[selectedMonth]) {
        updated[selectedMonth] = {
          item1: { score: 0, note: '' },
          item2: { score: 0, note: '' },
          item3: { score: 0, note: '' },
          item4: { score: 0, note: '' },
          totalScore: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      
      const itemData = updated[selectedMonth] as any;
      itemData[itemKey] = { ...itemData[itemKey], note };
      itemData.updatedAt = new Date().toISOString();
      
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedEmployee || !selectedMonth) return;
    
    setSaving(true);
    try {
      const docRef = doc(db, 'evaluations', selectedEmployee.id);
      await setDoc(docRef, evaluationData, { merge: true });
      alert('儲存成功');
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('儲存失敗');
    }
    setSaving(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    if (score >= 1) return 'text-red-600';
    return 'text-gray-400';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 16) return 'bg-green-500';
    if (score >= 12) return 'bg-green-400';
    if (score >= 8) return 'bg-yellow-400';
    if (score >= 4) return 'bg-orange-400';
    return 'bg-red-400';
  };

  if (selectedEmployee) {
    const currentMonthData = evaluationData[selectedMonth];
    const currentTotalScore = currentMonthData?.totalScore || 0;
    
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedEmployee(null)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-900">{selectedEmployee.name} - 員工評核</h2>
          </div>
          <button
            onClick={handleSave}
            disabled={!selectedMonth || saving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? '儲存中...' : '儲存'}
          </button>
        </div>

        {(() => {
          const monthsWithScores = Object.keys(evaluationData)
            .filter(month => evaluationData[month]?.totalScore > 0)
            .sort((a, b) => b.localeCompare(a))
            .slice(0, 6);

          if (monthsWithScores.length === 0) return null;

          return (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">每月評核分數</h4>
              <div className="flex items-end justify-between gap-3 h-32">
                {monthsWithScores.map(month => {
                  const score = evaluationData[month]?.totalScore || 0;
                  const percentage = (score / 20) * 100;
                  const monthLabel = month.slice(5) + '月';

                  return (
                    <div key={month} className="w-14 flex flex-col items-center">
                      <div className="relative w-full flex flex-col items-center justify-end h-24">
                        <div
                          className={`w-full rounded-t-md ${getScoreBarColor(score)} transition-all`}
                          style={{ height: `${percentage}%`, minHeight: score > 0 ? '4px' : '0' }}
                        />
                        <span className="absolute top-0 text-xs font-medium text-gray-700">{score}</span>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">{monthLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">評核月份</label>
          <select
            value={selectedMonth}
            onChange={(e) => handleSelectMonth(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
          >
            <option value="">請選擇月份</option>
            {getMonthOptions().map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {selectedMonth && currentMonthData && currentTotalScore > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-800 font-medium">總分</span>
              <span className={`text-2xl font-bold ${getScoreColor(currentTotalScore)}`}>
                {currentTotalScore} / 20
              </span>
            </div>
          </div>
        )}

        {selectedMonth && (
          <div className="space-y-4">
            {evaluationItems.map(item => {
              const itemData = currentMonthData?.[item.key as keyof MonthEvaluation] as EvaluationItemData | undefined;
              const currentScore = itemData?.score || 0;
              const currentNote = itemData?.note || '';
              
              return (
                <div key={item.key} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-900">{item.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-sm text-gray-600">分數：</span>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(score => (
                        <button
                          key={score}
                          onClick={() => handleScoreChange(item.key, score)}
                          className={`w-10 h-10 rounded-full font-medium ${
                            currentScore >= score
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    <span className={`text-lg font-medium ${getScoreColor(currentScore)}`}>
                      {currentScore}分
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">備註</label>
                    <textarea
                      value={currentNote}
                      onChange={(e) => handleNoteChange(item.key, e.target.value)}
                      placeholder="選填備註..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">員工評核</h2>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <p>載入中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {employees.map(employee => (
            <button
              key={employee.id}
              onClick={() => handleSelectEmployee(employee)}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-primary hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600">
                    {employee.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{employee.name}</p>
                  <p className="text-sm text-gray-500">{employee.department || '未設定部門'}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}