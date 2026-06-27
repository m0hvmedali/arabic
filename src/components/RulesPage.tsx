import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { rawRulesText } from '../data/rules';
import { BookOpen, Search } from 'lucide-react';

export default function RulesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const parsedData = useMemo(() => {
    const lines = rawRulesText.split('\n');
    let currentSection = '';
    const sections: { title: string; rules: string[] }[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('###')) {
        currentSection = trimmed.replace(/#/g, '').replace(/\*/g, '').trim();
        sections.push({ title: currentSection, rules: [] });
      } else if (trimmed.match(/^\d+\./)) {
        if (sections.length > 0) {
          sections[sections.length - 1].rules.push(trimmed);
        }
      }
    });

    return sections;
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return parsedData;
    
    return parsedData.map(section => ({
      title: section.title,
      rules: section.rules.filter(rule => rule.includes(searchTerm))
    })).filter(section => section.rules.length > 0);
  }, [parsedData, searchTerm]);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-10 overflow-hidden relative z-10">
      <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
        {/* Header & Search */}
        <div className="mb-6 space-y-4 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <BookOpen className="text-[#f39c12]" />
              قواعد ثابتة (ق ث)
            </h2>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="ابحث في القواعد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/20 text-white rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:border-[#f39c12] transition-colors text-sm placeholder:text-gray-400"
              />
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <p className="text-gray-300 text-sm">
            ملخص بـ 332 قاعدة ثابتة للحل السريع في الامتحان
          </p>
        </div>

        {/* Rules List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8 pb-10">
          {filteredData.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
              لا توجد نتائج تطابق بحثك.
            </div>
          ) : (
            filteredData.map((section, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-4"
              >
                <div className="sticky top-0 z-10 bg-[#0a1128]/95 backdrop-blur-md py-3 border-b border-[#f39c12]/30">
                  <h3 className="text-lg md:text-xl font-bold text-[#f39c12]">
                    {section.title}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {section.rules.map((rule, ruleIdx) => {
                    // Extract rule number and bold part
                    const match = rule.match(/^(\d+\.)\s+\*\*(.*?)\*\*(.*)/);
                    if (match) {
                      return (
                        <div key={ruleIdx} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors">
                          <p className="text-white text-base leading-relaxed">
                            <span className="text-[#f39c12] font-bold ml-2">{match[1]} {match[2]}</span>
                            <span className="text-gray-200">{match[3]}</span>
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div key={ruleIdx} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors">
                        <p className="text-gray-200 text-base leading-relaxed">{rule}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
