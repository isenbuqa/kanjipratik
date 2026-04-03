
import React, { useState, useEffect } from 'react';
import { KanjiItem } from '../types';
import { CheckCircle2, XCircle, Trophy, RefreshCw, ArrowRight, Brain, BookOpen, AlertCircle, Type as TypeIcon, Languages, Settings } from 'lucide-react';
import { kanjiData } from '../data/kanjiData';

interface Mistake {
  kanji: string;
  correct: string;
  userChoice: string;
  meaning: string;
  questionType: 'kanji-to-reading' | 'reading-to-kanji';
}

interface Question {
  item: KanjiItem;
  type: 'kanji-to-reading' | 'reading-to-kanji';
  options: string[];
}

type TestStep = 'SEMESTER_SELECTION' | 'WEEK_SELECTION' | 'TYPE_SELECTION' | 'TESTING' | 'RESULTS';

const TestMode: React.FC = () => {
  const [step, setStep] = useState<TestStep>('SEMESTER_SELECTION');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number | 'Tümü'>('Tümü');
  const [testType, setTestType] = useState<'kanji-to-reading' | 'reading-to-kanji'>('kanji-to-reading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);

  const currentQuestion = questions[currentIdx];

  /**
   * Akıllı Çeldirici (Distractor) Algoritması
   * Doğru cevaba en yakın şıkları bulur.
   */
  const generateOptions = (item: KanjiItem, type: 'kanji-to-reading' | 'reading-to-kanji') => {
    const isKtoR = type === 'kanji-to-reading';
    const correctAnswer = isKtoR ? item.reading : item.kanji;
    
    // Kendisi hariç tüm adaylar (Aynı dönemden olanları tercih et)
    const candidates = kanjiData.filter(d => 
      (isKtoR ? d.reading !== item.reading : d.kanji !== item.kanji) && d.semester === item.semester
    );

    const scoredCandidates = candidates.map(c => {
      let score = 0;
      const cVal = isKtoR ? c.reading : c.kanji;
      const cKanji = c.kanji;
      const targetKanji = item.kanji;

      // 1. Ortak Karakter Paylaşımı (En Güçlü Çeldirici)
      // Örn: 放送 (housou) vs 開放 (kaihou) - İkisinde de '放' var.
      const sharedChars = [...cKanji].filter(char => targetKanji.includes(char));
      if (sharedChars.length > 0) {
        score += 60; 
      }

      // 2. Hafta Yakınlığı
      // Aynı haftadaki kelimeler genelde benzer temadadır.
      if (c.week === item.week) {
        score += 40;
      } else if (Math.abs(c.week - item.week) === 1) {
        score += 15;
      }

      // 3. Fonetik Benzerlik (Okunuş için)
      if (isKtoR) {
        // Başlangıç sesi aynılığı
        if (cVal[0] === correctAnswer[0]) score += 30;
        // Bitiş sesi aynılığı (kafiyeli okunuşlar)
        if (cVal.slice(-1) === correctAnswer.slice(-1)) score += 20;
        // Benzer uzunluk
        if (Math.abs(cVal.length - correctAnswer.length) <= 1) score += 15;
      } else {
        // Kanji görsel benzerlik (Karakter sayısı aynılığı)
        if (cVal.length === correctAnswer.length) score += 25;
      }

      // 4. Rastgelelik (Çeşitlilik için küçük bir pay)
      score += Math.random() * 20;

      return { value: cVal, score };
    });

    // En benzer 8 adayı al ve içlerinden rastgele 3 tanesini seç
    const finalDistractors = scoredCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(c => c.value);
    
    return [...finalDistractors, correctAnswer].sort(() => Math.random() - 0.5);
  };

  const handleWeekSelect = (week: number | 'Tümü') => {
    setSelectedWeek(week);
    setStep('TYPE_SELECTION');
  };

  const startTest = (type: 'kanji-to-reading' | 'reading-to-kanji') => {
    setTestType(type);
    let baseData = kanjiData.filter(item => item.semester === selectedSemester);
    if (selectedWeek !== 'Tümü') {
      baseData = baseData.filter(item => item.week === selectedWeek);
    }
    
    const newQuestions: Question[] = baseData
      .sort(() => Math.random() - 0.5)
      .map(item => ({
        item,
        type,
        options: generateOptions(item, type)
      }));

    setQuestions(newQuestions);
    setStep('TESTING');
    setCurrentIdx(0);
    setScore(0);
    setMistakes([]);
    setSelectedIdx(null);
    setIsAnswered(false);
  };

  const handleOptionClick = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    setIsAnswered(true);
    
    const isKtoR = currentQuestion.type === 'kanji-to-reading';
    const correctAnswer = isKtoR ? currentQuestion.item.reading : currentQuestion.item.kanji;
    
    if (currentQuestion.options[idx] === correctAnswer) {
      setScore(prev => prev + 1);
    } else {
      setMistakes(prev => [...prev, {
        kanji: currentQuestion.item.kanji,
        correct: correctAnswer,
        userChoice: currentQuestion.options[idx],
        meaning: currentQuestion.item.meaning,
        questionType: currentQuestion.type
      }]);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
    } else {
      setStep('RESULTS');
    }
  };

  const resetToMenu = () => {
    setStep('SEMESTER_SELECTION');
    setSelectedSemester(1);
    setSelectedWeek('Tümü');
  };

  if (step === 'SEMESTER_SELECTION') {
    const getWeekRange = (sem: number) => {
      const weeks = kanjiData
        .filter(item => item.semester === sem)
        .map(item => item.week);
      if (weeks.length === 0) return 'Henüz veri yok';
      const min = Math.min(...weeks);
      const max = Math.max(...weeks);
      return min === max ? `Hafta ${min}` : `Hafta ${min} - ${max}`;
    };

    return (
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-500 border border-rose-50">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-rose-50 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <Brain size={40} className="text-rose-400" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Sakura Quiz</h2>
          <p className="text-slate-400 text-center max-w-sm">Test etmek istediğin dönemi seç!</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => { setSelectedSemester(1); setStep('WEEK_SELECTION'); }}
            className="group p-8 bg-white border-2 border-slate-100 rounded-[2rem] text-center hover:border-rose-300 hover:bg-rose-50/50 transition-all active:scale-95"
          >
            <p className="text-2xl font-bold text-slate-700">1. Dönem</p>
            <p className="text-sm text-slate-400 mt-2">{getWeekRange(1)}</p>
          </button>
          <button
            onClick={() => { setSelectedSemester(2); setStep('WEEK_SELECTION'); }}
            className="group p-8 bg-white border-2 border-slate-100 rounded-[2rem] text-center hover:border-rose-300 hover:bg-rose-50/50 transition-all active:scale-95"
          >
            <p className="text-2xl font-bold text-slate-700">2. Dönem</p>
            <p className="text-sm text-slate-400 mt-2">{getWeekRange(2)}</p>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'WEEK_SELECTION') {
    const weeks = Array.from(new Set(
      kanjiData
        .filter(item => item.semester === selectedSemester)
        .map(item => item.week)
    )).sort((a, b) => a - b);
    return (
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-500 border border-rose-50">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-rose-50 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <Brain size={40} className="text-rose-400" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">{selectedSemester}. Dönem Quiz</h2>
          <p className="text-slate-400 text-center max-w-sm">Test etmek istediğin haftayı seçerek başla!</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {weeks.map(week => (
            <button
              key={week}
              onClick={() => handleWeekSelect(week)}
              className="group p-4 bg-white border-2 border-slate-100 rounded-3xl text-left hover:border-rose-300 hover:bg-rose-50/50 transition-all active:scale-95"
            >
              <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest mb-1">Hafta</p>
              <p className="text-xl font-bold text-slate-700">{week}</p>
            </button>
          ))}
          <button
            onClick={() => handleWeekSelect('Tümü')}
            className="col-span-2 sm:col-span-1 p-4 bg-rose-400 text-white rounded-3xl flex items-center justify-center hover:bg-rose-500 shadow-lg shadow-rose-200 transition-all active:scale-95"
          >
            <p className="text-sm font-bold">Hepsi</p>
          </button>
        </div>
        <button
          onClick={() => setStep('SEMESTER_SELECTION')}
          className="mt-8 w-full text-slate-400 font-bold hover:text-rose-400 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowRight size={16} className="rotate-180" />
          Dönem Seçimine Dön
        </button>
      </div>
    );
  }

  if (step === 'TYPE_SELECTION') {
    return (
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-500 border border-rose-50">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-rose-50 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
            <Settings size={40} className="text-rose-400" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Test Tipini Seç</h2>
          <p className="text-slate-400 text-center max-w-sm">Hafta {selectedWeek} için nasıl bir test istersin?</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => startTest('kanji-to-reading')}
            className="p-8 bg-white border-2 border-slate-100 rounded-[2rem] flex items-center gap-6 hover:border-rose-300 hover:bg-rose-50/50 transition-all active:scale-95 group"
          >
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-500 group-hover:bg-rose-400 group-hover:text-white transition-colors">
              <Languages size={32} />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-slate-800">Kanji'den Okunuş</h3>
              <p className="text-sm text-slate-400">Ekranda Kanji görünür, doğru okunuşu seçersin.</p>
            </div>
          </button>

          <button
            onClick={() => startTest('reading-to-kanji')}
            className="p-8 bg-white border-2 border-slate-100 rounded-[2rem] flex items-center gap-6 hover:border-sky-300 hover:bg-sky-50/50 transition-all active:scale-95 group"
          >
            <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-500 group-hover:bg-sky-400 group-hover:text-white transition-colors">
              <TypeIcon size={32} />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-slate-800">Okunuştan Kanji</h3>
              <p className="text-sm text-slate-400">Ekranda okunuş görünür, doğru Kanji'yi seçersin.</p>
            </div>
          </button>

          <button
            onClick={() => setStep('WEEK_SELECTION')}
            className="mt-4 text-slate-400 font-bold hover:text-rose-400 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRight size={16} className="rotate-180" />
            Hafta Seçimine Dön
          </button>
        </div>
      </div>
    );
  }

  if (step === 'RESULTS') {
    const successRate = (score / questions.length) * 100;
    return (
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-10 animate-in zoom-in duration-500 border border-rose-50">
        <div className="text-center mb-10">
          <div className="bg-rose-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy size={48} className={`transition-all ${successRate > 70 ? 'text-amber-400 scale-110' : 'text-rose-300'}`} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">Test Sonucu</h2>
          <p className="text-rose-400 font-bold uppercase tracking-widest text-xs">
            Hafta {selectedWeek} &middot; {testType === 'kanji-to-reading' ? 'Kanji -> Okunuş' : 'Okunuş -> Kanji'}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Skor</p>
            <p className="text-3xl font-black text-slate-800">{score} <span className="text-lg text-slate-300">/ {questions.length}</span></p>
          </div>
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Başarı</p>
            <p className="text-3xl font-black text-slate-800">%{Math.round(successRate)}</p>
          </div>
        </div>

        {mistakes.length > 0 && (
          <div className="mb-10 text-left">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={18} className="text-red-400" />
              <h3 className="font-black text-slate-600 uppercase text-xs tracking-widest">Hatalarını Gözden Geçir</h3>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {mistakes.map((mistake, i) => (
                <div key={i} className="flex flex-col p-4 bg-red-50/50 rounded-2xl border border-red-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold kanji-font text-slate-800">{mistake.kanji}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-400">{mistake.meaning}</p>
                        <p className="text-[10px] text-rose-300 uppercase font-black mt-0.5">
                          {mistake.questionType === 'kanji-to-reading' ? 'Okunuşu Soruldu' : 'Kanjisi Soruldu'}
                        </p>
                      </div>
                    </div>
                    <BookOpen size={16} className="text-rose-200" />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-500 rounded-md font-bold line-through">{mistake.userChoice}</span>
                    <ArrowRight size={12} className="text-slate-300" />
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-md font-bold">{mistake.correct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button 
            onClick={() => startTest(testType)}
            className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold shadow-xl hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            Yeniden Başlat
          </button>
          <button 
            onClick={resetToMenu}
            className="flex-1 py-4 bg-white text-rose-400 border-2 border-rose-100 rounded-2xl font-bold hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Ana Menü
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="w-full max-w-lg flex flex-col gap-8">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-rose-100 border border-rose-50 p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-50">
          <div 
            className="h-full bg-rose-400 transition-all duration-500" 
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="mb-4 flex justify-between items-center">
          <span className="px-4 py-1.5 bg-rose-50 text-rose-500 text-[10px] font-black rounded-full uppercase tracking-widest border border-rose-100">
            Soru {currentIdx + 1} / {questions.length}
          </span>
          <button onClick={resetToMenu} className="text-slate-300 hover:text-rose-400 transition-colors">
            <XCircle size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <h2 className={`font-bold text-slate-800 kanji-font leading-none mb-6 select-none drop-shadow-sm ${
            currentQuestion.type === 'kanji-to-reading' ? 'text-[7rem]' : 'text-[4rem] text-rose-500'
          }`}>
            {currentQuestion.type === 'kanji-to-reading' 
              ? currentQuestion.item.kanji 
              : currentQuestion.item.reading}
          </h2>
          <p className="text-rose-400 font-bold text-lg mb-2">
            {currentQuestion.type === 'kanji-to-reading' 
              ? 'Bu kelimenin okunuşu hangisidir?' 
              : 'Bu okunuşa ait kanji hangisidir?'}
          </p>
          <p className="text-slate-400 text-sm italic">Anlamı: {currentQuestion.item.meaning}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {currentQuestion.options.map((option, idx) => {
          const isKtoR = currentQuestion.type === 'kanji-to-reading';
          const correctAnswer = isKtoR ? currentQuestion.item.reading : currentQuestion.item.kanji;
          const isCorrect = option === correctAnswer;
          const isSelected = selectedIdx === idx;
          
          let buttonClass = "bg-white border-2 border-slate-100 text-slate-600 hover:border-rose-200 hover:bg-rose-50/30";
          if (isAnswered) {
            if (isCorrect) buttonClass = "bg-green-50 border-green-400 text-green-700 shadow-lg shadow-green-100 scale-[1.02]";
            else if (isSelected) buttonClass = "bg-red-50 border-red-400 text-red-700 shadow-lg shadow-red-100";
            else buttonClass = "bg-white border-slate-50 text-slate-300 opacity-50";
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionClick(idx)}
              disabled={isAnswered}
              className={`p-6 rounded-[1.5rem] font-bold transition-all duration-300 flex items-center justify-between ${buttonClass} ${!isAnswered ? 'active:scale-95' : ''} ${
                isKtoR ? 'text-xl' : 'text-2xl'
              }`}
            >
              <span className="kanji-font">{option}</span>
              {isAnswered && isCorrect && <CheckCircle2 size={24} className="text-green-500" />}
              {isAnswered && isSelected && !isCorrect && <XCircle size={24} className="text-red-500" />}
            </button>
          );
        })}
      </div>

      <div className="flex justify-center h-16">
        {isAnswered && (
          <button
            onClick={handleNext}
            className="px-10 py-4 bg-slate-800 text-white rounded-2xl font-bold shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 hover:bg-slate-900 active:scale-95"
          >
            {currentIdx + 1 === questions.length ? 'Sonuçları Gör' : 'Sıradaki Soru'}
            <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TestMode;
