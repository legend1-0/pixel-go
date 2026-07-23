// apps/web/src/Hero/DesktopOnlyNotice.jsx
import "./DesktopOnlyNotice.css";

export default function DesktopOnlyNotice() {
  return (
    <div className="desktop-only-notice">
      <div className="desktop-only-notice__card">
        <h1>Oops!</h1>
        <p>Pixel Go is only available on desktop right now.</p>
        <p className="desktop-only-notice__hint">
          Pixel art needs precision — mouse and keyboard, not touch. Open this page on a computer to start creating.
        </p>
      </div>
    </div>
  );
}