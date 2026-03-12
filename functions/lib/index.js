"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWorkLogReplyNotification = exports.sendTaskResponseNotification = exports.sendTaskNotification = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
admin.initializeApp();
const Gmail_USER = ((_a = functions.config().gmail) === null || _a === void 0 ? void 0 : _a.user) || 'taiwanakso@gmail.com';
const Gmail_PASS = ((_b = functions.config().gmail) === null || _b === void 0 ? void 0 : _b.pass) || '';
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: Gmail_USER,
        pass: Gmail_PASS
    }
});
async function sendEmail(to, subject, html) {
    console.log('Sending email to:', to);
    try {
        const result = await transporter.sendMail({
            from: '"阿克索工作日誌系統" <taiwanakso@gmail.com>',
            to: to,
            subject: subject,
            html: html
        });
        console.log('Email sent:', result.messageId);
        return result;
    }
    catch (error) {
        console.error('Send email error:', error);
        throw error;
    }
}
exports.sendTaskNotification = functions.firestore
    .document('tasks/{taskId}')
    .onCreate(async (snap, context) => {
    const taskData = snap.data();
    console.log('Task created:', taskData);
    if (!taskData) {
        return null;
    }
    const assignedTo = taskData.assignedTo || [];
    if (assignedTo.length === 0) {
        console.log('No assigned users');
        return null;
    }
    try {
        for (const userId of assignedTo) {
            try {
                const userDoc = await admin.firestore().collection('users').doc(userId).get();
                const userData = userDoc.data();
                if (userData === null || userData === void 0 ? void 0 : userData.email) {
                    console.log('Sending email to:', userData.email);
                    await sendEmail(userData.email, `【新交辦事項】${taskData.title || '任務通知'}`, `
              <div style="font-family: 'Microsoft JhengHei', Arial, sans-serif; padding: 20px;">
                <h2 style="color: #1a73e8;">您好，您有新交辦事項</h2>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="margin: 0 0 10px 0;">${taskData.title || '無標題'}</h3>
                  <p><strong>內容：</strong>${taskData.description || '無說明'}</p>
                  <p><strong>來源：</strong>${taskData.source || '未指定'}</p>
                  <p><strong>建立時間：</strong>${new Date(taskData.createdAt).toLocaleString('zh-TW')}</p>
                </div>
                <p style="color: #666; font-size: 12px;">
                  請登入<a href="https://avocet.github.io/TWKT_employee/">阿克索工作日誌系統</a>查看詳情
                </p>
              </div>
              `);
                    console.log('Email sent to:', userData.email);
                }
            }
            catch (userError) {
                console.error('Error sending to user:', userId, userError);
            }
        }
    }
    catch (error) {
        console.error('Error in function:', error);
    }
    return null;
});
exports.sendTaskResponseNotification = functions.firestore
    .document('tasks/{taskId}')
    .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!beforeData || !afterData) {
        return null;
    }
    const beforeResponses = beforeData.responses || [];
    const afterResponses = afterData.responses || [];
    if (afterResponses.length === beforeResponses.length) {
        return null;
    }
    const newResponses = afterResponses.slice(beforeResponses.length);
    const latestResponse = newResponses[newResponses.length - 1];
    console.log('Task response updated:', afterData.title, 'by:', latestResponse === null || latestResponse === void 0 ? void 0 : latestResponse.byName);
    const assignedTo = afterData.assignedTo || [];
    const recipientIds = new Set();
    try {
        const adminsSnapshot = await admin.firestore()
            .collection('users')
            .where('role', '==', 'admin')
            .get();
        for (const adminDoc of adminsSnapshot.docs) {
            recipientIds.add(adminDoc.id);
        }
        for (const userId of assignedTo) {
            recipientIds.add(userId);
        }
        const emailPromises = [];
        for (const userId of recipientIds) {
            const userDoc = await admin.firestore().collection('users').doc(userId).get();
            const userData = userDoc.data();
            if (userData === null || userData === void 0 ? void 0 : userData.email) {
                console.log('Sending response notification to:', userData.email);
                emailPromises.push(sendEmail(userData.email, `【任務回覆】${afterData.title || '任務通知'}`, `
              <div style="font-family: 'Microsoft JhengHei', Arial, sans-serif; padding: 20px;">
                <h2 style="color: #1a73e8;">任務有新回覆</h2>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
                  <h3 style="margin: 0 0 10px 0;">${afterData.title || '無標題'}</h3>
                  <p><strong>回覆人：</strong>${(latestResponse === null || latestResponse === void 0 ? void 0 : latestResponse.byName) || '未知'}</p>
                  <p><strong>回覆內容：</strong>${(latestResponse === null || latestResponse === void 0 ? void 0 : latestResponse.content) || '無'}</p>
                  <p><strong>完成日期：</strong>${afterData.completionDate || '未指定'}</p>
                  <p><strong>狀態：</strong>${afterData.status === 'completed' ? '已完成' : afterData.status === 'processing' ? '處理中' : '待處理'}</p>
                  <p><strong>回覆時間：</strong>${(latestResponse === null || latestResponse === void 0 ? void 0 : latestResponse.createdAt) ? new Date(latestResponse.createdAt).toLocaleString('zh-TW') : new Date().toLocaleString('zh-TW')}</p>
                </div>
                <p style="color: #666; font-size: 12px;">
                  請登入<a href="https://avocet.github.io/TWKT_employee/">阿克索工作日誌系統</a>查看詳情
                </p>
              </div>
              `));
            }
        }
        await Promise.all(emailPromises);
    }
    catch (error) {
        console.error('Error sending response notification:', error);
    }
    return null;
});
exports.sendWorkLogReplyNotification = functions.firestore
    .document('workLogs/{workLogId}')
    .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!beforeData || !afterData) {
        return null;
    }
    const beforeItems = beforeData.workItems || [];
    const afterItems = afterData.workItems || [];
    const newReplies = [];
    // Compare by item ID instead of index
    for (const afterItem of afterItems) {
        const beforeItem = beforeItems.find((item) => item.id === afterItem.id);
        const beforeReplies = (beforeItem === null || beforeItem === void 0 ? void 0 : beforeItem.replies) || [];
        const afterReplies = afterItem.replies || [];
        if (afterReplies.length > beforeReplies.length) {
            const newReply = afterReplies[afterReplies.length - 1];
            newReplies.push({
                itemContent: afterItem.content,
                reply: newReply,
                isAdminReply: newReply.isAdmin
            });
        }
    }
    if (newReplies.length === 0) {
        return null;
    }
    console.log('New work log replies detected:', newReplies.length);
    try {
        const userDoc = await admin.firestore().collection('users').doc(afterData.userId).get();
        const userData = userDoc.data();
        const userEmail = userData === null || userData === void 0 ? void 0 : userData.email;
        console.log('Work log owner email:', userEmail);
        const adminsSnapshot = await admin.firestore()
            .collection('users')
            .where('role', '==', 'admin')
            .get();
        const adminEmails = adminsSnapshot.docs.map(d => d.data().email).filter(Boolean);
        console.log('Admin emails:', adminEmails);
        const emailsToSend = [];
        for (const reply of newReplies) {
            console.log('Processing reply, isAdminReply:', reply.isAdminReply);
            const subject = reply.isAdminReply
                ? `【工作日誌回覆】${afterData.date}`
                : `【員工回覆】${afterData.date}`;
            const html = `
          <div style="font-family: 'Microsoft JhengHei', Arial, sans-serif; padding: 20px;">
            <h2 style="color: #1a73e8;">${reply.isAdminReply ? '主管回覆' : '員工回覆'}工作日誌</h2>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p><strong>日期：</strong>${afterData.date}</p>
              <p><strong>事項：</strong>${reply.itemContent}</p>
              <p><strong>回覆人：</strong>${reply.reply.byName} (${reply.isAdminReply ? '主管' : '員工'})</p>
              <p><strong>回覆內容：</strong>${reply.reply.content}</p>
              <p><strong>回覆時間：</strong>${new Date(reply.reply.at).toLocaleString('zh-TW')}</p>
            </div>
            <p style="color: #666; font-size: 12px;">
              請登入<a href="https://avocet.github.io/TWKT_employee/">阿克索工作日誌系統</a>查看詳情
            </p>
          </div>
        `;
            // If admin replies, send to work log owner (employee)
            if (userEmail && reply.isAdminReply) {
                emailsToSend.push({ email: userEmail, subject, html });
                console.log('Will send to employee:', userEmail);
            }
            // If employee replies, send to all admins
            if (!reply.isAdminReply) {
                for (const adminEmail of adminEmails) {
                    emailsToSend.push({ email: adminEmail, subject, html });
                    console.log('Will send to admin:', adminEmail);
                }
            }
        }
        for (const emailData of emailsToSend) {
            console.log('Sending work log reply email to:', emailData.email);
            await sendEmail(emailData.email, emailData.subject, emailData.html);
        }
    }
    catch (error) {
        console.error('Error sending work log reply notification:', error);
    }
    return null;
});
//# sourceMappingURL=index.js.map