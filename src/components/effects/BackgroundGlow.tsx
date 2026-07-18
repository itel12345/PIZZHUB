/**
 * BackgroundGlow
 *
 * Renders the fixed, full-screen container for the animated
 * background glow system, along with four empty glow elements.
 *
 * No styling logic lives here — all visual treatment (position,
 * color, blur, animation) is applied separately in globals.css
 * using the class names below and the glow tokens from Layer 4A.
 */
export default function BackgroundGlow() {
  return (
    <div className="glow-container" aria-hidden="true">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="glow glow-three" />
      <div className="glow glow-four" />
    </div>
  );
}