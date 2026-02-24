import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import type { WorkLog, Task, Contract, Announcement } from '../types';
import { defaultContract } from '../data/mockData';

export async function getWorkLogs(userId?: string, isAdmin?: boolean): Promise<WorkLog[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'workLogs'), orderBy('createdAt', 'desc'))
    );
    let logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WorkLog[];
    
    if (userId && !isAdmin) {
      logs = logs.filter(log => log.userId === userId);
    }
    
    return logs;
  } catch (error) {
    console.error('Error getting work logs:', error);
    return [];
  }
}

export async function addWorkLog(log: any): Promise<WorkLog> {
  const docRef = await addDoc(collection(db, 'workLogs'), {
    ...log,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return { ...log, id: docRef.id } as WorkLog;
}

export async function updateWorkLog(id: string, data: Partial<WorkLog>): Promise<void> {
  await updateDoc(doc(db, 'workLogs', id), {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteWorkLog(id: string): Promise<void> {
  await deleteDoc(doc(db, 'workLogs', id));
}

export async function getTasks(userId?: string, isAdmin?: boolean): Promise<Task[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'tasks'), orderBy('createdAt', 'desc'))
    );
    let tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
    
    if (userId && !isAdmin) {
      tasks = tasks.filter(t => t.assignedTo.includes(userId));
    }
    
    return tasks;
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
}

export async function addTask(task: any): Promise<Task> {
  const cleanTask: Record<string, any> = { ...task };
  Object.keys(cleanTask).forEach(key => {
    if (cleanTask[key] === undefined) {
      delete cleanTask[key];
    }
  });
  
  const docRef = await addDoc(collection(db, 'tasks'), {
    ...cleanTask,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return { ...cleanTask, id: docRef.id } as Task;
}

export async function updateTask(id: string, data: Partial<Task>): Promise<void> {
  const cleanData: Record<string, any> = { ...data };
  Object.keys(cleanData).forEach(key => {
    if (cleanData[key] === undefined) {
      delete cleanData[key];
    }
  });
  
  if (cleanData.addResponse) {
    const taskDoc = await getDoc(doc(db, 'tasks', id));
    const existingTask = taskDoc.data() as Task;
    const responses = existingTask?.responses || [];
    
    await updateDoc(doc(db, 'tasks', id), {
      responses: [...responses, cleanData.addResponse],
      updatedAt: new Date().toISOString()
    });
    return;
  }
  
  await updateDoc(doc(db, 'tasks', id), {
    ...cleanData,
    updatedAt: new Date().toISOString()
  });
}

export async function getContract(): Promise<Contract> {
  try {
    const docRef = doc(db, 'contracts', 'main');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as Contract;
    }
    // Return default contract if none exists
    return defaultContract;
  } catch (error) {
    console.error('Error getting contract:', error);
    return defaultContract;
  }
}

export async function saveContract(contract: Contract): Promise<void> {
  await setDoc(doc(db, 'contracts', 'main'), contract);
}

export async function uploadFile(file: File): Promise<{ name: string; url: string; size: number; type: string }> {
  const storageRef = ref(storage, `attachments/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  
  return {
    name: file.name,
    url: url,
    size: file.size,
    type: file.type
  };
}

export async function deleteFile(url: string): Promise<void> {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

export async function uploadContractPdf(blob: Blob, userId: string, userName: string): Promise<string> {
  const fileName = `contracts/${userId}_${userName}_${Date.now()}.pdf`;
  const storageRef = ref(storage, fileName);
  const snapshot = await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(snapshot.ref);
  return url;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'announcements'), orderBy('createdAt', 'desc'))
    );
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Announcement[];
  } catch (error) {
    console.error('Error getting announcements:', error);
    return [];
  }
}

export async function addAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> {
  const docRef = await addDoc(collection(db, 'announcements'), {
    ...announcement,
    createdAt: new Date().toISOString()
  });
  return { ...announcement, id: docRef.id, createdAt: new Date().toISOString() } as Announcement;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await deleteDoc(doc(db, 'announcements', id));
}
