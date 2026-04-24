// core web vitals — mede LCP, CLS, TTFB, INP
// por enquanto loga no console; no futuro pode enviar via sendBeacon
// nota: onFID foi removido no web-vitals v4 — substituído por onINP
import { onLCP, onCLS, onTTFB, onINP, type Metric } from 'web-vitals';

function sendToAnalytics ( metric: Metric )
{
  if ( import.meta.env.DEV )
  {
    console.log(
      `[Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`
    );
  }
}

export function reportWebVitals ()
{
  onLCP(sendToAnalytics);
  onCLS(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onINP(sendToAnalytics);
}
