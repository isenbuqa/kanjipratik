
import React, { useState, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  PenTool, 
  Filter, 
  Shuffle, 
  Flower2,
  Brain
} from 'lucide-react';
import { kanjiData } from './data/kanjiData';
import { AppMode, KanjiItem, WeekFilter } from './types';
import Flashcard from './components/Flashcard';
import DrawingBoard from './components/DrawingBoard';
import TestMode from './components/TestMode';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.FLASHCARD);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [semester, setSemester] = useState<number>(1);
  const [weekFilter, setWeekFilter] = useState<WeekFilter>('Tümü');
  const [shuffledData, setShuffledData] = useState<KanjiItem[]>([...kanjiData]);

  const filteredData = useMemo(() => {
    let base = shuffledData.filter(item => item.semester === semester);
    if (weekFilter !== 'Tümü') {
      base = base.filter(item => item.week === parseInt(weekFilter));
    }
    return base;
  }, [semester, weekFilter, shuffledData]);

  const weekOptions = useMemo(() => {
    const weeks = kanjiData
      .filter(item => item.semester === semester)
      .map(item => item.week);
    return Array.from(new Set(weeks)).sort((a, b) => a - b);
  }, [semester]);

  const currentItem = filteredData[currentIdx % filteredData.length] || filteredData[0];

  const nextItem = useCallback(() => {
    setCurrentIdx((prev) => (prev + 1) % filteredData.length);
  }, [filteredData.length]);

  const prevItem = useCallback(() => {
    setCurrentIdx((prev) => (prev - 1 + filteredData.length) % filteredData.length);
  }, [filteredData.length]);

  const shuffleData = () => {
    const newShuffled = [...shuffledData].sort(() => Math.random() - 0.5);
    setShuffledData(newShuffled);
    setCurrentIdx(0);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWeekFilter(e.target.value as WeekFilter);
    setCurrentIdx(0);
  };

  return (
    <div className="min-h-screen flex flex-col pb-10">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-40 px-4 py-4 sm:px-8 border-b border-rose-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-rose-300 to-rose-400 p-2 rounded-2xl text-white sakura-shadow">
              <Flower2 size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-rose-800 tracking-tight leading-none">
                Kanji Pratik
              </h1>
              <p className="text-[10px] sm:text-xs text-rose-400 font-bold uppercase tracking-widest mt-1">
                Sakura Edition
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className={`flex p-1 bg-rose-50/50 border border-rose-100 rounded-xl ${mode === AppMode.TEST ? 'opacity-30 pointer-events-none' : ''}`}>
              <button 
                onClick={() => { setSemester(1); setWeekFilter('Tümü'); setCurrentIdx(0); }}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${semester === 1 ? 'bg-white text-rose-600 shadow-sm' : 'text-rose-300 hover:text-rose-400'}`}
              >
                1. Dönem
              </button>
              <button 
                onClick={() => { setSemester(2); setWeekFilter('Tümü'); setCurrentIdx(0); }}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${semester === 2 ? 'bg-white text-rose-600 shadow-sm' : 'text-rose-300 hover:text-rose-400'}`}
              >
                2. Dönem
              </button>
            </div>

            <div className={`relative transition-opacity duration-300 ${mode === AppMode.TEST ? 'opacity-30 pointer-events-none' : ''}`}>
              <select 
                value={weekFilter}
                onChange={handleFilterChange}
                className="appearance-none bg-white/60 border border-rose-100 text-rose-800 py-2 pl-4 pr-10 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-rose-200/50 cursor-pointer transition-all hover:bg-white"
              >
                <option value="Tümü">Tümü</option>
                {weekOptions.map(w => (
                  <option key={w} value={w.toString()}>Hafta {w}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-rose-300">
                <Filter size={16} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8 flex flex-col">
        {/* Navigation & Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex p-1.5 bg-rose-50/50 border border-rose-100 rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setMode(AppMode.FLASHCARD)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                mode === AppMode.FLASHCARD 
                  ? 'bg-white text-rose-600 shadow-md scale-[1.02]' 
                  : 'text-rose-300 hover:text-rose-500 hover:bg-white/40'
              }`}
            >
              <Layers size={18} />
              Ezber
            </button>
            <button 
              onClick={() => setMode(AppMode.DRAWING)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                mode === AppMode.DRAWING 
                  ? 'bg-white text-rose-600 shadow-md scale-[1.02]' 
                  : 'text-rose-300 hover:text-rose-500 hover:bg-white/40'
              }`}
            >
              <PenTool size={18} />
              Çizim
            </button>
            <button 
              onClick={() => setMode(AppMode.TEST)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                mode === AppMode.TEST 
                  ? 'bg-white text-rose-600 shadow-md scale-[1.02]' 
                  : 'text-rose-300 hover:text-rose-500 hover:bg-white/40'
              }`}
            >
              <Brain size={18} />
              Test
            </button>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {mode !== AppMode.TEST && (
              <>
                <span className="text-xs font-bold text-rose-400 bg-rose-50 px-4 py-2 rounded-full border border-rose-100">
                  {currentIdx + 1} / {filteredData.length}
                </span>
                <button 
                  onClick={shuffleData}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 hover:text-sky-700 px-5 py-2.5 bg-sky-50 border border-sky-100 rounded-xl hover:bg-sky-100 transition-all active:scale-95 shadow-sm"
                >
                  <Shuffle size={14} />
                  Karıştır
                </button>
              </>
            )}
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[450px]">
          {filteredData.length > 0 || mode === AppMode.TEST ? (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
              {mode === AppMode.FLASHCARD && <Flashcard item={currentItem} />}
              {mode === AppMode.DRAWING && <DrawingBoard item={currentItem} />}
              {mode === AppMode.TEST && <TestMode />}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/40 backdrop-blur rounded-3xl border border-dashed border-rose-200 px-10">
              <Flower2 size={48} className="mx-auto text-rose-200 mb-4" />
              <p className="text-rose-400 font-medium">Bu seçim için henüz kelime eklenmemiş.</p>
            </div>
          )}
        </div>

        {/* Global Controls - Only for non-test modes */}
        {mode !== AppMode.TEST && (
          <div className="fixed bottom-6 left-0 right-0 px-4 pointer-events-none z-50">
            <div className="max-w-md mx-auto flex items-center justify-center gap-6 pointer-events-auto">
              <button 
                onClick={prevItem}
                className="group flex items-center justify-center w-14 h-14 bg-white border border-rose-100 rounded-2xl text-rose-300 shadow-lg hover:text-rose-500 hover:border-rose-200 hover:shadow-rose-100 transition-all active:scale-90"
              >
                <ChevronLeft size={32} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
              
              <button 
                onClick={nextItem}
                className="group flex items-center justify-center w-20 h-20 bg-gradient-to-br from-rose-400 to-rose-500 rounded-3xl text-white shadow-xl hover:shadow-rose-200 hover:scale-105 transition-all active:scale-90"
              >
                <ChevronRight size={44} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 text-center px-4">
        <div className="flex items-center justify-center gap-2 text-rose-200 text-[10px] font-bold uppercase tracking-[0.2em]">
          <span className="w-8 h-px bg-rose-100"></span>
          Kanji Pratik &middot; 2024
          <span className="w-8 h-px bg-rose-100"></span>
        </div>
      </footer>
    </div>
  );
};

export default App;
