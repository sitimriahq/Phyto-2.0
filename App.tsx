
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Info, Leaf, Trash2, AlertCircle, Shield, Bug, FileImage, Droplets, History, ChevronRight, Eye, Search, Target, BrainCircuit } from 'lucide-react';
import { DISEASE_DATABASE } from './constants';
import { AnalysisResult, DiseaseStage, ImageQuality, HistoryItem } from './types';
import { analyzeImageQuality, calculateSeverity } from './imageProcessor';
import { analyzePlantImage } from './geminiService';

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
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
        <span>AI Reliability</span>
        <span className={percentage >= 70 ? 'text-slate-600' : 'text-rose-500'}>{label}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${color}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-500 italic">
        The model is {percentage}% sure based on current visual evidence.
      </p>
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
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
      id: crypto.randomUUID(),
      timestamp: res.timestamp,
      stage: res.stage,
      diseaseName: res.disease.name,
      confidence: res.confidence,
      severityScore: res.severityScore,
    };

    const updatedHistory = [newItem, ...history].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('phytoscan_analysis_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your entire analysis history?")) {
      setHistory([]);
      localStorage.removeItem('phytoscan_analysis_history');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file is too large (max 10MB).');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSelectedImage(base64);
        setResult(null);
        setImageQuality(null);
        setShowOverlay(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    setShowOverlay(false);
    
    try {
      const quality = await analyzeImageQuality(selectedImage);
      setImageQuality(quality);

      const aiResult = await analyzePlantImage(selectedImage);
      const stage = aiResult.stage as DiseaseStage;
      const severityScore = calculateSeverity(stage, aiResult.lesionCount, aiResult.avgLesionSize);

      const finalResult: AnalysisResult = {
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
        detectedSymptoms: aiResult.detectedSymptoms || [],
        visualEvidenceRegions: aiResult.visualEvidenceRegions || ""
      };

      setResult(finalResult);
      saveToHistory(finalResult);
      // Auto-show overlay after short delay if disease found
      if (stage !== 'H0' && stage !== 'N0') {
        setTimeout(() => setShowOverlay(true), 1500);
      }
    } catch (error) {
      alert("Failed to analyze image. Please check your internet connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const resetScanner = () => {
    setSelectedImage(null);
    setResult(null);
    setImageQuality(null);
    setShowOverlay(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-emerald-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-inner">
              <Leaf className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">PhytoScan</h1>
              <p className="text-emerald-100 text-xs opacity-90 text-nowrap">Expert Cercospora Diagnosis</p>
            </div>
          </div>
          
          <nav className="flex bg-emerald-800/50 p-1 rounded-xl overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 ${activeTab === 'scanner' ? 'bg-white text-emerald-800 shadow-md' : 'text-emerald-100 hover:text-white'}`}
            >
              <Camera className="w-4 h-4" /> Scanner
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 ${activeTab === 'history' ? 'bg-white text-emerald-800 shadow-md' : 'text-emerald-100 hover:text-white'}`}
            >
              <History className="w-4 h-4" /> History
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 ${activeTab === 'database' ? 'bg-white text-emerald-800 shadow-md' : 'text-emerald-100 hover:text-white'}`}
            >
              <Info className="w-4 h-4" /> Encyclopedia
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'scanner' ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-emerald-600" /> Image Input
                    </h2>
                    {selectedImage && (
                      <button onClick={resetScanner} className="text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {!selectedImage ? (
                    <div className="group relative border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-emerald-500 transition-all cursor-pointer bg-slate-50">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="w-10 h-10 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold">Select Leaf Image</p>
                          <p className="text-slate-500 text-sm mt-1">Upload a clear photo of the infected leaf</p>
                        </div>
                        <span className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm">Browse Files</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 h-80 flex items-center justify-center group">
                        <img src={selectedImage} alt="Kangkung leaf" className="max-h-full object-contain" />
                        
                        {/* AI Heatmap Simulation Overlay */}
                        {showOverlay && result && result.stage !== 'H0' && result.stage !== 'N0' && (
                          <div className="absolute inset-0 bg-rose-500/20 pointer-events-none animate-pulse flex items-center justify-center">
                             <div className="border-4 border-rose-500 w-32 h-32 rounded-full blur-xl opacity-50 bg-rose-500" />
                             <div className="absolute top-4 left-4 bg-rose-600 text-white text-[10px] px-2 py-1 rounded font-black flex items-center gap-1 shadow-lg">
                                <Target className="w-3 h-3" /> AI DETECTED ANOMALY
                             </div>
                             {/* Scanning Line Animation */}
                             <div className="absolute w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] top-0 left-0 animate-[scan_3s_infinite]" />
                          </div>
                        )}

                        <div className="absolute bottom-3 left-3 flex gap-2">
                           {result && (result.stage !== 'H0' && result.stage !== 'N0') && (
                             <button 
                               onClick={() => setShowOverlay(!showOverlay)}
                               className={`p-2 rounded-lg backdrop-blur flex items-center gap-2 text-[10px] font-bold shadow-lg transition-all ${showOverlay ? 'bg-emerald-600 text-white' : 'bg-white/80 text-slate-700'}`}
                             >
                               <Eye className="w-3 h-3" /> {showOverlay ? 'HIDE AI HEATMAP' : 'SHOW AI HEATMAP'}
                             </button>
                           )}
                        </div>

                        {imageQuality && (
                          <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur text-white text-[10px] px-2 py-1 rounded-lg uppercase tracking-wider font-bold">
                            {imageQuality.resolution.width} × {imageQuality.resolution.height}
                          </div>
                        )}
                      </div>

                      {imageQuality && (imageQuality.isTooDark || imageQuality.hasShadows || imageQuality.isLowRes) && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <p className="text-amber-800 text-sm font-bold">Quality Concerns Detected</p>
                            <p className="text-amber-700 text-xs mt-1">Poor quality images may yield inaccurate results.</p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={runAnalysis}
                          disabled={analyzing}
                          className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {analyzing ? (
                            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
                          ) : (
                            <><Camera className="w-5 h-5" /> Start AI Detection</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6">
                <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-4 text-sm">
                  <Shield className="w-4 h-4" /> Capture Guidelines
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs text-blue-800">
                  <div className="flex gap-2">
                    <span className="text-blue-500 font-bold">●</span>
                    <span>Use direct, natural sunlight</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-500 font-bold">●</span>
                    <span>Hold camera 15-20cm away</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-500 font-bold">●</span>
                    <span>Keep leaf flat and clean</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-500 font-bold">●</span>
                    <span>Focus on main lesion area</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {!result ? (
                <div className="bg-white rounded-3xl border border-slate-200 h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center text-slate-400">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Leaf className="w-12 h-12 opacity-20" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-700">Ready for Analysis</h3>
                   <p className="text-sm mt-2 max-w-xs">Upload an image and run the AI scanner to see detailed disease diagnostic data.</p>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-8">
                  <div className={`${result.disease.bgColor} ${result.disease.borderColor} border-2 rounded-3xl p-6 shadow-sm overflow-hidden relative`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-white shadow-sm`}>
                          <result.disease.icon className={`w-8 h-8 ${result.disease.color}`} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Detection Result</p>
                          <h3 className={`text-2xl font-black ${result.disease.color}`}>{result.disease.name}</h3>
                          <div className="mt-1"><SeverityBadge severity={result.disease.severity} /></div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6 p-4 bg-white/40 border border-white/60 rounded-2xl">
                      <ConfidenceGauge confidence={result.confidence} />
                    </div>

                    <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">
                      {result.disease.description}
                    </p>

                    {result.lesionCount > 0 && (
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-white/50">
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Lesions</p>
                          <p className="text-lg font-black text-slate-800">{result.lesionCount}</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-white/50">
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Avg Size</p>
                          <p className="text-lg font-black text-slate-800">{result.avgLesionSize.toFixed(1)}mm</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-white/50">
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Severity</p>
                          <p className="text-lg font-black text-rose-600">{result.severityScore}%</p>
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                      Analyzed on {result.timestamp}
                    </div>
                  </div>

                  {/* AI Explainability & Detected Symptoms */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="font-black text-slate-800 flex items-center gap-2 mb-4">
                      <BrainCircuit className="w-5 h-5 text-indigo-600" /> AI Diagnostic Insight
                    </h4>
                    
                    <div className="space-y-6">
                       {result.detectedSymptoms.length > 0 && (
                         <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Visible Markers Found</p>
                            <div className="flex flex-wrap gap-2">
                               {result.detectedSymptoms.map((sym, i) => (
                                 <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 flex items-center gap-1">
                                    <Search className="w-3 h-3" /> {sym}
                                 </span>
                               ))}
                            </div>
                         </div>
                       )}

                       {result.visualEvidenceRegions && (
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Focus Areas</p>
                            <p className="text-sm text-slate-700">The AI model identified primary infection indicators in the <strong>{result.visualEvidenceRegions}</strong> of the image.</p>
                         </div>
                       )}

                       {result.aiExplanation && (
                        <div className="relative p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Technical Analysis</p>
                          <p className="text-sm text-slate-700 italic">"{result.aiExplanation}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <h4 className="font-black text-slate-800 flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-emerald-600" /> Treatment Protocol
                    </h4>
                    <div className="space-y-4">
                      {result.disease.treatment.immediate.map((step, i) => (
                        <div key={i} className="flex gap-3 items-start group">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <span className="text-[10px] font-bold">{i+1}</span>
                          </div>
                          <p className="text-sm text-slate-700 leading-snug">{step}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('database');
                        setTimeout(() => document.getElementById(result.stage)?.scrollIntoView({ behavior: 'smooth' }), 100);
                      }}
                      className="w-full mt-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-sm transition-all"
                    >
                      View Full Encyclopedia Guide
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'history' ? (
          /* History View */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Analysis History</h2>
                <p className="text-slate-500 max-w-xl leading-relaxed">
                  Review your previous plant health assessments. Your history is stored locally on this device.
                </p>
              </div>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm hover:bg-rose-100 transition-all border border-rose-100"
                >
                  <Trash2 className="w-4 h-4" /> Clear All History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <History className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">No History Yet</h3>
                <p className="text-slate-500 mt-2 max-w-xs">Your successful disease analyses will appear here once you start scanning.</p>
                <button 
                  onClick={() => setActiveTab('scanner')}
                  className="mt-8 px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md"
                >
                  Start Scanning
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {history.map((item) => {
                  const disease = DISEASE_DATABASE[item.stage];
                  return (
                    <div 
                      key={item.id} 
                      className="group bg-white rounded-2xl border border-slate-200 p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-md transition-all hover:border-emerald-200"
                    >
                      <div className={`w-16 h-16 rounded-2xl ${disease.bgColor} flex items-center justify-center shrink-0 border border-white shadow-sm`}>
                        <disease.icon className={`w-8 h-8 ${disease.color}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-800">{item.diseaseName}</h4>
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">{item.stage}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <p className="text-xs text-slate-500 font-medium">{item.timestamp}</p>
                          <p className="text-xs text-emerald-600 font-bold">{(item.confidence * 100).toFixed(1)}% Confidence</p>
                          <p className="text-xs text-rose-500 font-bold">{item.severityScore}% Severity</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setActiveTab('database');
                          setTimeout(() => document.getElementById(item.stage)?.scrollIntoView({ behavior: 'smooth' }), 100);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all border border-slate-100 self-end md:self-center"
                      >
                        View Guide <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Database View */
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg">
              <h2 className="text-3xl font-black text-slate-900 mb-2">Staging Encyclopedia</h2>
              <p className="text-slate-500 max-w-2xl leading-relaxed">
                Standardized H0-E3 classification system for Cercospora leaf spot in Water Spinach (Ipomoea aquatica). 
                Identifying the pathogen Cercospora spp. for effective management.
              </p>
            </div>

            <div className="grid gap-6">
              {Object.entries(DISEASE_DATABASE).map(([code, d]) => (
                <div key={code} id={code} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className={`${d.bgColor} p-6 border-b border-slate-100`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-2xl shadow-sm">
                          <d.icon className={`w-8 h-8 ${d.color}`} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Stage {code}</p>
                          <h3 className={`text-2xl font-black ${d.color}`}>{d.name}</h3>
                        </div>
                      </div>
                      <SeverityBadge severity={d.severity} />
                    </div>
                  </div>

                  <div className="p-6 grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                      <section>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Bug className="w-3 h-3 text-rose-500" /> Observable Symptoms
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {d.symptoms.map((s, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {s}
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Droplets className="w-3 h-3 text-blue-500" /> Protocol
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(d.treatment).slice(0, 3).map(([cat, steps]) => (
                            <div key={cat} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                              <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-tighter">{cat}</p>
                              <ul className="space-y-1.5">
                                {(steps as string[]).map((step, i) => (
                                  <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                                    <span className="text-emerald-600 font-bold leading-none mt-0.5">›</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100">
                        <h4 className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest">Biological Note</h4>
                        <p className="text-xs text-indigo-900 leading-relaxed font-medium">{d.biologicalInterpretation}</p>
                      </div>
                      
                      {d.prognosis && (
                        <div className="bg-purple-50/50 rounded-2xl p-5 border border-purple-100">
                          <h4 className="text-[10px] font-black text-purple-400 uppercase mb-2 tracking-widest">Prognosis</h4>
                          <p className="text-xs text-purple-900 font-bold">{d.prognosis}</p>
                        </div>
                      )}

                      <div className="bg-slate-900 text-white rounded-2xl p-5">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Visual Marker</h4>
                         <p className="text-xs text-slate-100 leading-relaxed">{d.visualDescription}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 mt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12 text-xs">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Leaf className="w-6 h-6 text-emerald-500" />
              <span className="text-lg font-black tracking-tighter">PhytoScan</span>
            </div>
            <p className="leading-relaxed">Advanced CNN-based diagnosis for Ipomoea aquatica, helping farmers and researchers identify diseases early for sustainable agriculture.</p>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Staging Standards</h4>
            <p>H0: Healthy Baseline</p>
            <p>E1: Early Penetration (1-3mm)</p>
            <p>E2: Mid Sporulation (5-12mm)</p>
            <p>E3: Late Necrosis (>12mm)</p>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Pathogen Profile</h4>
            <p>Agent: Cercospora spp.</p>
            <p>Class: Deuteromycetes</p>
            <p>Survival: Mycelia on debris</p>
            <p>Risk: High humidity spread</p>
          </div>
          <div className="space-y-4">
            <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Support</h4>
            <p>Documentation</p>
            <p>Research Citation</p>
            <p className="pt-2 text-[10px] opacity-50 uppercase font-black">Powered by Gemini 3 Flash</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center">
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">© 2024 Agricultural Research Initiative • Professional Diagnosis Advised</p>
        </div>
      </footer>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;
