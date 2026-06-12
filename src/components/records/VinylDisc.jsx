/* The record itself — glossy black vinyl with an oxblood label and a cream
   spindle ring, peeking out from behind a sleeve. A bright inset rim + drop
   shadow lift its silhouette off the dark page so it reads clearly. All
   positioning and the hover transform come in via `className` (callers pass
   `absolute inset-0 …`, which makes this the containing block for the gloss). */
export function VinylDisc({ className = '' }) {
  return (
    <div
      className={`grooves rounded-full shadow-[inset_0_0_0_1.5px_rgba(236,226,207,0.16),inset_0_0_34px_rgba(0,0,0,0.6),0_10px_20px_-8px_rgba(0,0,0,0.7)] ${className}`}
      aria-hidden="true"
    >
      {/* glossy diagonal sweep */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/15 via-transparent to-transparent" />
      {/* label + spindle */}
      <div className="absolute left-1/2 top-1/2 flex h-[36%] w-[36%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-oxblood shadow-[inset_0_0_0_1px_rgba(0,0,0,0.45)]">
        <div className="h-[14%] w-[14%] rounded-full bg-bg-deep shadow-[0_0_0_2px_rgba(236,226,207,0.18)]" />
      </div>
    </div>
  )
}
