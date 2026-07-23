// apps/web/src/components/shared/RequireDesktop.jsx
import { useState } from "react";
import { isMobileDevice } from "../../utils/isMobileDevice";
import DesktopOnlyNotice from "../../Hero/DesktopOnlyNotice";

/**
 * Wrap any route's element with this to block mobile/tablet devices,
 * showing DesktopOnlyNotice instead. Detection is OS/UA based (see
 * isMobileDevice.js), not viewport-width based — resizing a desktop
 * browser window narrow never triggers this.
 */
export default function RequireDesktop({ children }) {
  const [blocked] = useState(() => isMobileDevice());
  if (blocked) return <DesktopOnlyNotice />;
  return children;
}