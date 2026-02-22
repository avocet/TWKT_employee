import type { User, WorkLog, Contract, Task } from '../types';

export const defaultUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: '系統管理員',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    department: '管理部',
  },
  {
    id: '2',
    username: 'wang',
    password: '123456',
    name: '王曉明',
    role: 'employee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
    department: '技術部',
  },
  {
    id: '3',
    username: 'li',
    password: '123456',
    name: '李曉紅',
    role: 'employee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
    department: '設計部',
  },
  {
    id: '4',
    username: 'zhang',
    password: '123456',
    name: '張三',
    role: 'employee',
    avatar: 'https://api.dicebear.com/7.x//svg?seed=zavataaarshang',
    department: '產品部',
  },
];

export const defaultContract: Contract = {
  id: '1',
  title: '員工勞動契約',
  version: 1,
  content: `<h2>員工勞動契約書</h2>
<p><strong>版本: 1.0 | 更新日期: 2026-01-01</strong></p>

<h3>第一章 總則</h3>
<p>第一條 根據《中華人民共和國勞動法》及有關規定，甲乙雙方經平等協商一致，自願簽訂本勞動契約。</p>

<h3>第二章 勞動期限</h3>
<p>第二條 本契約期限類型為固定期限契約，契約期限為一年。</p>

<h3>第三章 工作內容</h3>
<p>第三條 乙方同意根據甲方工作需要，擔任相應崗位工作。</p>
<p>第四條 甲方因生產經營需要，可調整乙方的工作崗位。</p>

<h3>第四章 勞動報酬</h3>
<p>第五條 甲方按月支付乙方工資，具體金額根據崗位確定。</p>
<p>第六條 甲方於每月15日前支付乙方上月薪資。</p>

<h3>第五章 社會保險</h3>
<p>第七條 甲方依法為乙方繳納社會保險費。</p>
<p>第八條 乙方患病或因工負傷的，按國家規定享受相應待遇。</p>

<h3>第六章 勞動紀律</h3>
<p>第九條 乙方應遵守甲方依法制定的各項規章制度。</p>
<p>第十條 乙方應保守甲方的商業秘密。</p>

<h3>第七章 保險局新規定遵守條款</h3>
<p>第十一條 乙方應遵守保險局發布之最新規定，包括但不限於：</p>
<ul>
<li>如實申報個人資料</li>
<li>及時更新聯繫方式</li>
<li>遵守業務操作規範</li>
<li>定期參加培訓</li>
</ul>

<h3>第八章 契約變更</h3>
<p>第十二條 訂立本契約所依據的客觀情況發生重大變更，可變更本契約相關內容。</p>

<h3>第九章 違約責任</h3>
<p>第十三條 任何一方違反本契約約定，應承擔相應法律責任。</p>

<h3>附則</h3>
<p>本契約一式兩份，甲乙雙方各執一份。本契約自雙方簽字蓋章之日起生效。</p>`,
  updatedAt: '2026-01-01T00:00:00Z',
};

export const defaultWorkLogs: WorkLog[] = [
  {
    id: '1',
    userId: '2',
    date: '2026-02-22',
    task: '完成用戶登入模組開發，包括用戶名密碼登入和驗證碼登入',
    response: '已按需求完成開發，程式碼已提交審查',
    supervisorReply: '做得很好，繼續保持！請記得更新技術文件。',
    supervisorReplyAt: '2026-02-22T18:00:00Z',
    completionDate: '2026-02-22',
    timeSpent: '6小時',
    problems: '驗證碼發送介面有超時問題，需要優化',
    status: 'completed',
    createdAt: '2026-02-22T09:00:00Z',
    updatedAt: '2026-02-22T17:00:00Z',
  },
  {
    id: '2',
    userId: '2',
    date: '2026-02-21',
    task: '參加產品需求評審會議',
    response: '確認了第二季度的需求優先順序',
    completionDate: '2026-02-21',
    timeSpent: '2小時',
    problems: '部分需求細節需要進一步確認',
    status: 'completed',
    createdAt: '2026-02-21T09:00:00Z',
    updatedAt: '2026-02-21T11:00:00Z',
  },
  {
    id: '3',
    userId: '3',
    date: '2026-02-22',
    task: '設計新版首頁 UI',
    response: '已完成高保真設計稿',
    completionDate: '2026-02-25',
    timeSpent: '5小時',
    problems: '行動端適配需要更多時間',
    status: 'processing',
    createdAt: '2026-02-22T10:00:00Z',
    updatedAt: '2026-02-22T15:00:00Z',
  },
];

export const defaultTasks: Task[] = [
  {
    id: '1',
    title: '客戶投訴：訂單無法提交',
    description: '客戶反映在提交訂單時出現系統錯誤，無法完成購買。客戶非常著急，希望盡快處理。',
    source: 'client',
    attachment: 'Email: customer@company.com',
    assignedTo: '2',
    response: '',
    completionDate: '',
    status: 'pending',
    createdAt: '2026-02-22T10:00:00Z',
    updatedAt: '2026-02-22T10:00:00Z',
  },
  {
    id: '2',
    title: '廠商供貨延遲通知',
    description: '原材料供應商通知由於物流問題，供貨將延遲一週。需要調整生產計劃。',
    source: 'vendor',
    attachment: '文件：supply_delaynotice.pdf',
    assignedTo: '3',
    response: '',
    completionDate: '',
    status: 'pending',
    createdAt: '2026-02-21T14:00:00Z',
    updatedAt: '2026-02-21T14:00:00Z',
  },
  {
    id: '3',
    title: '客戶資料遷移需求',
    description: '企業客戶要求將歷史資料遷移到新系統，需要技術團隊支援。',
    source: 'client',
    attachment: 'Email: enterprise@bigcorp.com',
    assignedTo: '2',
    response: '已完成資料備份，正在編寫遷移腳本',
    completionDate: '2026-02-28',
    status: 'processing',
    createdAt: '2026-02-20T09:00:00Z',
    updatedAt: '2026-02-22T11:00:00Z',
  },
];

export const availableStatuses = ['pending', 'processing', 'completed'];
