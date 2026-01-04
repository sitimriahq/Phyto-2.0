
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Camera, Upload, Info, Leaf, Trash2, AlertCircle, Shield, Bug, FileImage, 
  Droplets, History, ChevronRight, Eye, Search, Target, BrainCircuit, 
  ThumbsUp, ThumbsDown, MessageSquare, Check, HelpCircle, Activity, 
  ZoomIn, ZoomOut, Move, FlaskConical, ShieldCheck, Sprout, Zap, Heart, 
  Clock, Lightbulb, AlertTriangle, BarChart3, TrendingUp, UserCheck
} from 'lucide-react';
import { DISEASE_DATABASE } from './constants';
import { AnalysisResult, DiseaseStage, ImageQuality, HistoryItem, UserFeedback, TreatmentProtocol } from './types';
import { analyzeImageQuality, calculateSeverity } from './imageProcessor';
import { analyzePlantImage } from './geminiService';

const TREATMENT_METADATA: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  immediate: { label: 'Immediate Actions', icon: Clock, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  chemical: { label: 'Chemical Control', icon: FlaskConical, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  cultural: { label: 'Cultural Practices', icon: Sprout, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  preventive: { label: 'Prevention Strategy', icon: ShieldCheck, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  nutritional: { label: 'Nutritional Support', icon: Zap, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  recovery: { label: 'Recovery Phase', icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  photographyTips: { label: 'Photography Tips', icon: Camera, color: 'text-slate-600', bgColor: 'bg-slate-50' },
  tips: { label: 'Expert Tips', icon: Lightbulb, color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
};

const TreatmentSection: React.FC<{ protocol: TreatmentProtocol }> = ({ protocol }) => {
  return (
    <div className="space-y-6">
      {Object.entries(protocol).map(([key, steps]) => {
        if (!steps || (Array.isArray(steps) && steps.length === 0)) return null;
        const meta = TREATMENT_METADATA[key] || { label: key, icon: Info, color: 'text-slate-600', bgColor: 'bg-slate-50' };
        const Icon = meta.icon;

        return (
          <div key={key} className={`rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white`}>
            <div className={`px-4 py-3 flex items-center gap-3 ${meta.bgColor} border-b border-slate-100`}>
              <Icon className={`w-5 h-5 ${meta.color}`} />
              <h5 className={`text-xs font-black uppercase tracking-widest ${meta.color}`}>{meta.label}</h5>
            </div>
            <div className="p-4 space-y-3">
              {(steps as string[]).map((step, i) => (
                <div key={i} className="flex gap-3 items-start group">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-slate-100 text-[10px] font-bold text-slate-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all`}>
                    {i + 1}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SeverityBadge: React.FC<{ severity: number }> = ({ severity }) => {
  const badges = [
    { text: 'Healthy / No Disease', color: 'bg-green-100 text-green-800 border-green-300' },
    { text: 'Low Severity', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    { text: 'Medium Severity', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    { text: 'High Severity', color: 'bg-red-100 text-red-800 border-red-300' }
  ];
  const badge = badges[severity] || badges[0];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
      {badge.text}
    </span>
  );
};

const ConfidenceGauge: React.FC<{ confidence: number }> = ({ confidence }) => {
  const percentage = Math.round(confidence * 100);
  let color = 'bg-rose-500';
  let label = 'Low Confidence';
  if (percentage >= 85) { color = 'bg-emerald-500'; label = 'High Confidence'; }
  else if (percentage >= 70) { color = 'bg-amber-500'; label = 'Medium Confidence'; }

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-end">
        <div className="space-y-0.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Trust Level</p>
          <p className={`text-sm font-black ${percentage >= 70 ? 'text-slate-800' : 'text-rose-600'}`}>{label} ({percentage}%)</p>
        </div>
        <span title="Percentage indicates how sure the AI is about this specific diagnosis based on the quality and symptoms visible.">
          <HelpCircle className="w-4 h-4 text-slate-300 cursor-help" />
        </span>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${color} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const HeatmapOverlay: React.FC<{ show: boolean; region: string; zoom: number }> = ({ show, region, zoom }) => {
  if (!show) return null;
  
  let flexClass = "items-center justify-center";
  if (region.includes("left")) flexClass = "items-center justify-start ml-12";
  if (region.includes("right")) flexClass = "items-center justify-end mr-12";
  if (region.includes("top")) flexClass = "items-start justify-center mt-12";
  if (region.includes("bottom")) flexClass = "items-end justify-center mb-12";

  return (
    <div className={`absolute inset-0 pointer-events-none flex ${flexClass}`}>
       <div className="relative">
          <div className="absolute inset-0 bg-red-500 rounded-full blur-[40px] opacity-40 animate-pulse scale-150" />
          <div className="absolute inset-0 bg-yellow-400 rounded-full blur-[20px] opacity-60 animate-pulse scale-110" />
          <div className="border-2 border-white/50 w-24 h-24 rounded-full flex items-center justify-center backdrop-blur-[2px]">
            <Target className="w-8 h-8 text-white drop-shadow-lg animate-bounce" />
          </div>
       </div>
       <div className="absolute top-4 left-4 bg-slate-900/90 text-white text-[9px] px-2 py-1.5 rounded-lg font-black flex items-center gap-2 shadow-xl border border-white/20">
          <Activity className="w-3 h-3 text-emerald-400" /> CONCEPTUAL HEATMAP (AI FOCUS)
       </div>
       <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_rgba(52,211,153,0.8)] top-0 left-0 animate-[scan_4s_infinite]" />
    </div>
  );
};

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'scanner' | 'database' | 'history'>('scanner');
  const [imageQuality, setImageQuality] = useState<ImageQuality | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('phytoscan_analysis_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (res: AnalysisResult) => {
    const newItem: HistoryItem = {
      id: res.id,
      timestamp: res.timestamp,
      stage: res.stage,
      diseaseName: res.disease.name,
      confidence: res.confidence,
      severityScore: res.severityScore,
      userFeedback: res.userFeedback
    };
    const updatedHistory = [newItem, ...history].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('phytoscan_analysis_history', JSON.stringify(updatedHistory));
  };

  const submitFeedback = (isCorrect: boolean, suggestedStage?: DiseaseStage) => {
    if (!result) return;
    const feedback: UserFeedback = {
      id: crypto.randomUUID(),
      analysisId: result.id,
      isCorrect,
      userSuggestedStage: suggestedStage,
      timestamp: new Date().toISOString()
    };
    
    // Update local state for current result
    const updatedResult = { ...result, userFeedback: feedback };
    setResult(updatedResult);
    setFeedbackSubmitted(true);
    setShowCorrectionForm(false);
    
    // Update the record in history
    const updatedHistory = history.map(item => 
      item.id === result.id ? { ...item, userFeedback: feedback } : item
    );
    setHistory(updatedHistory);
    localStorage.setItem('phytoscan_analysis_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure? All analysis records and feedback stats will be wiped.")) {
      setHistory([]);
      localStorage.removeItem('phytoscan_analysis_history');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
        setImageQuality(null);
        setShowOverlay(false);
        setFeedbackSubmitted(false);
        setShowCorrectionForm(false);
        setZoom(1);
        setPan({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    setShowOverlay(false);
    setFeedbackSubmitted(false);
    setShowCorrectionForm(false);
    try {
      const quality = await analyzeImageQuality(selectedImage);
      setImageQuality(quality);
      const aiResult = await analyzePlantImage(selectedImage);
      const stage = aiResult.stage as DiseaseStage;
      const severityScore = calculateSeverity(stage, aiResult.lesionCount, aiResult.avgLesionSize);
      const finalResult: AnalysisResult = {
        id: crypto.randomUUID(),
        stage,
        confidence: aiResult.confidence,
        disease: DISEASE_DATABASE[stage],
        lesionCount: aiResult.stage === 'N0' || aiResult.stage === 'H0' ? 0 : aiResult.lesionCount,
        avgLesionSize: aiResult.stage === 'N0' || aiResult.stage === 'H0' ? 0 : aiResult.avgLesionSize,
        severityScore,
        timestamp: new Date().toLocaleString(),
        qualityIssues: quality.isTooDark || quality.hasShadows || quality.isLowRes || quality.hasOverexposure ? {
          tooDark: quality.isTooDark,
          shadows: quality.hasShadows,
          lowRes: quality.isLowRes,
          overexposed: quality.hasOverexposure
        } : null,
        aiExplanation: aiResult.explanation,
        reasoningForFarmer: aiResult.reasoningForFarmer,
        detectedSymptoms: aiResult.detectedSymptoms || [],
        visualEvidenceRegions: aiResult.visualEvidenceRegions || ""
      };
      setResult(finalResult);
      saveToHistory(finalResult);
      if (stage !== 'H0' && stage !== 'N0') setTimeout(() => setShowOverlay(true), 1200);
    } catch (error) {
      alert("Analysis failed. Please check your network.");
    } finally {
      setAnalyzing(false);
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setResult(null);
    setImageQuality(null);
    setShowOverlay(false);
    setFeedbackSubmitted(false);
    setShowCorrectionForm(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || zoom <= 1) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPan({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Memoized statistics for the Reliability Dashboard
  const stats = useMemo(() => {
    if (history.length === 0) return { total: 0, confirmed: 0, corrected: 0, accuracy: 0 };
    const confirmed = history.filter(h => h.userFeedback?.isCorrect === true).length;
    const corrected = history.filter(h => h.userFeedback?.isCorrect === false).length;
    const withFeedback = confirmed + corrected;
    const accuracy = withFeedback > 0 ? Math.round((confirmed / withFeedback) * 100) : 0;
    return { total: history.length, confirmed, corrected, accuracy };
  }, [history]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-inner"><Leaf className="w-8 h-8 text-emerald-600" /></div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">PhytoScan</h1>
              <p className="text-emerald-100 text-[10px] opacity-90 font-black uppercase tracking-widest">Kangkung Health Expert</p>
            </div>
          </div>
          <nav className="flex bg-emerald-800/50 p-1 rounded-xl">
            <button onClick={() => setActiveTab('scanner')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'scanner' ? 'bg-white text-emerald-800 shadow-md' : 'text-emerald-100'}`}><Camera className="w-4 h-4" /> SCANNER</button>
            <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'history' ? 'bg-white text-emerald-800 shadow-md' : 'text-emerald-100'}`}><History className="w-4 h-4" /> HISTORY</button>
            <button onClick={() => setActiveTab('database')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'database' ? 'bg-white text-emerald-800 shadow-md' : 'text-emerald-100'}`}><Info className="w-4 h-4" /> GUIDE</button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'scanner' ? (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Upload className="w-5 h-5 text-emerald-600" /> Image Input</h2>
                    {selectedImage && <button onClick={resetScanner} className="text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-colors"><Trash2 className="w-5 h-5" /></button>}
                  </div>
                  {!selectedImage ? (
                    <div className="group relative border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-emerald-500 transition-all cursor-pointer bg-slate-50">
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Upload className="w-10 h-10 text-emerald-600" /></div>
                        <div><p className="text-slate-800 font-bold text-lg">Select Leaf Image</p><p className="text-slate-500 text-sm mt-1">Upload a clear photo for AI diagnosis</p></div>
                        <span className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg">BROWSE FILES</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div 
                        ref={containerRef}
                        className={`relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-video flex items-center justify-center group ${zoom > 1 ? 'cursor-move' : 'cursor-default'}`}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleMouseDown}
                        onTouchMove={handleMouseMove}
                        onTouchEnd={handleMouseUp}
                      >
                        <img 
                          ref={imageRef}
                          src={selectedImage} 
                          alt="Kangkung leaf" 
                          className="max-h-full transition-transform duration-200 ease-out pointer-events-none select-none"
                          style={{ 
                            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` 
                          }}
                        />
                        <HeatmapOverlay show={showOverlay && !!result && result.stage !== 'H0'} region={result?.visualEvidenceRegions || ""} zoom={zoom} />
                        
                        {zoom > 1 && (
                          <div className="absolute top-4 right-4 bg-slate-900/80 text-white text-[10px] px-2 py-1 rounded-full font-bold backdrop-blur flex items-center gap-1.5 border border-white/20">
                            <Move className="w-3 h-3 text-emerald-400" /> DRAG TO PAN ({zoom.toFixed(1)}x)
                          </div>
                        )}

                        <div className="absolute bottom-3 left-3 flex gap-2">
                           {result && result.stage !== 'H0' && result.stage !== 'N0' && (
                             <button onClick={(e) => { e.stopPropagation(); setShowOverlay(!showOverlay); }} className={`p-2 rounded-lg backdrop-blur flex items-center gap-2 text-[10px] font-black shadow-lg transition-all ${showOverlay ? 'bg-emerald-600 text-white' : 'bg-white/90 text-slate-700 border border-slate-200'}`}>
                               <Eye className="w-3 h-3" /> {showOverlay ? 'HIDE AI HEATMAP' : 'SHOW AI HEATMAP'}
                             </button>
                           )}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-4">
                        <ZoomOut className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex-1 px-1">
                          <input 
                            type="range" 
                            min="1" 
                            max="4" 
                            step="0.1" 
                            value={zoom} 
                            onChange={(e) => {
                              const nextZoom = parseFloat(e.target.value);
                              if (nextZoom === 1) setPan({ x: 0, y: 0 });
                              setZoom(nextZoom);
                            }}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                          />
                        </div>
                        <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
                        <button 
                          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                          className="text-[10px] font-black bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors uppercase tracking-widest shadow-sm"
                        >
                          Reset
                        </button>
                      </div>

                      <button onClick={runAnalysis} disabled={analyzing} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3">
                        {analyzing ? <><div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> ANALYZING...</> : <><Camera className="w-6 h-6" /> START AI DETECTION</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {!result ? (
                <div className="bg-white rounded-3xl border border-slate-200 h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner"><Leaf className="w-12 h-12 text-slate-200" /></div>
                   <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Awaiting Analysis</h3>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  <div className={`${result.disease.bgColor} ${result.disease.borderColor} border-2 rounded-3xl p-6 shadow-lg overflow-hidden relative`}>
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-4 rounded-2xl bg-white shadow-md"><result.disease.icon className={`w-10 h-10 ${result.disease.color}`} /></div>
                        <div>
                          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Stage {result.stage}</p>
                          <h3 className={`text-3xl font-black ${result.disease.color} leading-none mb-2`}>{result.disease.name}</h3>
                          <SeverityBadge severity={result.disease.severity} />
                        </div>
                      </div>
                    </div>
                    <ConfidenceGauge confidence={result.confidence} />
                  </div>

                  {/* Feedback Section - Enhanced for user interaction */}
                  <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <h4 className="font-black flex items-center gap-2 text-sm tracking-widest uppercase"><MessageSquare className="w-4 h-4 text-emerald-400" /> Quality Feedback</h4>
                      {feedbackSubmitted && <div className="bg-emerald-500 p-1 rounded-full"><Check className="w-3 h-3 text-white" /></div>}
                    </div>
                    
                    {feedbackSubmitted ? (
                      <div className="animate-in fade-in zoom-in-95 duration-500 relative z-10">
                        <div className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                           <div className="p-2 bg-emerald-500 rounded-full"><ThumbsUp className="w-4 h-4" /></div>
                           <p className="text-xs font-bold text-emerald-100">Feedback Recorded. This data helps improve the Kangkung model accuracy over time.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 relative z-10">
                        <p className="text-xs text-slate-400">Is the AI classification for <strong>{result.disease.name}</strong> accurate?</p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => submitFeedback(true)} 
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <ThumbsUp className="w-3 h-3" /> CONFIRM
                          </button>
                          <button 
                            onClick={() => setShowCorrectionForm(true)} 
                            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 border border-white/10 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <ThumbsDown className="w-3 h-3" /> REPORT ERROR
                          </button>
                        </div>
                        {showCorrectionForm && (
                          <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-2xl animate-in slide-in-from-top-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Which stage is it actually?</p>
                             <div className="grid grid-cols-2 gap-2">
                                {Object.entries(DISEASE_DATABASE).map(([code, d]) => (
                                  <button 
                                    key={code} 
                                    onClick={() => submitFeedback(false, code as DiseaseStage)} 
                                    className="py-2.5 text-[9px] font-black border border-white/20 rounded-lg hover:bg-emerald-600 hover:border-emerald-600 transition-all uppercase tracking-tighter"
                                  >
                                    {d.name.split(' ')[0]}
                                  </button>
                                ))}
                             </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                    <h4 className="font-black text-slate-900 flex items-center gap-2 mb-6 text-lg tracking-tight">
                      <BrainCircuit className="w-6 h-6 text-indigo-600" /> AI Diagnostic Reasoning
                    </h4>
                    <div className="space-y-6 relative z-10">
                       <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Technical Insight</p>
                          <p className="text-slate-800 leading-relaxed font-medium">"{result.reasoningForFarmer}"</p>
                       </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                    <h4 className="font-black text-slate-800 flex items-center gap-2 mb-6 text-lg tracking-tight">
                      <Shield className="w-6 h-6 text-emerald-600" /> Treatment Protocol
                    </h4>
                    <TreatmentSection protocol={result.disease.treatment} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'history' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* Reliability Dashboard */}
            <div className="grid md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4"><BarChart3 className="w-5 h-5 text-indigo-600" /></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model Precision</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-1">{stats.accuracy}%</h3>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-4 leading-relaxed font-medium">Agreement rate between the AI model and your manual confirmations.</p>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4"><UserCheck className="w-5 h-5 text-emerald-600" /></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmed Diagnoses</p>
                    <h3 className="text-3xl font-black text-slate-800 mt-1">{stats.confirmed}</h3>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-emerald-600">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Healthy verification flow</span>
                  </div>
               </div>
               <div className="bg-emerald-700 p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden">
                  <Activity className="absolute bottom-0 right-0 w-32 h-32 text-white/5 -mb-8 -mr-8" />
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Total Assessments</p>
                    <h3 className="text-4xl font-black text-white mt-1">{stats.total}</h3>
                  </div>
                  <button 
                    onClick={clearHistory}
                    className="mt-6 w-full py-2.5 bg-white/10 hover:bg-rose-500 text-white rounded-xl font-black text-[10px] transition-all uppercase tracking-widest flex items-center justify-center gap-2 border border-white/20"
                  >
                    <Trash2 className="w-3 h-3" /> WIPE LOCAL DATA
                  </button>
               </div>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg">
              <h2 className="text-2xl font-black text-slate-900 mb-6">Activity Feed</h2>
              {history.length === 0 ? (
                <div className="p-20 flex flex-col items-center text-center">
                  <History className="w-12 h-12 text-slate-200 mb-4" />
                  <h3 className="text-lg font-bold text-slate-400">No records found</h3>
                </div>
              ) : (
                <div className="grid gap-4">
                  {history.map((item) => {
                    const disease = DISEASE_DATABASE[item.stage];
                    return (
                      <div key={item.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center gap-4 hover:border-emerald-500 transition-all group">
                        <div className={`w-14 h-14 rounded-2xl ${disease.bgColor} flex items-center justify-center border border-white shrink-0 shadow-sm`}><disease.icon className={`w-7 h-7 ${disease.color}`} /></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-black text-slate-800 text-base">{item.diseaseName}</h4>
                            <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-full border shadow-sm uppercase">{item.stage}</span>
                            {item.userFeedback && (
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border shadow-sm uppercase flex items-center gap-1 ${item.userFeedback.isCorrect ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                {item.userFeedback.isCorrect ? <UserCheck className="w-2 h-2" /> : <AlertTriangle className="w-2 h-2" />}
                                {item.userFeedback.isCorrect ? 'CONFIRMED' : `USER FLAG: ${item.userFeedback.userSuggestedStage}`}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-4 text-[10px] font-bold">
                             <span className="text-slate-400">{item.timestamp}</span>
                             <span className="text-emerald-600">{Math.round(item.confidence * 100)}% Confidence</span>
                             <span className="text-rose-500">{item.severityScore}% Severity</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => { setActiveTab('database'); setTimeout(() => document.getElementById(item.stage)?.scrollIntoView({ behavior: 'smooth' }), 100); }} 
                          className="flex items-center gap-2 px-6 py-3 bg-white text-slate-600 rounded-xl font-black text-[10px] hover:bg-emerald-600 hover:text-white border border-slate-200 self-end md:self-center uppercase transition-all shadow-sm"
                        >
                          Protocol <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Diagnostic Encyclopedia</h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">Standardized staging system for Cercospora leaf spot in Water Spinach. Used as a reference for AI validation.</p>
             </div>
             <div className="grid gap-6">
                {Object.entries(DISEASE_DATABASE).map(([code, d]) => (
                  <div key={code} id={code} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <div className={`${d.bgColor} p-6 border-b border-slate-100 flex justify-between items-center`}>
                       <div className="flex items-center gap-4">
                          <div className="bg-white p-3 rounded-2xl shadow-sm"><d.icon className={`w-8 h-8 ${d.color}`} /></div>
                          <div><p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Stage {code}</p><h3 className={`text-xl font-black ${d.color}`}>{d.name}</h3></div>
                       </div>
                       <SeverityBadge severity={d.severity} />
                    </div>
                    <div className="p-6 grid md:grid-cols-2 gap-8">
                       <div className="space-y-8">
                          <section>
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Bug className="w-3 h-3 text-rose-500" /> Key Features</h4>
                             <div className="flex flex-wrap gap-2">
                                {d.symptoms.map((s, i) => <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold border border-slate-100 leading-none">{s}</span>)}
                             </div>
                          </section>
                          <section>
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-amber-500" /> Action Protocols</h4>
                             <TreatmentSection protocol={d.treatment} />
                          </section>
                       </div>
                       <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 shadow-xl self-start sticky top-24">
                          <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Biological Path</p><p className="text-xs leading-relaxed opacity-90">{d.biologicalInterpretation}</p></div>
                          <div className="pt-4 border-t border-white/10"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Visual Cue</p><p className="text-xs leading-relaxed italic opacity-80">{d.visualDescription}</p></div>
                          {d.prognosis && (
                            <div className="pt-4 border-t border-white/10"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Expert Prognosis</p><p className="text-xs leading-relaxed opacity-90 text-emerald-400 font-bold">{d.prognosis}</p></div>
                          )}
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-500 py-12 border-t border-white/5">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 text-white mb-6"><Leaf className="w-6 h-6 text-emerald-500" /><span className="text-xl font-black tracking-tighter">PhytoScan</span></div>
            <p className="text-[10px] uppercase font-black tracking-widest opacity-40 mb-2">Advanced Agricultural Research Toolkit</p>
            <p className="text-[10px] leading-relaxed max-w-lg mx-auto opacity-30">PhytoScan utilizes deep learning for advisory identification. All data stays local to your device.</p>
         </div>
      </footer>

      <style>{`
        @keyframes scan { 0% { top: 0; opacity: 0; } 5% { opacity: 1; } 95% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
      `}</style>
    </div>
  );
};

export default App;
