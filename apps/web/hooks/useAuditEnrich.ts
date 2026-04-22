'use client';
import { useState, useCallback } from 'react';
import type { AuditFlag } from '@/lib/types';

interface EnrichResult {
  ai_headline?: string;
  ai_narrative?: string;
  ai_questions?: string[];
  ai_risk_assessment?: string;
  ai_comparable?: string | null;
}

export function useAuditEnrich(finding: AuditFlag) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnrichResult | null>(
    // Use pre-enriched data if available
    finding.ai_headline ? {
      ai_headline: finding.ai_headline,
      ai_narrative: finding.ai_narrative,
      ai_questions: finding.ai_questions,
      ai_risk_assessment: finding.ai_risk_assessment,
      ai_comparable: finding.ai_comparable,
    } : null
  );
  const [error, setError] = useState<string | null>(null);
  const [rawStream, setRawStream] = useState('');

  const enrich = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setRawStream('');

    try {
      const resp = await fetch('/api/audit/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finding }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(err.error ?? resp.statusText);
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setRawStream(accumulated);
      }

      // Parse JSON from accumulated stream
      let jsonStr = accumulated.trim();
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1];
        if (jsonStr.startsWith('json')) jsonStr = jsonStr.slice(4);
      }
      const parsed: EnrichResult = JSON.parse(jsonStr);
      setResult(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [finding, loading]);

  return { enrich, loading, result, error, rawStream };
}
