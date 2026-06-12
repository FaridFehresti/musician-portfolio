/* Full-viewport film grain — mounted once in the shell. Pure CSS (see
   .grain in globals.css); hidden automatically under reduced motion. */
export function GrainOverlay() {
  return <div className="grain" aria-hidden="true" />
}
