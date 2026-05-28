"use client";

export default function GradCamPanel({ imageUrl, heatmapUrl, isLoading, error, onGenerate }) {
  return (
    <div className="w-full h-full flex flex-col rounded-[24px] bg-cafe-card border-4 border-cafe-bg/50 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <p className="text-cafe-brown/50 font-bold text-xs uppercase tracking-widest">
            Explainable AI
          </p>
          <h3 className="mt-1 font-display text-xl font-black text-cafe-brown">
            Grad-CAM focus map
          </h3>
          <p className="mt-1 text-sm text-cafe-brown/65 max-w-lg">
            See which image regions influenced the model most.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-full bg-cafe-brown text-cafe-light text-sm font-bold hover:bg-cafe-orange disabled:opacity-60 transition-colors"
        >
          {heatmapUrl ? "Refresh heatmap" : "Generate heatmap"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-bold text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
        <figure className="rounded-[18px] overflow-hidden bg-cafe-bg border border-cafe-brown/10 flex flex-col h-full">
          <div className="flex-grow w-full relative">
            {imageUrl && (
              <img src={imageUrl} alt="Original uploaded cat" className="absolute inset-0 w-full h-full object-cover" />
            )}
          </div>
          <figcaption className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-cafe-brown/50">
            Original
          </figcaption>
        </figure>

        <figure className="rounded-[18px] overflow-hidden bg-cafe-bg border border-cafe-brown/10 flex flex-col h-full">
          <div className="flex-grow w-full relative flex items-center justify-center min-h-[140px]">
            {isLoading ? (
              <p className="text-sm font-bold text-cafe-brown/60">Building heatmap...</p>
            ) : heatmapUrl ? (
              <img src={heatmapUrl} alt="Grad-CAM heatmap overlay" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <p className="px-6 text-center text-sm font-bold text-cafe-brown/50">
                Generate a heatmap after prediction.
              </p>
            )}
          </div>
          <figcaption className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-cafe-brown/50">
            Regions influencing prediction
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
