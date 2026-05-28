"use client";

const formatBreedName = (name = "") =>
  name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default function TopBreedComparison({ topPredictions = [], breeds = {} }) {
  if (!topPredictions.length) return null;

  return (
    <div className="w-full rounded-[24px] bg-cafe-card border-4 border-cafe-bg/50 p-6 shadow-sm">
      <p className="text-cafe-brown/50 font-bold text-xs uppercase tracking-widest mb-4">
        Breed comparison
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {topPredictions.map((item, index) => {
          const metadata = breeds[item.breed] || {};
          return (
            <article
              key={item.breed}
              className="rounded-[18px] bg-cafe-bg/55 p-4 border border-cafe-brown/10"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-cafe-brown/40 text-xs font-black uppercase tracking-widest">
                    #{index + 1}
                  </p>
                  <h3 className="mt-1 font-display font-black text-cafe-brown leading-tight">
                    {formatBreedName(item.breed)}
                  </h3>
                </div>
                <span className="text-cafe-orange font-black tabular-nums">
                  {Number(item.confidence).toFixed(0)}%
                </span>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                {metadata.origin && (
                  <div>
                    <dt className="text-cafe-brown/40 text-[11px] uppercase tracking-widest font-bold">
                      Origin
                    </dt>
                    <dd className="text-cafe-brown/80">{metadata.origin}</dd>
                  </div>
                )}
                {metadata.temperament && (
                  <div>
                    <dt className="text-cafe-brown/40 text-[11px] uppercase tracking-widest font-bold">
                      Temperament
                    </dt>
                    <dd className="text-cafe-brown/80">{metadata.temperament}</dd>
                  </div>
                )}
              </dl>
            </article>
          );
        })}
      </div>
    </div>
  );
}
