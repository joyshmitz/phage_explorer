import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry);
    onINP(onPerfEntry);
    onLCP(onPerfEntry);
    onFCP(onPerfEntry);
    onTTFB(onPerfEntry);
  } else {
    // Default: log to console in development
    if (import.meta.env.DEV) {
      onCLS(console.log);
      onINP(console.log);
      onLCP(console.log);
      onFCP(console.log);
      onTTFB(console.log);
    }
  }
};

export default reportWebVitals;
