import { pushNotification } from "./notify";
import { getItem, setItem } from "./store";

const WEATHER_LAT = 13.6094;
const WEATHER_LON = 124.3111;
const WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=Asia%2FManila&forecast_days=3`;

export interface WeatherCurrent {
  temperature_2m: number;
  apparent_temperature: number;
  weather_code: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  precipitation: number;
}

export interface WeatherDaily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
}

export interface WeatherData {
  current: WeatherCurrent;
  daily: WeatherDaily;
}

export interface WeatherCondition {
  label: string;
  icon: string;
  tone: string;
  severity: "none" | "low" | "moderate" | "high" | "critical";
}

const WMO_CODES: Record<number, WeatherCondition> = {
  0:  { label: "Clear sky", icon: "Sun", tone: "#F59E0B", severity: "none" },
  1:  { label: "Mainly clear", icon: "Sun", tone: "#F59E0B", severity: "none" },
  2:  { label: "Partly cloudy", icon: "Cloud", tone: "#94A3B8", severity: "none" },
  3:  { label: "Overcast", icon: "Cloud", tone: "#94A3B8", severity: "none" },
  45: { label: "Foggy", icon: "CloudFog", tone: "#94A3B8", severity: "low" },
  48: { label: "Depositing rime fog", icon: "CloudFog", tone: "#94A3B8", severity: "low" },
  51: { label: "Light drizzle", icon: "CloudDrizzle", tone: "#0EA5E9", severity: "low" },
  53: { label: "Moderate drizzle", icon: "CloudDrizzle", tone: "#0EA5E9", severity: "low" },
  55: { label: "Dense drizzle", icon: "CloudDrizzle", tone: "#0EA5E9", severity: "moderate" },
  56: { label: "Freezing drizzle", icon: "CloudDrizzle", tone: "#0EA5E9", severity: "moderate" },
  57: { label: "Dense freezing drizzle", icon: "CloudDrizzle", tone: "#0EA5E9", severity: "high" },
  61: { label: "Slight rain", icon: "CloudRain", tone: "#2563EB", severity: "low" },
  63: { label: "Moderate rain", icon: "CloudRain", tone: "#2563EB", severity: "moderate" },
  65: { label: "Heavy rain", icon: "CloudRain", tone: "#2563EB", severity: "high" },
  66: { label: "Freezing rain", icon: "CloudRain", tone: "#7C3AED", severity: "high" },
  67: { label: "Heavy freezing rain", icon: "CloudRain", tone: "#7C3AED", severity: "critical" },
  71: { label: "Slight snow", icon: "CloudSnow", tone: "#38BDF8", severity: "low" },
  73: { label: "Moderate snow", icon: "CloudSnow", tone: "#38BDF8", severity: "moderate" },
  75: { label: "Heavy snow", icon: "CloudSnow", tone: "#38BDF8", severity: "high" },
  80: { label: "Slight showers", icon: "CloudRain", tone: "#0EA5E9", severity: "low" },
  81: { label: "Moderate showers", icon: "CloudRain", tone: "#0EA5E9", severity: "moderate" },
  82: { label: "Violent showers", icon: "CloudRain", tone: "#0EA5E9", severity: "critical" },
  85: { label: "Slight snow showers", icon: "CloudSnow", tone: "#38BDF8", severity: "low" },
  86: { label: "Heavy snow showers", icon: "CloudSnow", tone: "#38BDF8", severity: "high" },
  95: { label: "Thunderstorm", icon: "CloudLightning", tone: "#EF4444", severity: "high" },
  96: { label: "Thunderstorm with slight hail", icon: "CloudLightning", tone: "#EF4444", severity: "critical" },
  99: { label: "Thunderstorm with heavy hail", icon: "CloudLightning", tone: "#EF4444", severity: "critical" },
};

export function describeWeather(code: number): WeatherCondition {
  return WMO_CODES[code] || { label: "Unknown", icon: "Cloud", tone: "#94A3B8", severity: "none" };
}

export interface AutoAlertConfig {
  enabled: boolean;
  thunderstormThreshold: boolean;
  rainThreshold: number;
  windThreshold: number;
  heatThreshold: number;
  coldThreshold: number;
}

export const DEFAULT_ALERT_CONFIG: AutoAlertConfig = {
  enabled: true,
  thunderstormThreshold: true,
  rainThreshold: 10,
  windThreshold: 40,
  heatThreshold: 38,
  coldThreshold: 10,
};

const TRIGGERED_KEY = "ecagraray:auto_alert_triggers";

type TriggerKey = "thunderstorm" | "heavy_rain" | "high_wind" | "extreme_heat" | "extreme_cold" | "freezing_rain" | "flash_flood";

interface AutoAlertLog {
  trigger: TriggerKey;
  checkedAt: string;
  expiresAt: string;
  details: string;
}

function getTriggeredLog(): AutoAlertLog[] {
  return getItem<AutoAlertLog[]>("auto_alert_triggers", []);
}

function setTriggeredLog(log: AutoAlertLog[]) {
  const now = Date.now();
  const fresh = log.filter((l) => now < new Date(l.expiresAt).getTime());
  setItem("auto_alert_triggers", fresh.slice(-20));
}

function isRecentlyTriggered(trigger: TriggerKey): boolean {
  return getTriggeredLog().some((l) => l.trigger === trigger && Date.now() < new Date(l.expiresAt).getTime());
}

function markTriggered(trigger: TriggerKey, details: string) {
  const now = new Date();
  const expires = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const log: AutoAlertLog = { trigger, checkedAt: now.toISOString(), expiresAt: expires.toISOString(), details };
  const existing = getTriggeredLog().filter((l) => l.trigger !== trigger);
  setTriggeredLog([...existing, log]);
}

export interface AutoAlertResult {
  generated: boolean;
  triggers: Array<{ trigger: TriggerKey; title: string; level: string; type: string }>;
  weather: WeatherData | null;
}

export async function checkWeatherAndAutoAlert(config?: Partial<AutoAlertConfig>): Promise<AutoAlertResult> {
  const cfg = { ...DEFAULT_ALERT_CONFIG, ...config };
  const result: AutoAlertResult = { generated: false, triggers: [], weather: null };

  try {
    const res = await fetch(WEATHER_URL);
    if (!res.ok) return result;
    const json = (await res.json()) as WeatherData;
    result.weather = json;

    if (!cfg.enabled) return result;

    const c = json.current;
    const condition = describeWeather(c.weather_code);
    const triggers: Array<{ trigger: TriggerKey; title: string; level: string; type: string }> = [];

    if (cfg.thunderstormThreshold && (condition.severity === "critical" || condition.severity === "high") && c.weather_code >= 95) {
      const trigger: TriggerKey = c.weather_code >= 96 ? "freezing_rain" : "thunderstorm";
      if (!isRecentlyTriggered(trigger)) {
        const isHail = c.weather_code >= 96;
        triggers.push({
          trigger,
          title: isHail ? "Severe Thunderstorm with Hail Warning" : "Thunderstorm Warning",
          level: isHail ? "Critical" : "High",
          type: "Thunderstorm",
        });
      }
    }

    if (cfg.rainThreshold > 0 && c.precipitation >= cfg.rainThreshold) {
      if (!isRecentlyTriggered("heavy_rain")) {
        const isFlashFlood = c.precipitation >= cfg.rainThreshold * 2;
        triggers.push({
          trigger: isFlashFlood ? "flash_flood" : "heavy_rain",
          title: isFlashFlood ? "Flash Flood Warning" : "Heavy Rainfall Alert",
          level: isFlashFlood ? "Critical" : "High",
          type: isFlashFlood ? "Flood" : "Flood",
        });
      }
    }

    if (cfg.windThreshold > 0 && c.wind_speed_10m >= cfg.windThreshold) {
      if (!isRecentlyTriggered("high_wind")) {
        const isStorm = c.wind_speed_10m >= cfg.windThreshold * 1.5;
        triggers.push({
          trigger: "high_wind",
          title: isStorm ? "Storm Force Wind Warning" : "Strong Wind Advisory",
          level: isStorm ? "Critical" : "Moderate",
          type: "Emergency",
        });
      }
    }

    if (cfg.heatThreshold > 0 && c.temperature_2m >= cfg.heatThreshold) {
      if (!isRecentlyTriggered("extreme_heat")) {
        triggers.push({
          trigger: "extreme_heat",
          title: "Extreme Heat Warning",
          level: "High",
          type: "Emergency",
        });
      }
    }

    if (cfg.coldThreshold > 0 && c.temperature_2m <= cfg.coldThreshold) {
      if (!isRecentlyTriggered("extreme_cold")) {
        triggers.push({
          trigger: "extreme_cold",
          title: "Extreme Cold Advisory",
          level: "Moderate",
          type: "Emergency",
        });
      }
    }

    if (triggers.length > 0) {
      result.generated = true;
      for (const t of triggers) {
        markTriggered(t.trigger, t.title);
        result.triggers.push(t);
        pushNotification({
          title: t.title,
          message: `${t.type} alert: ${t.title}. Conditions: ${condition.label}, ${c.temperature_2m}°C, wind ${c.wind_speed_10m} km/h, precipitation ${c.precipitation} mm. Take necessary precautions.`,
          type: "alert",
        });
      }
    }

    return result;
  } catch {
    return result;
  }
}

export function getStoredWeatherData(): WeatherData | null {
  try {
    const raw = localStorage.getItem("ecagraray:cached_weather");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: WeatherData; timestamp: string };
    const age = Date.now() - new Date(parsed.timestamp).getTime();
    if (age > 30 * 60 * 1000) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function setStoredWeatherData(data: WeatherData) {
  try {
    localStorage.setItem("ecagraray:cached_weather", JSON.stringify({ data, timestamp: new Date().toISOString() }));
  } catch {
  }
}

export function clearAutoAlertMemory() {
  setItem("auto_alert_triggers", []);
}
