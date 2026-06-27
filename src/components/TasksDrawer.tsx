import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, X, Plus, LogOut, BookOpen } from 'lucide-react';
import { initAuth, googleSignIn, getAccessToken, logout } from '../lib/firebase';
import type { User } from 'firebase/auth';

interface Task {
  id: string;
  title: string;
  status: string;
}

export function TasksDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'keep'>('tasks');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [keepError, setKeepError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setToken(token);
        setNeedsAuth(false);
        fetchTasks(token);
        fetchNotes(token);
      },
      () => {
        setNeedsAuth(true);
        setUser(null);
        setToken(null);
        setTasks([]);
        setNotes([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        fetchTasks(result.accessToken);
        fetchNotes(result.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setNeedsAuth(true);
    setUser(null);
    setToken(null);
    setTasks([]);
    setNotes([]);
  };

  const fetchNotes = async (accessToken: string) => {
    setLoadingNotes(true);
    setKeepError(null);
    try {
      const res = await fetch('https://keep.googleapis.com/v1/notes', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('خدمة Google Keep متاحة فقط لحسابات المؤسسات (Google Workspace).');
        }
        throw new Error('Failed to fetch notes');
      }
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err: any) {
      console.error('Failed to fetch keep notes:', err);
      setKeepError(err.message);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchTasks = async (accessToken: string) => {
    setLoadingTasks(true);
    try {
      // First get the default tasklist (usually @default)
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      const defaultList = data.items?.[0];

      if (defaultList) {
        const tasksRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${defaultList.id}/tasks?showCompleted=false`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const tasksData = await tasksRes.json();
        setTasks(tasksData.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !token) return;

    try {
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const defaultList = data.items?.[0];

      if (defaultList) {
        const createRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${defaultList.id}/tasks`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: newTaskTitle }),
        });
        const newTask = await createRes.json();
        setTasks([newTask, ...tasks]);
        setNewTaskTitle('');
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const completeTask = async (taskId: string) => {
    if (!token) return;

    // Optimistic update
    setTasks(tasks.filter(t => t.id !== taskId));

    try {
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const defaultList = data.items?.[0];

      if (defaultList) {
        await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${defaultList.id}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'completed' }),
        });
      }
    } catch (err) {
      console.error('Failed to complete task:', err);
      // If it fails, fetch tasks again to restore the correct state
      fetchTasks(token);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '-100%' }} // slide from right since it's RTL
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#0a1128]/95 backdrop-blur-xl shadow-2xl border-l border-white/10 z-50 flex flex-col"
            dir="rtl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">مهامي وملاحظاتي</h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col">
              {needsAuth ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 bg-[#f39c12]/20 rounded-full flex items-center justify-center text-[#f39c12]">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">سجل الدخول للمتابعة</h3>
                    <p className="text-sm text-gray-400">اربط حساب جوجل للوصول لمهامك وملاحظاتك أثناء المذاكرة.</p>
                    <p className="text-xs text-red-400 mt-2">*ملاحظة: خدمة Google Keep متاحة فقط لحسابات المؤسسات (Google Workspace).</p>
                  </div>
                  
                  <button onClick={handleLogin} disabled={isLoggingIn} className="relative w-full flex items-center justify-center bg-white border border-[#dadce0] rounded text-[#3c4043] font-medium text-sm px-3 py-2 hover:bg-[#f8fafc] active:bg-[#f8fafc] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4285f4] focus:ring-offset-2">
                    <div className="absolute left-3 flex items-center justify-center w-[18px] h-[18px]">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{display: 'block'}}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span style={{fontFamily: 'sans-serif'}}>Sign in with Google</span>
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <span className="text-sm font-bold text-[#f39c12]">خدمات جوجل للمذاكرة</span>
                    <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors">
                      <LogOut className="w-3 h-3" /> تسجيل خروج
                    </button>
                  </div>
                  
                  <div className="flex border-b border-white/10 mb-4 shrink-0">
                    <button 
                      onClick={() => setActiveTab('tasks')}
                      className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-[#f39c12] text-[#f39c12]' : 'border-transparent text-gray-400'}`}
                    >
                      المهام
                    </button>
                    <button 
                      onClick={() => setActiveTab('keep')}
                      className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'keep' ? 'border-[#f39c12] text-[#f39c12]' : 'border-transparent text-gray-400'}`}
                    >
                      الملاحظات
                    </button>
                  </div>

                  {activeTab === 'tasks' ? (
                    <div className="flex-1 flex flex-col min-h-0">
                      <form onSubmit={addTask} className="mb-4 relative shrink-0">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="أضف مهمة جديدة..."
                          className="w-full bg-white/5 border border-white/20 text-white rounded-xl py-3 pr-4 pl-12 focus:outline-none focus:border-[#f39c12] transition-colors text-sm placeholder:text-gray-500"
                        />
                        <button 
                          type="submit" 
                          disabled={!newTaskTitle.trim()}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-[#f39c12] text-white rounded-lg disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </form>

                      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                        {loadingTasks ? (
                          <div className="flex justify-center p-4">
                            <div className="w-6 h-6 border-2 border-[#f39c12] border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : tasks.length === 0 ? (
                          <div className="text-center text-gray-500 py-8 text-sm">
                            لا توجد مهام حالياً.
                          </div>
                        ) : (
                          tasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 group hover:border-[#f39c12]/50 transition-colors">
                              <button 
                                onClick={() => completeTask(task.id)}
                                className="text-gray-500 group-hover:text-[#f39c12] transition-colors shrink-0"
                              >
                                <Circle className="w-5 h-5" />
                              </button>
                              <span className="text-sm text-gray-200">{task.title}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-3 min-h-0 custom-scrollbar pr-1">
                      {loadingNotes ? (
                        <div className="flex justify-center p-4">
                          <div className="w-6 h-6 border-2 border-[#f39c12] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : keepError ? (
                        <div className="text-center text-red-400 py-8 text-sm font-medium">
                          {keepError}
                        </div>
                      ) : notes.length === 0 ? (
                        <div className="text-center text-gray-500 py-8 text-sm">
                          لا توجد ملاحظات حالياً.
                        </div>
                      ) : (
                        notes.map((note) => (
                          <div key={note.name} className="p-3 rounded-xl border border-white/10 bg-white/5 text-sm text-gray-200">
                            {note.title && <div className="font-bold mb-1.5 text-white">{note.title}</div>}
                            {note.body?.text?.text && <div className="whitespace-pre-wrap text-gray-400 text-xs leading-relaxed">{note.body.text.text}</div>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
