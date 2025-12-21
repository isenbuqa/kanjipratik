
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Eye, EyeOff, Settings, RotateCcw, X, PenTool, Brush, Highlighter, ZoomIn } from 'lucide-react';
import { KanjiItem } from '../types';

interface DrawingBoardProps {
  item: KanjiItem;
}

type BrushType = 'pen' | 'calligraphy' | 'marker';
type CanvasBg = 'white' | 'cream' | 'dark';

const DrawingBoard: React.FC<DrawingBoardProps> = ({ item }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  
  const [guideOpacity, setGuideOpacity] = useState(12); 
  const [guideSize, setGuideSize] = useState(350);
  const [penWidth, setPenWidth] = useState(12);
  const [brushType, setBrushType] = useState<BrushType>('pen');
  const [canvasBg, setCanvasBg] = useState<CanvasBg>('white');

  const lastPos = useRef<{ x: number, y: number, time: number } | null>(null);
  const currentLineWidth = useRef<number>(12);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext('2d', { willReadFrequently: true }) : null;
  }, []);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (canvas && ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory(prev => [...prev, imageData].slice(-20));
    }
  }, [getCtx]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx || history.length === 0) return;

    const newHistory = [...history];
    newHistory.pop();
    const prevState = newHistory[newHistory.length - 1];

    if (prevState) {
      ctx.putImageData(prevState, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHistory(newHistory);
  }, [history, getCtx]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHistory([]);
  }, [getCtx]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = Math.min(window.innerHeight * 0.5, 500);
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = getCtx();
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    clearCanvas();
  }, [clearCanvas, getCtx]);

  useEffect(() => {
    initCanvas();
    window.addEventListener('resize', initCanvas);
    return () => window.removeEventListener('resize', initCanvas);
  }, [initCanvas, item]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const now = Date.now();
      if ('touches' in e) {
        lastPos.current = { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top, time: now };
      } else {
        lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, time: now };
      }
    }
    currentLineWidth.current = penWidth;
    draw(e);
  };

  const endDrawing = () => {
    if (isDrawing) saveToHistory();
    setIsDrawing(false);
    lastPos.current = null;
    const ctx = getCtx();
    if (ctx) {
      ctx.beginPath();
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    const now = Date.now();

    if ('touches' in e) {
      if (e.cancelable) e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.strokeStyle = canvasBg === 'dark' ? '#f8fafc' : '#0f172a';
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';

    if (brushType === 'marker') {
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = penWidth * 1.5;
      ctx.lineCap = 'square';
      ctx.globalCompositeOperation = 'multiply';
    } else if (brushType === 'calligraphy' && lastPos.current) {
      const dx = x - lastPos.current.x;
      const dy = y - lastPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const time = now - lastPos.current.time;
      const speed = dist / (time || 1);
      
      const targetWidth = Math.max(penWidth * 0.2, penWidth * (1.5 - speed * 0.8));
      currentLineWidth.current = currentLineWidth.current * 0.7 + targetWidth * 0.3;
      ctx.lineWidth = currentLineWidth.current;
      ctx.lineCap = 'round';
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 1;
    } else {
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
    }

    ctx.beginPath();
    if (lastPos.current) {
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
    } else {
      ctx.moveTo(x, y);
    }
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPos.current = { x, y, time: now };
  };

  const getBgClass = () => {
    switch(canvasBg) {
      case 'cream': return 'bg-[#fffdf2]';
      case 'dark': return 'bg-[#0f172a]';
      default: return 'bg-white';
    }
  };

  return (
    <div className="w-full max-w-4xl flex flex-col gap-6">
      <div className="flex flex-col items-center text-center px-4">
        <h3 className="text-4xl font-bold text-slate-800 kanji-font tracking-tight">
          {item.reading}
        </h3>
        <p className="text-rose-400 font-semibold text-xl mt-1">{item.meaning}</p>
      </div>

      <div className={`relative group p-2 rounded-[2.5rem] shadow-2xl shadow-rose-100 border border-rose-50 transition-colors duration-500 ${getBgClass()}`} ref={containerRef}>
        
        {/* Trace Guide Background */}
        <div 
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500 ${
            showGuide ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ opacity: showGuide ? guideOpacity / 100 : 0 }}
        >
          <span 
            className={`font-bold kanji-font select-none transition-all duration-300 ${canvasBg === 'dark' ? 'text-slate-400' : 'text-slate-900'}`}
            style={{ fontSize: `${guideSize}px` }}
          >
            {item.kanji}
          </span>
        </div>

        {/* Drawing Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={endDrawing}
          onMouseMove={draw}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={endDrawing}
          onTouchMove={draw}
          className="rounded-[2rem] cursor-crosshair touch-none transition-all duration-500 shadow-inner"
        />

        {/* Action Controls */}
        <div className="absolute top-6 right-6 flex flex-col gap-4 z-30">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-4 rounded-2xl shadow-xl transition-all ${
              showSettings ? 'bg-rose-500 text-white rotate-90 scale-110' : 'bg-white text-rose-300 hover:text-rose-500'
            }`}
            title="Ayarlar"
          >
            <Settings size={24} />
          </button>
          
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className={`p-4 rounded-2xl shadow-xl transition-all ${
              showGuide ? 'bg-sky-400 text-white scale-110' : 'bg-white text-sky-200 hover:text-sky-400'
            }`}
            title={showGuide ? "Rehberi Gizle" : "Rehberi Göster"}
          >
            {showGuide ? <EyeOff size={24} /> : <Eye size={24} />}
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-30">
          <div className="flex gap-3">
            <button 
              onClick={undo}
              disabled={history.length === 0}
              className={`p-4 bg-white text-slate-400 rounded-2xl shadow-xl transition-all hover:text-rose-500 hover:bg-rose-50 ${history.length === 0 ? 'opacity-30' : 'active:scale-90'}`}
              title="Geri Al"
            >
              <RotateCcw size={24} />
            </button>
            <button 
              onClick={clearCanvas}
              className="p-4 bg-white text-slate-400 rounded-2xl shadow-xl hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-90"
              title="Temizle"
            >
              <Eraser size={24} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="absolute top-24 right-6 w-80 p-6 bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-rose-100 z-50 animate-in fade-in slide-in-from-top-6 duration-300">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-black text-rose-400 uppercase tracking-widest">Çizim Laboratuvarı</span>
              <button onClick={() => setShowSettings(false)} className="p-1 text-rose-200 hover:text-rose-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Brush Type */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fırça Sanatı</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setBrushType('pen')}
                    className={`p-3 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${brushType === 'pen' ? 'bg-rose-50 border-rose-400 text-rose-600 shadow-inner' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                  >
                    <PenTool size={20} />
                    <span className="text-[9px] font-bold">KALEM</span>
                  </button>
                  <button 
                    onClick={() => setBrushType('calligraphy')}
                    className={`p-3 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${brushType === 'calligraphy' ? 'bg-rose-50 border-rose-400 text-rose-600 shadow-inner' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                  >
                    <Brush size={20} />
                    <span className="text-[9px] font-bold">FIRÇA</span>
                  </button>
                  <button 
                    onClick={() => setBrushType('marker')}
                    className={`p-3 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all ${brushType === 'marker' ? 'bg-rose-50 border-rose-400 text-rose-600 shadow-inner' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                  >
                    <Highlighter size={20} />
                    <span className="text-[9px] font-bold">MARKÖR</span>
                  </button>
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Kağıt Dokusu</label>
                <div className="flex gap-4">
                  <button onClick={() => setCanvasBg('white')} className={`w-10 h-10 rounded-full border-4 transition-all ${canvasBg === 'white' ? 'border-rose-400 scale-110 shadow-lg' : 'border-slate-100 bg-white shadow-sm'}`} title="Saf Beyaz"></button>
                  <button onClick={() => setCanvasBg('cream')} className={`w-10 h-10 rounded-full border-4 transition-all ${canvasBg === 'cream' ? 'border-rose-400 scale-110 shadow-lg' : 'border-slate-100 bg-[#fffdf2] shadow-sm'}`} title="Antik Krem"></button>
                  <button onClick={() => setCanvasBg('dark')} className={`w-10 h-10 rounded-full border-4 transition-all ${canvasBg === 'dark' ? 'border-rose-400 scale-110 shadow-lg' : 'border-slate-100 bg-[#0f172a] shadow-sm'}`} title="Gece Mavisi"></button>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-5 pt-4 border-t border-rose-50">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1"><Eye size={12} /> Rehber Görünürlüğü</span> <span>%{guideOpacity}</span>
                  </label>
                  <input 
                    type="range" min="0" max="100" value={guideOpacity} 
                    onChange={(e) => setGuideOpacity(parseInt(e.target.value))}
                    className="w-full h-2 bg-rose-50 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1"><ZoomIn size={12} /> Rehber Boyutu</span> <span>{guideSize}px</span>
                  </label>
                  <input 
                    type="range" min="100" max="600" value={guideSize} 
                    onChange={(e) => setGuideSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-rose-50 rounded-lg appearance-none cursor-pointer accent-rose-400"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center gap-1"><PenTool size={12} /> Uç Kalınlığı</span> <span>{penWidth}px</span>
                  </label>
                  <input 
                    type="range" min="4" max="60" value={penWidth} 
                    onChange={(e) => setPenWidth(parseInt(e.target.value))}
                    className="w-full h-2 bg-rose-50 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-sm font-bold text-rose-300 uppercase tracking-[0.3em] flex items-center justify-center gap-3 mt-4">
        Serbest Çizim ve Yazma Pratiği
      </p>
    </div>
  );
};

export default DrawingBoard;
