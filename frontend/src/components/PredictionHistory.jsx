"use client";

const formatBreedName = (name = "") =>
  name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export default function PredictionHistory({ items = [], onClear }) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 sm:p-14">
        <div className="bg-cafe-light rounded-full p-4 mb-5 shadow-sm border-2 border-cafe-bg">
          <span className="text-5xl" role="img" aria-label="Cat">🐱</span>
        </div>
        <h3 className="font-display font-black text-2xl text-cafe-brown mb-3">No Recent Scans</h3>
        <p className="text-cafe-brown/70 text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
          Your scanned cats will appear here. They are saved securely in your local browser!
        </p>
      </div>
    );
  }

  return (
    <aside className="mt-6 rounded-[28px] bg-cafe-light border-4 border-cafe-bg/70 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-cafe-brown/50 font-bold text-xs uppercase tracking-widest">
            Recent scans
          </p>
          <p className="text-sm text-cafe-brown/70">Saved on this browser only.</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-black uppercase tracking-widest text-cafe-brown/50 hover:text-cafe-orange"
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="flex items-center gap-3 rounded-[18px] bg-cafe-card p-3 border border-cafe-brown/10"
          >
            {item.thumbnail && (
              <img
                src={item.thumbnail}
                alt=""
                className="h-14 w-14 rounded-xl object-cover bg-cafe-bg"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-cafe-brown">
                {formatBreedName(item.prediction)}
              </p>
              <p className="text-xs text-cafe-brown/55">
                {Number(item.confidence).toFixed(1)}% with {item.model}
              </p>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
