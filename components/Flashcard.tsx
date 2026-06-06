
import React, { useState, useEffect } from 'react';
import { KanjiItem } from '../types';

interface FlashcardProps {
  item: KanjiItem;
}

const Flashcard: React.FC<FlashcardProps> = ({ item }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [item]);

  return (
    <div 
      className="w-full max-w-[340px] sm:max-w-sm aspect-[4/5] perspective-1000 cursor-pointer group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className={`relative w-full h-full text-center transition-transform-600 preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front Face */}
        <div className="absolute w-full h-full bg-white rounded-[2.5rem] shadow-2xl shadow-rose-100 border border-rose-50 backface-hidden flex flex-col items-center justify-center p-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-200 via-sky-100 to-rose-200"></div>
          
          <div className="mb-6">
            <span className="inline-block px-4 py-1.5 bg-rose-50 text-rose-500 text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-rose-100">
              {item.week === 8 && item.semester === 2 ? 'Final' : `Hafta ${item.week}`}
            </span>
          </div>

          <div className="flex flex-col gap-6 text-center">
            <h2 className="text-4xl font-bold text-slate-700 kanji-font tracking-tight">
              {item.reading}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-200"></span>
              <span className="w-12 h-0.5 bg-rose-100 rounded-full"></span>
              <span className="w-2 h-2 rounded-full bg-rose-200"></span>
            </div>
            <p className="text-2xl text-rose-400 font-semibold leading-tight">
              {item.meaning}
            </p>
          </div>

          <div className="absolute bottom-10 flex flex-col items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
            <p className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Çevirmek için tıkla</p>
            <div className="w-1.5 h-1.5 rounded-full bg-rose-200 animate-bounce"></div>
          </div>
        </div>

        {/* Back Face */}
        <div className="absolute w-full h-full bg-gradient-to-br from-rose-50 to-white rounded-[2.5rem] shadow-2xl shadow-rose-100 border border-rose-100 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-10">
          <div className="absolute top-0 right-0 p-8">
            <div className="w-12 h-12 border-2 border-rose-100 rounded-full flex items-center justify-center text-rose-200 font-bold text-xs">
              漢
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center w-full h-full">
            <span className="text-[7rem] sm:text-[9rem] font-bold text-slate-800 kanji-font leading-none select-none drop-shadow-sm">
              {item.kanji}
            </span>
          </div>

          <div className="mt-8 flex flex-col items-center gap-1">
            <p className="text-[10px] font-black text-rose-300 uppercase tracking-[0.2em]">Okunuşu</p>
            <p className="text-xl font-bold text-rose-500">{item.reading}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
