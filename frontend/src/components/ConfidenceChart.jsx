"use client";

/**
 * ConfidenceChart — Horizontal bar chart showing top-k predictions.
 *
 * @param {Object} props
 * @param {Array<{breed: string, confidence: number}>} props.topPredictions
 */
export default function ConfidenceChart({ topPredictions }) {
  if (!topPredictions || topPredictions.length === 0) return null;

  // Format breed name: "maine_coon" → "Maine Coon"
  const formatBreedName = (name) =>
    name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  // Bar color gradient based on rank
  const barColors = [
    "bg-cafe-brown",
    "bg-cafe-brown/60",
    "bg-cafe-brown/30",
  ];

  return (
    <div className="w-full rounded-[24px] bg-cafe-card border-4 border-cafe-bg/50 p-6 shadow-sm">
      <p className="text-cafe-brown/50 font-bold text-xs uppercase tracking-widest mb-4">
        Top Matches
      </p>

      <div className="flex flex-col gap-3">
        {topPredictions.map((item, index) => {
          const colorClass = barColors[index] || "bg-cafe-brown/20";
          const percentage = Number(item.confidence).toFixed(1);
          
          return (
            <div key={item.breed} className="flex flex-col gap-1">
              <div className="flex justify-between items-end">
                <span className="text-cafe-brown/90 text-sm font-bold capitalize">
                  {item.breed.replace(/_/g, " ")}
                </span>
                <span className="text-cafe-brown/60 font-medium text-xs tabular-nums">
                  {percentage}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-cafe-bg overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full ${colorClass} transition-all duration-700 ease-out`}
                  style={{ width: `${item.confidence}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
