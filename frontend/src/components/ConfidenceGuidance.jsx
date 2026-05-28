"use client";

export default function ConfidenceGuidance({ confidence }) {
  const score = Number(confidence) || 0;

  const guidance =
    score >= 80
      ? {
          title: "Strong match",
          copy: "The model found a clear visual signal for this breed.",
          tone: "bg-cafe-green/10 text-cafe-brown border-cafe-green/20",
        }
      : score >= 55
        ? {
            title: "Promising match",
            copy: "Worth trusting as a lead, but another angle could confirm it.",
            tone: "bg-cafe-orange/10 text-cafe-brown border-cafe-orange/20",
          }
        : {
            title: "Not sure yet",
            copy: "Try a brighter face-forward photo with the full ears and coat visible.",
            tone: "bg-red-50 text-red-900 border-red-200",
          };

  return (
    <div className={`rounded-[20px] border p-4 ${guidance.tone}`}>
      <p className="text-xs font-black uppercase tracking-widest opacity-60">
        Confidence guidance
      </p>
      <p className="mt-1 font-display text-lg font-black">{guidance.title}</p>
      <p className="mt-1 text-sm leading-relaxed opacity-80">{guidance.copy}</p>
    </div>
  );
}
