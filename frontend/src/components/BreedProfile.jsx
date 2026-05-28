"use client";

/**
 * BreedProfile — Displays breed metadata (origin, temperament, lifespan).
 *
 * @param {Object} props
 * @param {Object} props.metadata - Breed metadata object.
 * @param {string} props.metadata.description - Breed description.
 * @param {string} props.metadata.origin - Country of origin.
 * @param {string} props.metadata.temperament - Temperament traits.
 * @param {string} props.metadata.lifespan - Expected lifespan.
 */
export default function BreedProfile({ metadata }) {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  const fields = [
    { label: "Origin", value: metadata.origin, icon: "🌍" },
    { label: "Temperament", value: metadata.temperament, icon: "💜" },
    { label: "Lifespan", value: metadata.lifespan, icon: "⏳" },
  ];

  return (
    <div className="w-full h-full rounded-[24px] bg-cafe-card border-4 border-cafe-bg/50 p-6 shadow-sm">
      <p className="text-cafe-brown/50 font-bold text-xs uppercase tracking-widest mb-3">
        Breed Profile
      </p>

      {metadata.description && (
        <p className="text-cafe-brown/80 text-sm leading-relaxed mb-5">
          {metadata.description}
        </p>
      )}

      <div className="space-y-3">
        {fields.map(
          (field) =>
            field.value && (
              <div key={field.label} className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{field.icon}</span>
                <div>
                  <p className="text-cafe-brown/40 text-xs uppercase tracking-wide">
                    {field.label}
                  </p>
                  <p className="text-cafe-brown/90 text-sm">{field.value}</p>
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}
