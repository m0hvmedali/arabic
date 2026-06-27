import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, BookOpen, ListTodo, GraduationCap, ScrollText } from 'lucide-react';
import { questionsData } from './data';
import { TasksDrawer } from './components/TasksDrawer';
import LaserTrail from './components/LaserTrail';
import RulesPage from './components/RulesPage';

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'questions' | 'rules'>('questions');

  const handleNext = () => {
    if (currentIndex < questionsData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const question = questionsData[currentIndex];
  const optionLabels = ['أ', 'ب', 'ج', 'د'];

  return (
    <div className="min-h-screen text-white flex flex-col font-sans overflow-hidden select-none relative" dir="rtl">
      <LaserTrail />
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-fixed bg-no-repeat" 
        style={{ backgroundImage: `url('https://api.bassthalk.com/courses_images/R4xGwkJ9OUcme4sXQmBdDZ8UiSlBDsa2XDi1rzS7.jpg')` }}
      />
      {/* Dark overlay to make text readable */}
      <div className="absolute inset-0 z-0 bg-[#0d1527]/80 backdrop-blur-sm" />

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex flex-col h-full flex-1">
        <header className="h-20 px-4 sm:px-6 md:px-12 flex items-center justify-between border-b border-white/10 bg-[#0a1128]/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#f39c12] to-[#e67e22] rounded-xl sm:rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg shadow-[#f39c12]/20">
              ع
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold text-white leading-tight"> لغه عربيه</span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#f39c12] hidden sm:block">اللغة العربية • الثانوية</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
              <button
                onClick={() => setCurrentView('questions')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${currentView === 'questions' ? 'bg-[#f39c12] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">الأسئلة</span>
              </button>
              <button
                onClick={() => setCurrentView('rules')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-colors flex items-center gap-1.5 ${currentView === 'rules' ? 'bg-[#f39c12] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                <ScrollText className="w-4 h-4" />
                <span>ق ث</span>
              </button>
            </div>
            <div className="w-[1px] h-8 bg-white/10 mx-1 sm:mx-2"></div>
            <button 
              onClick={() => setIsTasksOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors shadow-sm"
            >
              <ListTodo className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </header>

        <TasksDrawer isOpen={isTasksOpen} onClose={() => setIsTasksOpen(false)} />

        {currentView === 'rules' ? (
          <RulesPage />
        ) : (
          <>
            <main className="flex-1 p-4 sm:p-6 md:p-10 flex flex-col overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 max-w-7xl mx-auto w-full flex-1"
                >
                  <div className="col-span-1 lg:col-span-7 flex flex-col gap-6">
                    <div className="bg-[#0a1128]/70 backdrop-blur-md rounded-[32px] p-6 md:p-10 shadow-xl shadow-black/20 border border-white/10 flex-1 flex flex-col justify-between">
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-1.5 bg-[#f39c12]/10 text-[#f39c12] rounded-full text-xs font-bold border border-[#f39c12]/20 tracking-widest whitespace-nowrap">
                            {question.number}
                          </span>
                          <div className="h-[1px] flex-1 bg-gradient-to-l from-white/10 to-transparent"></div>
                        </div>
                        <div className="space-y-4">
                          <h2 className="text-2xl md:text-3xl lg:text-4xl leading-[1.6] font-bold text-white">
                            {question.text}
                          </h2>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 md:mt-12">
                        {question.options.map((option, idx) => {
                          const isCorrect = idx === question.correctIndex;
                          const label = optionLabels[idx] || '';
                          const cleanOptionText = option.replace(/^[أبجد]\)\s*/, '');
                          
                          return (
                            <div
                              key={idx}
                              className={`p-5 rounded-2xl flex items-center transition-all ${
                                isCorrect
                                  ? 'border-2 border-[#f39c12] bg-[#f39c12]/10 shadow-md relative overflow-hidden'
                                  : 'border border-white/10 bg-white/5 hover:bg-white/10'
                              }`}
                            >
                              {isCorrect && (
                                <div className="absolute left-0 top-0 h-full w-1.5 bg-[#f39c12]"></div>
                              )}
                              <span
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ml-4 shrink-0 ${
                                  isCorrect
                                    ? 'bg-[#f39c12] text-white'
                                    : 'bg-white/10 border border-white/10 text-white'
                                }`}
                              >
                                {label}
                              </span>
                              <span className={`text-lg text-white ${isCorrect ? 'font-bold' : ''}`}>
                                {cleanOptionText}
                              </span>
                              {isCorrect && (
                                <CheckCircle2 className="mr-auto w-6 h-6 text-[#f39c12] shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 lg:col-span-5">
                    <div className="bg-[#121c3a]/80 backdrop-blur-md rounded-[32px] p-6 md:p-8 h-full shadow-2xl border border-[#f39c12]/30 text-white flex flex-col">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-[#f39c12]/20 rounded-2xl shrink-0 text-[#f39c12]">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-[#f39c12]">تحليل السؤال (شرح المستر)</h3>
                      </div>
                      <div className="space-y-6 md:space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {question.analysis.map((item, idx) => (
                          <div key={idx} className="space-y-2">
                            <h4 className="text-[#f39c12] text-[11px] font-bold uppercase tracking-widest">
                              {item.title}
                            </h4>
                            <p className="text-base md:text-lg leading-relaxed opacity-90 text-gray-200">
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </main>

            <footer className="h-20 px-4 sm:px-6 md:px-12 border-t border-white/10 bg-[#0a1128]/80 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex gap-2 sm:gap-4">
                <button
                  onClick={handleNext}
                  disabled={currentIndex === questionsData.length - 1}
                  className="px-5 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-[#f39c12] to-[#e67e22] text-white rounded-full text-sm sm:text-base font-bold shadow-lg shadow-[#f39c12]/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  السؤال التالي
                </button>
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="px-5 sm:px-8 py-2.5 sm:py-3 border border-white/20 text-white rounded-full text-sm sm:text-base font-bold hover:bg-white/10 disabled:opacity-50 disabled:hover:bg-transparent transition-all"
                >
                  السابق
                </button>
              </div>
              <div className="flex items-center text-gray-400 font-sans text-xs sm:text-sm">
                <span>
                  التقدم:{' '}
                  <span className="text-white font-bold text-sm sm:text-base ml-1">
                    {currentIndex + 1} / {questionsData.length}
                  </span>
                </span>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
