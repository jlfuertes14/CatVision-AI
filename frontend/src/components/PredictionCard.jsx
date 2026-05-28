"use client";

/**
 * PredictionCard — Displays the top breed prediction with confidence.
 *
 * @param {Object} props
 * @param {string} props.prediction - Predicted breed name.
 * @param {number} props.confidence - Confidence percentage (0–100).
 */
export default function PredictionCard({ prediction, confidence }) {
  if (!prediction) return null;

  // Format confidence as percentage (backend already returns 0-100 scale)
  const percentage = Number(confidence).toFixed(1);

  return (
    <div className="w-full rounded-[24px] bg-cafe-card border-4 border-cafe-bg/50 p-6 shadow-sm">
      <p className="text-cafe-brown/50 text-xs font-bold uppercase tracking-widest mb-3">
        Prediction Result
      </p>

      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-display font-bold text-cafe-brown capitalize">
          {prediction.replace(/_/g, " ")}
        </h2>
        
        <div className="text-right">
          <div className="text-3xl font-display font-black text-cafe-orange">
            {percentage}%
          </div>
          <div className="text-cafe-brown/60 text-xs font-medium uppercase tracking-wide">
            Match
          </div>
        </div>
      </div>
    </div>
  );
}
