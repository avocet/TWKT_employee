import type { User, WorkLog, Contract, Task } from '../types';

export const defaultUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    email: 'admin@twkt.com',
    name: '系統管理員',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    department: '管理部',
  },
  {
    id: '2',
    username: 'wang',
    password: '123456',
    email: 'wang@twkt.com',
    name: '王曉明',
    role: 'employee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang',
    department: '技術部',
  },
  {
    id: '3',
    username: 'li',
    password: '123456',
    email: 'li@twkt.com',
    name: '李曉紅',
    role: 'employee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li',
    department: '設計部',
  },
  {
    id: '4',
    username: 'zhang',
    password: '123456',
    email: 'zhang@twkt.com',
    name: '張三',
    role: 'employee',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang',
    department: '產品部',
  },
];

export const defaultContract: Contract = {
  id: '1',
  title: '阿克索生醫員工聘用契約書',
  version: 1,
  content: `<style>
.contract-title { text-align: center; }
.contract-header { text-align: center; margin-bottom: 20px; }
.highlight { background-color: #fef08a; padding: 2px 6px; border-radius: 3px; font-weight: bold; }
</style>
<h2 class="contract-title">阿克索生醫（股）員工聘用契約書</h2>
<p class="contract-header"><strong>2026年03月 版本</strong></p>

<p>立契約書人：阿克索生醫股份有限公司（以下簡稱甲方）<br/>
受僱人 : （以下簡稱乙方）</p>

<p>雙方同意訂立契約條款如下，以資共同遵守履行：</p>

<h3>第一條：契約期間/聘用類型</h3>
<p>不定期契約：甲方自 年 月 日起，僱用乙方為 ____________</p>

<h3>第二條：工作內容</h3>
<p>乙方應在工作上遵守甲方之規定，並遵守公司規章（如下附件），但甲方不得要求乙方從事不合法工作。工作項目如下，乙方願接受甲方指導監督，從事下列工作：</p>
<ol>
<li>如附件。</li>
<li>其他交辦事項。</li>
</ol>

<h3>第三條：工作時間</h3>
<p>甲方得在徵詢乙方同意之下，依據勞基法工時，調整工作日期和工作時段，並配合公司活動增加工時：</p>
<p><strong>（一）正常工作時間：</strong></p>
<ol>
<li>乙方正常工時每日不超過8小時，每周不超過40小時，上下班須依員工出勤確實刷卡或紀錄，並不得代替他人打卡。</li>
<li>得視甲方業務需要，乙方應配合採輪班制或變形工時以彈性調整每日上下班工作時間。</li>
<li>輪班工作起訖時間經排定後，未經單位主管同意，不得私自調動，若乙方私自調班未經申請，而超過法令工時者，屬個人失職之務。</li>
</ol>
<p><strong>（二）延長工作時間：</strong></p>
<ol>
<li>延長工作時間在二小時以內者，其延長工作時間之工資，按平日每小時工資額加給三分之一。再延長工作時間在二小時以內者，按平日每小時工資額加給三分之二。</li>
<li>延長工作時間後，經乙方同意可將延長工作時間工資轉換補休事宜。</li>
<li>因天災，事變或突發事件，必須延長工作時間，或停止例假、國定假日、特別休假必要照常工作時，工資加倍發給，事後並給予適當之休息或補假休息。</li>
</ol>

<h3>第四條：工資</h3>
<p><strong>（一）</strong> 工資採「按月計酬」，甲方每月給付乙方工資 ：依法定最低工資 (含1000元全勤) 。</p>
<p><strong>（二）</strong>經乙方同意發放工資時間如下，如遇例假或休假時順延：</p>
<ul>
<li>每月一次：於每月8日發放前月之工資。</li>
</ul>
<p><strong>（三）</strong>甲方不得預扣乙方工資作為違約金或賠償費用。</p>
<p><strong>（四）</strong>勞工保險及全民健康保險之投保金額得視每月給予之薪資做適度調整，乙方同意且充分了解，並要求甲方依據相關法令投保。</p>

<h3>第五條：例假、（特別）休假、勞動基準法及相關規定的給假</h3>
<p><strong>（一）例假：</strong>依現行之勞基法，採用週休二日制。</p>
<p><strong>（二）國定假日：</strong>除甲乙雙方同意國定假日與工作日對調外，乙方均應休假。</p>
<p><strong>（三）家庭照顧日、病假：</strong>不扣全勤，可以小時為單位請，須於假單上寫明並提供證明。家庭照顧假需於3日前提出。（優於勞基法）</p>
<p><strong>（四）特別休假：</strong>乙方繼續工作滿一定期間者，每年依下列規定給予特別休假：</p>
<ul>
<li>半年以上未滿一年者三日</li>
<li>一年以上三年未滿者七日</li>
<li>三年以上五年未滿者十日</li>
<li>五年以上十年未滿者十四日</li>
<li>十年以上者，每一年加給一日，加至三十日為止</li>
</ul>
<p><strong>（五）生理假：</strong>不扣全勤，不需提出證明。以病假扣薪。</p>

<h3>第六條：請假</h3>
<p>乙方之請假依勞動基準法、性別工作平等法及勞工請假規則辦理。</p>

<h3>第七條：終止契約</h3>
<p><strong>（一）甲方預告終止契約：</strong></p>
<p>甲方有勞動基準法第11條各款或第20條情形之一者，應依同法第16條、第17條、第84條之2或勞工退休金條例第12條規定辦理。</p>
<p><strong>（二）甲方不經預告終止契約：</strong></p>
<p>乙方有勞動基準法第12條第1項各款情形之一者，甲方得不經預告乙方終止契約，並依同法第18條規定不發資遣費。</p>
<p>勞工有下列情形之一者，雇主得不經預告終止契約：</p>
<ol>
<li>於訂立勞動契約時為虛偽意思表示，使雇主誤信而有受損害之虞者</li>
<li>對於雇主、雇主家屬、雇主代理人或其他共同工作之勞工，實施暴行或有重大侮辱之行為者。</li>
<li>受有期徒刑以上刑之宣告確定，而未諭知緩刑或未准易科罰金者。</li>
<li>違反勞動契約或工作規則，情節重大者。</li>
<li>故意損耗機器、工具、原料、產品，或其他雇主所有之物品，或故意洩漏雇主技術上、營業上之秘密，致雇主受有損害者。</li>
<li>無正當理由繼續曠工三日，或一個月內曠工達六日者。</li>
<li>雇主依前項第一款、第二款及第四款至第六款規定終止契約者，應自知悉其情形之日起，三十日內為之。</li>
<li>互信政策（如違反第9條情事，視為干擾公司業務，公司可立即解職，並不發予遣散費，雙方同意以地區管轄法院進行訴訟）。</li>
<li>使用公司資源處理私人事件，在職者需將公司Email帳號與私人分開。</li>
<li>9.1.上班時間收發私人信件，上網、參與與工作無關之社群網站。</li>
<li>9.2.上班時間操作私人工作</li>
<li>9.3.將私人檔案儲存於公司電腦。</li>
<li>9.4.在公司電腦灌入私人使用軟體</li>
<li>9.5.在公司任職該職位使用之Email帳號密碼，由公司統一管理，離職時交回。</li>
<li>9.6.凡與公司外部單位，處理公司相關事務往返之Email均須 CC副本至企業專用窗口Email：twkontan2@gmail.com。如未發送副本確認，而致衍生相關責任需自行負責。</li>
<li>9.7.在職期間之所有產出均為公司所有，在職離職均不可洩漏企業以外關係人</li>
<li>9.8.勿打探非本身職位之資訊，也不可洩露工作崗位之相關資訊。例如薪資、廠商客戶成本資料。</li>
<li>10. 私接案子於上班時間或利用公司資源處理。</li>
<li>11. 在職期間或離職後，洩漏公司機密或取用客戶資料作為他用。</li>
<li>12. 在職期間販售同業或同樣的產品。</li>
<li>13. 將公司資料轉寄其他非公司業務關係人</li>
<li>14. 推廣非公司業務或服務給公司客戶</li>
<li>15. 任意或刻意毀損公司事物（包括軟體、硬體）。</li>
<li>16. 未經公司同意與客戶接洽非公司相關之業務。</li>
<li>17. 經主管溝通2次以上未能改善。</li>
</ol>

<h3>第八條：退休</h3>
<p><strong>（一）</strong>乙方符合勞動基準法第53條各款規定情形之一者，得自請退休。</p>
<p><strong>（二）</strong>乙方勞動基準法第54條各款規定之一，甲方得強制乙方退休。</p>
<p><strong>（三）</strong>退休金依乙方適用勞動基準法或勞工退休金條例之制度分別辦理。</p>

<h3>第九條：職業災害及普通傷病補助</h3>
<p>甲方應依勞動基準法、勞工保險條例、職業災害勞工保護法及相關法令規定辦理。</p>

<h3>第十條：福利</h3>
<p><strong>（一）</strong>甲方應依法令規定，為乙方辦理勞工保險條例及相關法規，加入勞工保險，全民健康保險。</p>
<p><strong>（二）</strong>乙方在本契約有效期間，享受甲方事業單位內之各項福利設施。</p>
<p><strong>（三）</strong>甲方依公司盈餘及乙方工作績效及工作態度，提供乙方每個月獎金，三節獎金，最低為不發放，最高合計全年合計14個月。其他出國旅遊、餐卷，不定期加薪，依照營運狀況調整。</p>

<h3>第十一條：考核及獎懲</h3>
<p>乙方之考核及獎懲依甲方口頭或書面規則或規章辦理。</p>

<h3>第十二條：服務與紀律</h3>
<p><strong>（一）</strong>乙方應遵守甲方口頭或書面規則或規章，並應謙和、誠實、謹慎、主動、積極從事工作。乙方如因個人情緒或理由，致使客戶不滿，無異議接受甲方解除職務。</p>
<p><strong>（二）</strong>乙方所獲悉甲方關於營業上，技術上之秘密，包括產品相關資訊，往來廠商、客戶及其所有個資資訊，內部營運資訊、價格、相關數字資料，例如營業額，成本金額，不得洩漏於利害關係人（包含自己職務以外同仁），違者甲方得提出告訴，離職亦同。</p>
<p><strong>（三）</strong>乙方於工作上應接受甲方各級主管之指揮監督。</p>
<p><strong>（四）</strong>乙方在工作時間內，離開工作崗位需告知主管和職務代理人，如長時間2小時以上，公出需填寫公出單。</p>
<p><strong>（五）</strong>即使同時上下班，代為打卡是不合法行為，請自行理解。</p>

<h3>第十三條：安全衛生</h3>
<p>甲、乙雙方應遵守勞工安全衛生相關法令規定，本公司為食品業，務須嚴格執行衛生安全守則。</p>

<h3>第十四條：權利義務之其他依據</h3>
<p>甲、乙雙方於勞動契約存續期間之權利義務關係，悉依本契約規定辦理，本契約未規定事項，依團體協約，工作規則、人事規章及相關法令規定辦理。</p>

<h3>第十五條：契約修訂</h3>
<p>本契約經雙方同意，得以書面隨時修訂。</p>

<h3>第十六條：契約之存執</h3>
<p>本契約書經雙方合議簽屬留存於工作單位。</p>

<h3>第十七條：在職期間著作及工作成果</h3>
<p>乙方在擔任甲方職務期間，所產生所有相關著作權屬於甲方，並不得轉售，或以任何型態轉交於其他單位或人員。</p>

<h3>第十八條：職業道德及競業條款</h3>
<p>乙方於任職期間及離職後，應保守因職務所知悉甲方的相關營業秘密，若因洩密而造成甲方損失應全额賠償。</p>

<h3>第十九條：離職職務交接</h3>
<p>乙方應辦於就離職理職務交接，並詳列清單，繳回保管之公物、資料（包含書面與電子檔案）方得離職。若無法依規定離職，應賠償甲方之損失及負擔相關之民事責任。</p>

<h3>第二十條：其他</h3>
<p>本契約未規定之事項，悉依勞工基準法辦理，有關勞工權責部份，悉遵守勞基法規定。</p>

<h3>第二十一條：合約轄地</h3>
<p>若有爭議，雙方同意以高雄地方法院為第一審管轄法院本契約一式二份，由甲方及乙方各執一式為憑（附身分證影本）</p>

<p><strong>甲方：</strong>阿克索生醫股份有限公司<br/>
<strong>乙方：</strong>____________</p>
<p>住址：高雄市苓雅區四維三路6號11樓B1<br/>
電話：07-330-5577</p>`,
  updatedAt: '2026-03-01T00:00:00Z',
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
    assignedTo: ['2'],
    responses: [],
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
    assignedTo: ['3'],
    responses: [],
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
    assignedTo: ['2'],
    responses: [{
      id: 'r1',
      content: '已完成資料備份，正在編寫遷移腳本',
      by: '2',
      byName: '王小明',
      createdAt: '2026-02-22T11:00:00Z'
    }],
    completionDate: '2026-02-28',
    status: 'processing',
    createdAt: '2026-02-20T09:00:00Z',
    updatedAt: '2026-02-22T11:00:00Z',
  },
];

export const availableStatuses = ['pending', 'processing', 'completed'];
