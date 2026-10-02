import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
export function useReducedMotion() {
  // Avoid an initial animation before the accessibility preference is known.
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduced(value); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}
