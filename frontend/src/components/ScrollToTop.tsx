import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const location = useLocation();

  // Scroll to the very top whenever the route changes. Also react to hash
  // changes so any programmatic navigation that only changes the fragment
  // still resets the scroll to the top of the page.
  useEffect(() => {
    try {
      // Instant scroll to top to ensure redirected pages start at the top
      window.scrollTo({ top: 0, left: 0 });
    } catch (e) {
      // Fallback for older browsers
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash, location.key]);

  return null;
}
