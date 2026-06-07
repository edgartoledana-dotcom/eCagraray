import { useEffect, useRef, useCallback, useState } from "react";

export interface KeystrokeProfile {
  avgKeyInterval: number;
  stdKeyInterval: number;
  avgKeyDuration: number;
  totalKeystrokes: number;
  backspaceRate: number;
}

export interface NavigationProfile {
  pagesPerSession: number;
  avgTimeOnPage: number;
  commonPaths: string[];
}

export interface BiometricsProfile {
  keystroke: KeystrokeProfile;
  navigation: NavigationProfile;
  clickSpeed: number;
  sampleCount: number;
}

interface TimedEvent {
  time: number;
}

interface KeyEvent extends TimedEvent {
  key: string;
  type: "down" | "up";
}

function stdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const sqDiffs = values.map((v) => (v - mean) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / values.length);
}

const STORAGE_KEY = "ecagraray:biometrics_profile";
const MIN_SAMPLES = 20;
const DEVIATION_THRESHOLD = 3.0;

function loadProfile(): BiometricsProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveProfile(p: BiometricsProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {}
}

export function useBiometrics(options?: {
  onAnomalyDetected?: () => void;
  enabled?: boolean;
}) {
  const { onAnomalyDetected, enabled = true } = options || {};

  const keyIntervals = useRef<number[]>([]);
  const keyDurations = useRef<number[]>([]);
  const backspaceCount = useRef(0);
  const totalKeys = useRef(0);
  const lastKeyTime = useRef<number>(0);
  const keyDownTime = useRef<Record<string, number>>({});
  const navStartTime = useRef(Date.now());
  const clickCount = useRef(0);
  const clickStartTime = useRef(Date.now());
  const navCount = useRef(0);
  const navTimes = useRef<number[]>([]);

  const [anomalyScore, setAnomalyScore] = useState(0);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const p = loadProfile();
    if (p && p.sampleCount >= MIN_SAMPLES) {
      setProfileReady(true);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      totalKeys.current++;
      if (e.key === "Backspace") backspaceCount.current++;

      const now = performance.now();
      keyDownTime.current[e.key] = now;
      keyDurations.current.push(now);

      if (lastKeyTime.current > 0) {
        keyIntervals.current.push(now - lastKeyTime.current);
      }
      lastKeyTime.current = now;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const downTime = keyDownTime.current[e.key];
      if (downTime) {
        const dur = performance.now() - downTime;
        if (keyDurations.current.length > 0) {
          keyDurations.current[keyDurations.current.length - 1] = dur;
        }
        delete keyDownTime.current[e.key];
      }
    };

    const handleClick = () => {
      clickCount.current++;
      const elapsed = (Date.now() - clickStartTime.current) / 1000;
      if (elapsed > 60) {
        clickCount.current = 1;
        clickStartTime.current = Date.now();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("click", handleClick);

    const interval = setInterval(() => {
      if (keyIntervals.current.length < MIN_SAMPLES) return;

      const intervals = keyIntervals.current.slice(-100);
      const durations = keyDurations.current.filter((d) => d > 10 && d < 500).slice(-100);

      if (intervals.length < MIN_SAMPLES) return;

      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
      const clickSpeed = clickCount.current / Math.max(1, (Date.now() - clickStartTime.current) / 60000);

      const profile: BiometricsProfile = {
        keystroke: {
          avgKeyInterval: avgInterval,
          stdKeyInterval: stdDev(intervals, avgInterval),
          avgKeyDuration: avgDuration,
          totalKeystrokes: totalKeys.current,
          backspaceRate: totalKeys.current > 0 ? backspaceCount.current / totalKeys.current : 0,
        },
        navigation: {
          pagesPerSession: navCount.current || 1,
          avgTimeOnPage: navTimes.current.length > 0
            ? navTimes.current.reduce((a, b) => a + b, 0) / navTimes.current.length
            : Date.now() - navStartTime.current,
          commonPaths: [],
        },
        clickSpeed,
        sampleCount: intervals.length,
      };

      saveProfile(profile);
      setProfileReady(true);

      const stored = loadProfile();
      if (stored && stored.sampleCount >= MIN_SAMPLES && stored.keystroke.stdKeyInterval > 0) {
        const deviation = Math.abs(avgInterval - stored.keystroke.avgKeyInterval) / stored.keystroke.stdKeyInterval;
        setAnomalyScore(deviation);

        if (deviation > DEVIATION_THRESHOLD) {
          onAnomalyDetected?.();
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("click", handleClick);
      clearInterval(interval);
    };
  }, [enabled, onAnomalyDetected]);

  const recordNavigation = useCallback((path: string, timeMs: number) => {
    navCount.current++;
    navTimes.current.push(timeMs);
    navStartTime.current = Date.now();
  }, []);

  return { anomalyScore, profileReady, recordNavigation };
}
