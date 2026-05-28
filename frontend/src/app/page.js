"use client";
import { motion, AnimatePresence } from "framer-motion";

import { useState, useEffect, useCallback, useRef } from "react";
import { PawPrint, Menu, X, History } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import PredictionCard from "@/components/PredictionCard";
import BreedProfile from "@/components/BreedProfile";
import BackgroundCat from "@/components/BackgroundCat";
import ConfidenceChart from "@/components/ConfidenceChart";
import ConfidenceGuidance from "@/components/ConfidenceGuidance";
import GradCamPanel from "@/components/GradCamPanel";
import TopBreedComparison from "@/components/TopBreedComparison";
import PredictionHistory from "@/components/PredictionHistory";
import LoadingState from "@/components/LoadingState";
import { predictBreed, getGradcam } from "@/lib/api";

// ---------------------------------------------------------------------------
// localStorage helpers (safe for SSR)
// ---------------------------------------------------------------------------
const HISTORY_KEY = "catvision_history";
const MAX_HISTORY = 8;

function loadHistory() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch { /* quota exceeded — silently ignore */ }
}

/**
 * Create a small thumbnail data-URL from a File for history cards.
 * Resizes to 112×112 to keep localStorage lean.
 */
function createThumbnail(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 112;
      canvas.height = 112;
      const ctx = canvas.getContext("2d");
      // Center-crop
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 112, 112);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
export default function Home() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedModel, setSelectedModel] = useState("gano");
  const [backendOffline, setBackendOffline] = useState(false);

  // Keep the original File so Grad-CAM can re-send it
  const originalFileRef = useRef(null);

  // Grad-CAM state
  const [gradcamUrl, setGradcamUrl] = useState(null);
  const [gradcamLoading, setGradcamLoading] = useState(false);
  const [gradcamError, setGradcamError] = useState(null);

  // Prediction history (persisted to localStorage)
  const [history, setHistory] = useState([]);

  // Menu & Modal state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // -------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------

  const handleUpload = useCallback(async (file) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setGradcamUrl(null);
    setGradcamError(null);
    setBackendOffline(false);

    originalFileRef.current = file;
    const objectUrl = URL.createObjectURL(file);
    setUploadedImage(objectUrl);

    try {
      const data = await predictBreed(file, selectedModel);
      setResult(data);

      // Save to history
      const thumbnail = await createThumbnail(file);
      const entry = {
        id: Date.now(),
        prediction: data.prediction,
        confidence: data.confidence,
        model: selectedModel,
        thumbnail,
      };
      setHistory((prev) => {
        const updated = [entry, ...prev].slice(0, MAX_HISTORY);
        saveHistory(updated);
        return updated;
      });
    } catch (err) {
      const message = err.message || "Something went wrong. Please try again.";
      if (message.includes("offline") || message.includes("Failed to fetch")) {
        setBackendOffline(true);
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel]);

  const handleReset = () => {
    setResult(null);
    setError(null);
    setGradcamUrl(null);
    setGradcamError(null);
    setBackendOffline(false);
    originalFileRef.current = null;
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage);
      setUploadedImage(null);
    }
  };

  const handleUploadError = (msg) => {
    setError(msg);
  };

  const handleTrySample = useCallback(async () => {
    try {
      const response = await fetch("https://media.githubusercontent.com/media/jlfuertes14/CatVision-AI/main/frontend/public/sample-cat.jpg");
      if (!response.ok) throw new Error("Sample image not found.");
      const blob = await response.blob();
      const file = new File([blob], "sample-cat.jpg", { type: "image/jpeg" });
      handleUpload(file);
    } catch {
      setError("Could not load sample image.");
    }
  }, [handleUpload]);

  const handleGenerateGradcam = useCallback(async () => {
    const file = originalFileRef.current;
    if (!file) return;

    setGradcamLoading(true);
    setGradcamError(null);

    try {
      const blob = await getGradcam(file, selectedModel);
      const url = URL.createObjectURL(blob);
      setGradcamUrl(url);
    } catch (err) {
      setGradcamError(err.message || "Failed to generate heatmap.");
    } finally {
      setGradcamLoading(false);
    }
  }, [selectedModel]);


  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-cafe-bg relative overflow-x-hidden flex flex-col items-center justify-center py-4 px-4 sm:px-6">

      {/* Hamburger Menu Button */}
      <button
        onClick={() => setIsMenuOpen(true)}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-40 p-2 text-cafe-brown hover:scale-110 hover:text-cafe-orange transition-all"
      >
        <Menu size={38} strokeWidth={2.5} />
      </button>

      {/* Slide-out Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-cafe-brown/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <div className="relative w-64 h-full bg-cafe-card shadow-2xl flex flex-col p-6 animate-in slide-in-from-left">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-display font-black text-2xl text-cafe-brown">Menu</h2>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-cafe-bg rounded-full text-cafe-brown hover:bg-cafe-light transition-colors"><X size={20} /></button>
            </div>
            <nav className="flex flex-col gap-2">
              <button
                onClick={() => { setIsHistoryModalOpen(true); setIsMenuOpen(false); }}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-lg font-bold text-cafe-brown bg-cafe-bg hover:bg-cafe-light transition-colors"
              >
                <History size={20} />
                Recent Scans
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-cafe-brown/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-cafe-card w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[32px] p-4 pt-14 sm:p-6 sm:pt-16 shadow-2xl relative border-4 border-cafe-bg/50">
            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10 p-2 bg-cafe-light rounded-full text-cafe-brown hover:bg-cafe-orange hover:text-white transition-colors shadow-sm border-2 border-cafe-bg"
            >
              <X size={24} />
            </button>
            <div className="-mt-6">
              <PredictionHistory
                items={history}
                onClear={() => { setHistory([]); saveHistory([]); setIsHistoryModalOpen(false); }}
              />
            </div>
          </div>
        </div>
      )}

      <BackgroundCat />

      {/* Decorative Paws (Background) */}
      <div className="absolute top-10 left-10 text-cafe-brown/5 rotate-[-20deg]">
        <PawPrint size={120} strokeWidth={0} fill="currentColor" />
      </div>
      <div className="absolute bottom-20 right-10 text-cafe-brown/5 rotate-[30deg]">
        <PawPrint size={160} strokeWidth={0} fill="currentColor" />
      </div>

      {/* Backend Offline Banner */}
      {backendOffline && (
        <div className="fixed top-0 inset-x-0 z-50 bg-red-600 text-white text-center py-2 px-4 text-sm font-bold shadow-lg">
          Backend is offline. Start the FastAPI server and try again.
        </div>
      )}

      {/* Main Container */}
      <motion.main 
        layout 
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`relative z-10 w-full ${!result ? "max-w-4xl" : "max-w-[90rem]"}`}
      >

        {/* Cat Silhouette Top Decor */}
        <div className="flex justify-center -mb-1">
          <img src="https://media.githubusercontent.com/media/jlfuertes14/CatVision-AI/main/frontend/public/cat_icon.png" alt="Cat Icon" className="h-[64px] w-auto object-contain relative -z-10" />
        </div>

        {/* The "Olive Green" Cafe Card */}
        <div
          data-cat-exclusion
          className="bg-cafe-green rounded-[32px] shadow-sm border-4 border-cafe-bg/50 p-3 sm:p-5 relative"
        >

          {/* Side Paws overlapping the card */}
          <div className="absolute -left-12 top-1/3 text-cafe-orange rotate-[90deg] drop-shadow-sm">
            <PawPrint size={80} strokeWidth={0} fill="currentColor" />
          </div>
          <div className="absolute -right-12 bottom-1/3 text-cafe-brown rotate-[-90deg] drop-shadow-sm">
            <PawPrint size={80} strokeWidth={0} fill="currentColor" />
          </div>

          {!result && (
            <div className="text-center mb-10">
              <div className="inline-block px-4 py-1.5 bg-cafe-light rounded-full text-cafe-brown text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
                CatVision &bull; AI
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-cafe-light mb-4">
                Upload. Identify. Meow.
              </h1>
              <p className="text-cafe-bg/90 text-lg max-w-md mx-auto">
                Drop a photo of a furry friend to instantly discover their breed.
              </p>
              <div className="flex justify-center mt-6 space-x-2">
                <button
                  onClick={() => setSelectedModel("oxford")}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${selectedModel === "oxford" ? "bg-cafe-brown text-cafe-light" : "bg-cafe-bg/50 text-cafe-light hover:bg-cafe-bg/30"}`}
                >
                  Oxford (12 Breeds)
                </button>
                <button
                  onClick={() => setSelectedModel("gano")}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${selectedModel === "gano" ? "bg-cafe-brown text-cafe-light" : "bg-cafe-bg/50 text-cafe-light hover:bg-cafe-bg/30"}`}
                >
                  Gano (15 Breeds)
                </button>
              </div>
            </div>
          )}

          <motion.div 
            layout 
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`bg-cafe-card rounded-[32px] p-2 sm:p-4 shadow-sm relative z-20 ${!result ? "max-w-3xl mx-auto w-full" : "w-full"}`}
          >
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key="uploader"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                  transition={{ duration: 0.3 }}
                >
                  <ImageUploader
                    onUpload={handleUpload}
                    onError={handleUploadError}
                    onTrySample={handleTrySample}
                    disabled={isLoading}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start w-full p-2">

                  {/* Column 1: Image & Basic Info */}
                  <div className="flex flex-col gap-3 w-full">
                    {/* Uploaded Image Preview */}
                    {uploadedImage && (
                      <div className="w-full relative rounded-2xl overflow-hidden border-4 border-cafe-bg shadow-sm bg-cafe-light h-[260px]">
                        <img
                          src={uploadedImage}
                          alt="Uploaded Cat"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <PredictionCard
                      prediction={result.prediction}
                      confidence={result.confidence}
                    />
                    <ConfidenceGuidance confidence={result.confidence} />
                  </div>

                  {/* Column 2: Data & Profiles */}
                  <div className="flex flex-col gap-3 w-full">
                    <ConfidenceChart topPredictions={result.top_predictions} />
                    <BreedProfile metadata={result.metadata} />
                  </div>

                  {/* Column 3: Explainability & Actions */}
                  <div className="flex flex-col gap-3 w-full h-full justify-between">
                    <GradCamPanel
                      imageUrl={uploadedImage}
                      heatmapUrl={gradcamUrl}
                      isLoading={gradcamLoading}
                      error={gradcamError}
                      onGenerate={handleGenerateGradcam}
                    />

                    {/* Reset Button (Bottom of Col 3) */}
                    <div className="flex justify-center mt-auto">
                      <button
                        onClick={handleReset}
                        className="w-full py-3 rounded-full bg-cafe-brown text-cafe-bg font-bold text-lg
                                 hover:bg-cafe-orange hover:scale-[0.98] transition-all shadow-md"
                      >
                        Scan another cat
                      </button>
                    </div>
                  </div>
                </div>

                {/* Full Width Comparisons (Below Grid) */}
                {result.top_predictions?.length > 1 && (
                  <div className="w-full mt-3 px-2 pb-1">
                    <TopBreedComparison
                      topPredictions={result.top_predictions}
                      breeds={result.breeds || {}}
                    />
                  </div>
                )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-30 bg-cafe-card/80 backdrop-blur-sm rounded-[32px] flex items-center justify-center">
                <LoadingState />
              </div>
            )}
          </motion.div>

        </div>

        {/* Inline Error State */}
        {error && !backendOffline && (
          <div className="mt-6 w-full max-w-md mx-auto rounded-2xl bg-red-50 border border-red-200 p-4 text-center">
            <p className="text-red-800 text-sm font-bold">{error}</p>
          </div>
        )}

      </motion.main>
    </div>
  );
}
