import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Bot, X, Send, Sparkles, Zap, Brain, MessageCircle, Mic, Volume2, Loader2, ChevronRight, Lightbulb, BarChart3, Calendar, Users, FileText, AlertTriangle, Phone, MapPin, Mail, Building2, Clock, Star, TrendingUp, Shield, Cloud, CloudRain, Sun, Wind, Wand2, RotateCcw, GripHorizontal } from "lucide-react";
import { askAI, pingAI } from "../lib/api/ai.functions";
import { useAnimatedMount } from "./ui-kit";

type Language = "en" | "fil" | "bik";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actions?: QuickAction[];
  data?: any;
  typing?: boolean;
  confidence?: number;
  intent?: string;
  sources?: string[];
}

interface QuickAction {
  label: string;
  icon: any;
  href?: string;
  onClick?: () => void;
}

export interface AIContext {
  lang: Language;
  stats?: { residents: number; households: number; volunteers: number; events: number };
  info?: { name?: string; municipality?: string; province?: string; address?: string; contact?: string; captain?: string };
  activeAlerts?: any[];
  announcements?: any[];
  officials?: any[];
  weather?: { temp: number; condition: string; description: string } | null;
  isLoggedIn: boolean;
  userName?: string;
  userRole?: string;
  residents?: any[];
  households?: any[];
  volunteers?: any[];
  events?: any[];
  documents?: any[];
  incidents?: any[];
  evacCenters?: any[];
}

interface ConversationMemory {
  lastIntent?: string;
  lastTopic?: string;
  lastEntities?: Record<string, string>;
  lastUserMessage?: string;
  messageCount: number;
  topics: string[];
  followUps: string[];
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "am",
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
  "my", "your", "his", "its", "our", "their", "this", "that", "these", "those",
  "to", "of", "in", "on", "at", "by", "for", "with", "about", "as", "into",
  "and", "or", "but", "if", "so", "not", "no", "do", "does", "did", "can", "could",
  "will", "would", "should", "may", "might", "must",
  "ang", "ng", "sa", "mga", "na", "pa", "po",
  "an", "sa", "mga", "na", "pa",
]);

const SYNONYMS: Record<string, string[]> = {
  clearance: ["cert", "certificate", "brgy clearance", "barangay clearance"],
  document: ["paper", "papers", "form", "request", "id"],
  residency: ["residing", "residence", "address proof", "tirahan"],
  indigency: ["indigent", "poor", "low income", "financial assistance"],
  permit: ["business permit", "license"],
  alert: ["warning", "emergency", "danger", "advisory", "notice"],
  typhoon: ["bagyo", "storm", "hurricane"],
  flood: ["baha", "flooding", "inundation"],
  earthquake: ["lindol", "quake", "tremor"],
  evacuation: ["evacuate", "shelter", "safe place", "refuge"],
  weather: ["panahon", "forecast", "climate", "temperature"],
  hotline: ["hotlines", "contact number", "phone number"],
  captain: ["kapitan", "punong barangay", "head", "leader"],
  officials: ["kagawad", "council", "councilors", "leaders", "elected"],
  purok: ["zone", "sitio", "area", "district"],
  volunteer: ["boluntaryo", "helper", "contributor"],
  event: ["gathering", "activity", "program", "assembly", "meeting"],
  senior: ["elderly", "old", "matatanda", "lola", "lolo"],
  youth: ["kabataan", "young", "sk", "teen"],
  pwd: ["disabled", "disability", "kapansanan"],
  resident: ["residente", "tao", "people", "citizen"],
  household: ["family", "pamilya", "home", "house"],
  population: ["bilang", "count", "demographics", "census"],
  complaint: ["reklamo", "sumbong", "report", "problema"],
};

const greetings: Record<Language, string> = {
  en: "Hello! I'm Cagri, your AI assistant for Barangay Cagraray. I can help you with document requests, disaster alerts, community services, and more. How can I assist you today?",
  fil: "Kumusta! Ako si Cagri, ang iyong AI assistant para sa Barangay Cagraray. Matutulungan kita sa mga dokumento, alerto, serbisyo, at iba pa. Paano kita matutulungan ngayon?",
  bik: "Marhay! Ako si Cagri, an saimong AI assistant para sa Barangay Cagraray. Makatutabang ako saimo sa mga dokumento, alerto, serbisyo, asin iba pa. Paano tada makatabang saimo ngonyan?",
};

const taglines: Record<Language, string> = {
  en: "Powered by AI",
  fil: "Pinapagana ng AI",
  bik: "Pinapagana nin AI",
};

// Suggested follow-ups per intent — context-aware next-question chips.
const FOLLOW_UPS: Record<string, { en: string[]; fil: string[]; bik: string[] }> = {
  clearance:        { en: ["What are the requirements?", "How long does it take?", "How much is the fee?"], fil: ["Ano ang mga kailangan?", "Gaano katagal?", "Magkano ang bayad?"], bik: ["Anu an mga kaipohan?", "Gaano katagal?", "Magkano an bayad?"] },
  residency:        { en: ["How long is it valid?", "Is it free?", "Can I get it online?"], fil: ["Gaano katagal ang validity?", "Libre ba ito?", "Pwede bang online?"], bik: ["Gaano katagal an validity?", "Libre ba ini?", "Pwede online?"] },
  indigency:        { en: ["What is it used for?", "Who can request it?", "How to file online?"], fil: ["Para saan ito?", "Sino ang pwedeng humingi?", "Paano mag-file online?"], bik: ["Para saen ini?", "Sinu an pwedeng humingi?", "Paano mag-file online?"] },
  business_permit:  { en: ["What documents do I need?", "How much is the fee?", "How long to process?"], fil: ["Anong dokumento ang kailangan?", "Magkano ang bayad?", "Gaano katagal?"], bik: ["Anong dokumento an kaipohan?", "Magkano an bayad?", "Gaano katagal?"] },
  alert:            { en: ["Where are the evacuation centers?", "What should I prepare?", "How to stay updated?"], fil: ["Nasaan ang mga evacuation center?", "Ano ang dapat ihanda?", "Paano mag-stay updated?"], bik: ["Nasaen an mga evacuation center?", "Anu an dapat ihanda?", "Paano mag-stay updated?"] },
  evacuation:       { en: ["What should I bring?", "Is it safe to go home yet?", "Where is the nearest one?"], fil: ["Ano ang dapat dalhin?", "Ligtas na bang umuwi?", "Nasaan ang pinakamalapit?"], bik: ["Anu an dapat dalhin?", "Ligtas na bang umuwi?", "Nasaen an pinakamalapit?"] },
  weather:          { en: ["Will it rain tomorrow?", "Is there a typhoon coming?", "What about next week?"], fil: ["Uulan ba bukas?", "May bagyo ba paparating?", "Ano sa susunod na linggo?"], bik: ["Uulan ba bukas?", "May bagyo ba yaon duman?", "Anu sa masunod na linggo?"] },
  captain:          { en: ["Who are the kagawads?", "What are the office hours?", "How to contact the office?"], fil: ["Sino ang mga kagawad?", "Ano ang office hours?", "Paano makipag-ugnayan?"], bik: ["Sinu an mga kagawad?", "Anu an office hours?", "Paano makipag-ugnayan?"] },
  officials:        { en: ["Who is the captain?", "What are their roles?", "When is the next session?"], fil: ["Sino ang kapitan?", "Ano ang kanilang mga tungkulin?", "Kailan ang susunod na session?"], bik: ["Sinu an kapitan?", "Anu an mga tungkulin?", "Kailan an masunod na session?"] },
  register:         { en: ["What do I need to register?", "Is it free?", "How long does approval take?"], fil: ["Ano ang kailangan para mag-register?", "Libre ba?", "Gaano katagal ang approval?"], bik: ["Anu an kaipohan para mag-register?", "Libre ba?", "Gaano katagal an approval?"] },
  document_request: { en: ["Barangay Clearance", "Residency Certificate", "Indigency Certificate"], fil: ["Barangay Clearance", "Residency Certificate", "Indigency Certificate"], bik: ["Barangay Clearance", "Residency Certificate", "Indigency Certificate"] },
  stats:            { en: ["How many households?", "How many volunteers?", "Population growth?"], fil: ["Ilang household?", "Ilang boluntaryo?", "Paglaki ng populasyon?"], bik: ["Ilang household?", "Ilang boluntaryo?", "Paglaki kan populasyon?"] },
  services:         { en: ["Document services", "Emergency alerts", "Community events"], fil: ["Mga serbisyo", "Mga alerto", "Mga event"], bik: ["Mga serbisyo", "Mga alerto", "Mga event"] },
  default:          { en: ["Document services", "Active alerts", "Who is the captain?"], fil: ["Mga serbisyo", "Mga alerto", "Sino ang kapitan?"], bik: ["Mga serbisyo", "Mga alerto", "Sinu an kapitan?"] },
};

function getFollowUps(intent: string, lang: Language): string[] {
  const u = FOLLOW_UPS[intent] ?? FOLLOW_UPS.default;
  return u[lang] ?? u.en;
}

// Quick-replies shown on first open.
const QUICK_REPLIES: Record<Language, { label: string; icon: any; prompt: string }[]> = {
  en: [
    { label: "Get a document",  icon: FileText,       prompt: "How do I request a barangay clearance?" },
    { label: "Active alerts",   icon: AlertTriangle,  prompt: "What are the active alerts right now?" },
    { label: "Who is captain?", icon: Users,          prompt: "Who is the current barangay captain?" },
    { label: "Weather today",   icon: Cloud,          prompt: "What is the weather right now?" },
  ],
  fil: [
    { label: "Mag-request",     icon: FileText,       prompt: "Paano mag-request ng barangay clearance?" },
    { label: "Mga alerto",      icon: AlertTriangle,  prompt: "Ano ang mga aktibong alerto ngayon?" },
    { label: "Sino ang kapitan?", icon: Users,        prompt: "Sino ang kasalukuyang kapitan ng barangay?" },
    { label: "Panahon ngayon",  icon: Cloud,          prompt: "Ano ang panahon ngayon?" },
  ],
  bik: [
    { label: "Magingge",        icon: FileText,       prompt: "Paano magingge nin barangay clearance?" },
    { label: "Mga alerto",      icon: AlertTriangle,  prompt: "Anu an mga aktibong alerto ngonyan?" },
    { label: "Sinu an kapitan?", icon: Users,         prompt: "Sinu an kapitan ngonyan?" },
    { label: "Panahon ngonyan", icon: Cloud,          prompt: "Anu an panahon ngonyan?" },
  ],
};

function detectLanguage(text: string): "en" | "fil" | "bik" | "unknown" {
  const lower = text.toLowerCase();
  const filWords = ["ang", "ng", "mga", "sa", "na", "pa", "po", "ako", "ikaw", "siya", "kami", "kayo", "sila", "ko", "mo", "niya", "kailan", "paano", "saan", "bakit", "ano", "sino"];
  const bikWords = ["an", "sa", "mga", "na", "pa", "tada", "mako", "iya", "kame", "kamo", "sinda", "marhay", "kun", "iyo", "yaon", "sinu", "baket", "anu"];
  const filCount = filWords.filter((w) => lower.includes(" " + w + " ") || lower.startsWith(w + " ") || lower.endsWith(" " + w)).length;
  const bikCount = bikWords.filter((w) => lower.includes(" " + w + " ") || lower.startsWith(w + " ") || lower.endsWith(" " + w)).length;
  if (bikCount > filCount && bikCount > 0) return "bik";
  if (filCount > 0) return "fil";
  return "unknown";
}

function detectSentiment(text: string): "positive" | "negative" | "neutral" | "urgent" {
  const lower = text.toLowerCase();
  const positive = ["thank", "thanks", "great", "awesome", "good", "nice", "love", "happy", "salamat", "marhay", "gusto", "masaya", "excellent", "perfect", "wonderful", "amazing"];
  const negative = ["bad", "sad", "angry", "hate", "terrible", "awful", "wrong", "problem", "issue", "complaint", "reklamo", "hindi", "problema", "frustrated", "upset", "disappointed"];
  const urgent = ["emergency", "urgent", "asap", "immediately", "help me", "911", "bagyo", "baha", "fire", "sunog", "accident", "sakuna", "delikado", "danger", "tulong"];

  if (urgent.some((w) => lower.includes(w))) return "urgent";
  const posCount = positive.filter((w) => lower.includes(w)).length;
  const negCount = negative.filter((w) => lower.includes(w)).length;
  if (posCount > negCount && posCount > 0) return "positive";
  if (negCount > posCount && negCount > 0) return "negative";
  return "neutral";
}

function detectQuestionType(text: string): string {
  const lower = text.toLowerCase();
  const t = lower.trim();
  if (/^(can you|could you|would you|will you|may i|magagawa|maaari|pwede)/i.test(t)) return "capability";
  if (/^(is|are|was|were|do|does|did|have|has|had|should|will|would|can|could)/i.test(t)) return "yesno";
  if (/^(what|anong|anu)\b/i.test(t)) return "what";
  if (/^(who|sinu|sino)\b/i.test(t)) return "who";
  if (/^(when|kailan|anong oras)\b/i.test(t)) return "when";
  if (/^(where|saan|nasaan)\b/i.test(t)) return "where";
  if (/^(why|bakit)\b/i.test(t)) return "why";
  if (/^(how|paano)\b/i.test(t)) return "how";
  if (/^how (much|many|old|far|long|often)/i.test(t)) return "quantity";
  if (/^(which|alin|which one)\b/i.test(t)) return "which";
  if (/\?$/.test(t) || /^(tell me|give me|show me|ipakita|ipaliwanag|explain)/i.test(t)) return "open";
  return "statement";
}

function extractKeywords(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const expanded = new Set(tokens);
  tokens.forEach((token) => {
    Object.entries(SYNONYMS).forEach(([key, synonyms]) => {
      if (synonyms.some((s) => s.toLowerCase().includes(token) || token.includes(s.toLowerCase()))) {
        expanded.add(key);
      }
      if (key === token || key.includes(token) || token.includes(key)) {
        synonyms.forEach((s) => expanded.add(s.toLowerCase()));
      }
    });
  });
  return Array.from(expanded);
}

function detectIntent(input: string, memory?: ConversationMemory): { intent: string; entities: Record<string, string>; confidence: number; qtype: string; sentiment: string; keywords: string[] } {
  const text = input.toLowerCase().trim();
  const entities: Record<string, string> = {};
  const qtype = detectQuestionType(input);
  const sentiment = detectSentiment(input);
  const keywords = extractKeywords(input);

  if (qtype === "yesno" || qtype === "capability") {
    return { intent: "yesno_question", entities, confidence: 0.85, qtype, sentiment, keywords };
  }
  if (qtype === "quantity") {
    return { intent: "quantity_question", entities, confidence: 0.85, qtype, sentiment, keywords };
  }

  const intentPatterns: Array<{ intent: string; patterns: RegExp[]; weight: number }> = [
    { intent: "greeting", patterns: [/^(hi|hello|hey|good (morning|afternoon|evening|day)|kumusta|marhay|musta)\b/], weight: 0.95 },
    { intent: "farewell", patterns: [/\b(bye|goodbye|see you|paalam|adios|hangat)\b/], weight: 0.9 },
    { intent: "thanks", patterns: [/\b(thank|thanks|appreciate|grateful|salamat|marhay na salamat)\b/], weight: 0.95 },
    { intent: "how_are_you", patterns: [/\b(how are you|how do you do|kamusta ka|anong balita)\b/], weight: 0.9 },
    { intent: "who_are_you", patterns: [/\b(who are you|what are you|your name|introduce yourself|kausima ka|sinu ka)\b/], weight: 0.95 },
    { intent: "capabilities", patterns: [/\b(what can you do|help me with|abilities|capabilities|features|ano kaya mo|anong kaya)\b/], weight: 0.9 },
    { intent: "clearance", patterns: [/\b(clearance|certificate|kagawad|brgy clearance|barangay clearance|cedula)\b/], weight: 0.85 },
    { intent: "residency", patterns: [/\b(residency|residing|address proof|tirahan|tinitirahan)\b/], weight: 0.85 },
    { intent: "indigency", patterns: [/\b(indigency|indigent|poor|financial assistance|hirap|dukwente)\b/], weight: 0.85 },
    { intent: "business_permit", patterns: [/\b(business permit|barangay permit|trading|business|businesseng|negosyo)\b/], weight: 0.85 },
    { intent: "document_request", patterns: [/\b(document|request|how to get|apply|paper|kumuha|paano|mag-request)\b/], weight: 0.7 },
    { intent: "register", patterns: [/\b(register|sign up|create account|join|mag-register|gumawa ng account)\b/], weight: 0.9 },
    { intent: "login", patterns: [/\b(login|sign in|log in|account access|mag-login|pasok)\b/], weight: 0.9 },
    { intent: "forgot_password", patterns: [/\b(forgot|lost|reset|reset password|nakalimutan|di ko naalala)\b/], weight: 0.9 },
    { intent: "change_password", patterns: [/\b(change password|update password|new password|palitan password)\b/], weight: 0.9 },
    { intent: "alert", patterns: [/\b(alert|emergency|disaster|typhoon|flood|earthquake|landslide|baha|bagyo|lindol)\b/], weight: 0.9 },
    { intent: "evacuation", patterns: [/\b(evacuate|evacuation|shelter|safe place|ligtas|evacuation center|kanlungan)\b/], weight: 0.9 },
    { intent: "hotline", patterns: [/\b(hotline|emergency number|call|contact number|emergency contact|tawag|numero)\b/], weight: 0.85 },
    { intent: "weather", patterns: [/\b(weather|forecast|rain|temperature|panahon|ulan|temperatura|ulan)\b/], weight: 0.85 },
    { intent: "announcement", patterns: [/\b(announcement|news|update|notice|bulletin|balita|anunsiyo)\b/], weight: 0.8 },
    { intent: "contact", patterns: [/\b(contact|reach|email|phone|get in touch|email address)\b/], weight: 0.8 },
    { intent: "location", patterns: [/\b(location|address|where|find you|directions|saan|nasaan)\b/], weight: 0.85 },
    { intent: "captain", patterns: [/\b(captain|barangay captain|kapitan|punong barangay|head|leader)\b/], weight: 0.85 },
    { intent: "officials", patterns: [/\b(official|kagawad|council|secretary|treasurer|elected|tagapamahala|opisyal)\b/], weight: 0.8 },
    { intent: "stats", patterns: [/\b(population|residents|households|how many|demographics|census|count|bilang|tao)\b/], weight: 0.8 },
    { intent: "services", patterns: [/\b(service|what do you offer|programs|help available|serbisyo|tulong)\b/], weight: 0.75 },
    { intent: "volunteer", patterns: [/\b(volunteer|join|help out|contribute|boluntaryo|tulong)\b/], weight: 0.8 },
    { intent: "event", patterns: [/\b(event|activity|program|gathering|assembly|meeting|gawain|pulong)\b/], weight: 0.7 },
    { intent: "complaint", patterns: [/\b(complaint|report|problem|issue|reklamo|sumbong|problema)\b/], weight: 0.85 },
    { intent: "purok", patterns: [/\b(purok|zone|sitio|area|district| lugar)\b/], weight: 0.8 },
    { intent: "youth", patterns: [/\b(youth|sk|katipunan ng kabataan|young|kabataan|batang)\b/], weight: 0.85 },
    { intent: "senior", patterns: [/\b(senior|elderly|old|osap|nakatatanda|lola|lolo)\b/], weight: 0.85 },
    { intent: "pwd", patterns: [/\b(pwd|disabled|disability|kapansanan)\b/], weight: 0.85 },
    { intent: "health", patterns: [/\b(health|medical|hospital|clinic|doctor|kalusugan|ospital)\b/], weight: 0.8 },
    { intent: "education", patterns: [/\b(school|education|enroll|student|klase|pag-aaral|paaralan)\b/], weight: 0.8 },
    { intent: "fee", patterns: [/\b(fee|cost|price|how much|magkano|halaga|bayad|amount)\b/], weight: 0.85 },
    { intent: "time", patterns: [/\b(time|what time|date|day|oras|anong araw|anong oras)\b/], weight: 0.8 },
    { intent: "trivia", patterns: [/\b(joke|fun fact|trivia|biro|katuwiran)\b/], weight: 0.85 },
    { intent: "app_help", patterns: [/\b(app|website|navigation|how to use|guide|tutorial)\b/], weight: 0.85 },
    { intent: "feedback", patterns: [/\b(feedback|suggestion|review|rate|comment|suhestiyon)\b/], weight: 0.85 },
    { intent: "privacy", patterns: [/\b(privacy|data|secure|personal|confidential|safe)\b/], weight: 0.85 },
  ];

  let bestMatch = { intent: "general", confidence: 0.3 };
  for (const pattern of intentPatterns) {
    for (const regex of pattern.patterns) {
      if (regex.test(text)) {
        if (pattern.weight > bestMatch.confidence) {
          bestMatch = { intent: pattern.intent, confidence: pattern.weight };
        }
      }
    }
    for (const keyword of keywords) {
      for (const synKey of Object.keys(SYNONYMS)) {
        if (synKey === pattern.intent && SYNONYMS[synKey].some((s) => keyword.includes(s.toLowerCase()) || s.toLowerCase().includes(keyword))) {
          if (0.7 > bestMatch.confidence) {
            bestMatch = { intent: pattern.intent, confidence: 0.7 };
          }
        }
      }
    }
  }

  const intent = bestMatch.intent;
  const confidence = bestMatch.confidence;

  const docTypes = ["clearance", "residency", "indigency", "business permit"];
  for (const doc of docTypes) {
    if (text.includes(doc)) entities.documentType = doc;
  }

  const timePatterns = /\b(now|right now|today|tomorrow|yesterday|this week|this month|ngayon|bukas|kagabi|ngayong linggo|ngayong buwan)\b/i;
  const timeMatch = text.match(timePatterns);
  if (timeMatch) entities.time = timeMatch[1];

  const numberMatch = text.match(/\b(\d+)\b/);
  if (numberMatch) entities.number = numberMatch[1];

  if (confidence < 0.5 && memory?.lastIntent && memory.lastIntent !== "general") {
    const followUpTriggers = /\b(it|that|this|these|those|them|they|more|also|too|and|another|next|previous|pa|rin|lamang|kung)\b/i;
    if (followUpTriggers.test(text) && text.split(/\s+/).length < 8) {
      return { intent: memory.lastIntent, entities, confidence: 0.7, qtype, sentiment, keywords };
    }
  }

  if (confidence < 0.45) {
    return { intent: "smart_search", entities, confidence: 0.5, qtype, sentiment, keywords };
  }

  return { intent, entities, confidence, qtype, sentiment, keywords };
}

function generateResponse(intent: string, entities: Record<string, string>, context: AIContext, qtype: string = "statement", sentiment: string = "neutral", keywords: string[] = [], originalInput: string = ""): { content: string; suggestions?: string[]; actions?: QuickAction[]; confidence?: number; sources?: string[] } {
  const { lang, stats, info, activeAlerts, announcements, officials, weather, isLoggedIn, userName, residents, households, volunteers, events, documents, incidents, evacCenters } = context;
  const l = lang;

  const l10n = (en: string, fil: string, bik?: string) => l === "en" ? en : l === "fil" ? fil : bik || fil;

  const suggestions: Record<string, string[]> = {
    en: ["How to request a document?", "What are the active alerts?", "How to register?", "Who is the captain?"],
    fil: ["Paano mag-request ng dokumento?", "Ano ang mga active na alerto?", "Paano mag-register?", "Sino ang kapitan?"],
    bik: ["Paano magingge nin dokumento?", "Anu ang mga aktibong alerto?", "Paano mag-register?", "Sinu ang kapitan?"],
  };

  switch (intent) {
    case "greeting":
      const name = isLoggedIn && userName ? `, ${userName.split(" ")[0]}` : "";
      return {
        content: l10n(
          `Hello${name}! Welcome to the e-Cagraray Hub. I'm Cagri, your AI assistant. I can help you with document requests, disaster alerts, community information, and navigating our services. What would you like to know?`,
          `Kumusta${name}! Maligayang pagdating sa e-Cagraray Hub. Ako si Cagri, ang iyong AI assistant. Matutulungan kita sa mga dokumento, alerto, impormasyon, at mga serbisyo. Ano ang gusto mong malaman?`,
          `Marhay${name}! Maligayang pagdatong sa e-Cagraray Hub. Ako si Cagri, an saimong AI assistant. Makatutabang ako saimo sa mga dokumento, alerto, impormasyon, asin mga serbisyo. Anu an gusto mong malaman?`
        ),
        suggestions: suggestions[l],
        actions: [
          { label: l10n("Document Services", "Mga Serbisyo", "Mga Serbisyo"), icon: FileText, href: "#features" },
          { label: l10n("Active Alerts", "Mga Alerto", "Mga Alerto"), icon: AlertTriangle, href: "#features" },
        ],
      };

    case "farewell":
      return {
        content: l10n(
          "Goodbye! Stay safe, and remember that your barangay is always here to help. Have a wonderful day!",
          "Paalam! Ingat palagi, at tandaan na ang inyong barangay ay laging handang tumulong. Magandang araw!",
          "Hangat! Ipag, asin tadaan na an inyong barangay laging andam magtukdo. Marhay na aldaw!"
        ),
        suggestions: [l10n("Main menu", "Pangunahing menu", "Pangunguna menu")],
      };

    case "thanks":
      return {
        content: l10n(
          "You're very welcome! Is there anything else I can help you with?",
          "Walang anuman! May iba pa ba akong matutulungan sa iyo?",
          "Mayong ano man! May iba pa na makatutabang ako saimo?"
        ),
        suggestions: [l10n("Main menu", "Pangunahing menu", "Pangunguna menu"), l10n("Document Services", "Mga Serbisyo", "Mga Serbisyo")],
      };

    case "how_are_you":
      return {
        content: l10n(
          "I'm functioning at full capacity, thank you for asking! I'm here and ready to help the residents of Barangay Cagraray. How about you? How can I make your day better?",
          "Ako ay maayos, salamat sa pagtatanong! Nandito ako at handang tumulong sa mga residente ng Barangay Cagraray. Ikaw, kamusta ka? Paano kita matutulungan ngayong araw?",
          "Maayo ako, salamat sa pagtatanong! Dinhi ako asin andam magtukdo sa mga residente kan Barangay Cagraray. Ikaw, musta ka? Paano tada makatabang saimo ngonyan na aldaw?"
        ),
      };

    case "who_are_you":
      return {
        content: l10n(
          "I'm Cagri, an AI assistant built specifically for the e-Cagraray Hub. I can answer questions about barangay services, help you request documents, inform you about community alerts, and provide information about local officials and services. I'm powered by advanced natural language processing and a comprehensive knowledge base of barangay information.",
          "Ako si Cagri, isang AI assistant na ginawa para sa e-Cagraray Hub. Kaya kong sumagot ng mga tanong tungkol sa serbisyo ng barangay, tulungan kang humingi ng dokumento, ipaalam sa iyo ang mga alerto, at magbigay ng impormasyon tungkol sa mga opisyal at serbisyo. Pinapagana ako ng advanced na natural language processing.",
          "Ako si Cagri, sarong AI assistant na gibo para sa e-Cagraray Hub. Kaya kong sumagot nin mga tanong manongod sa serbisyo kan barangay, tabangan kang humingi nin dokumento, sabihon saimo an mga alerto, asin magbigay nin impormasyon. Pinapagana ako nin advanced na natural language processing."
        ),
        actions: [
          { label: l10n("What can you do?", "Ano ang kaya mo?", "Anu an kaya mo?"), icon: Lightbulb, onClick: undefined },
        ],
      };

    case "capabilities":
      return {
        content: l10n(
          "I can help you with many things! Here's what I'm great at:\n\n• Document Services — Request barangay clearance, residency, indigency, or business permits\n• Emergency Alerts — View active typhoon, flood, and disaster warnings\n• Community Information — Find officials, statistics, and announcements\n• Weather Updates — Real-time weather for Bato, Catanduanes\n• Account Help — Registration, login, and password reset assistance\n• FAQ — Answer common questions about the barangay\n• Navigation — Help you find what you need on the site\n\nJust ask me anything!",
          "Maraming maitutulong ako sa iyo! Narito ang aking mga kayang gawin:\n\n• Mga Serbisyo — Mag-request ng clearance, residency, indigency, o business permit\n• Mga Alerto — Tingnan ang mga bagyo, baha, at kalamidad\n• Impormasyon — Humanap ng opisyal, istatistika, at anunsiyo\n• Panahon — Real-time na panahon para sa Bato, Catanduanes\n• Account Help — Tulong sa pag-register, login, at password\n• FAQ — Sagutin ang mga madalas na tanong\n• Navigation — Tulungan kang makahanap ng kailangan mo\n\nMagtanong ka lang!"
        ),
      };

    case "clearance":
      return {
        content: l10n(
          "To request a Barangay Clearance:\n\n1. Click 'New Request' on the Documents page\n2. Select 'Barangay Clearance' from services\n3. Specify your purpose (e.g., employment, school, travel)\n4. Submit the form\n5. Wait for approval (usually 1-3 business days)\n6. Pick up at the barangay hall or download digitally\n\nRequirements: Valid ID, proof of residency. The fee varies depending on your purpose. Would you like to know about any other document?",
          "Para mag-request ng Barangay Clearance:\n\n1. I-click ang 'New Request' sa Documents page\n2. Piliin ang 'Barangay Clearance'\n3. Ilagay ang iyong layunin (hal. trabaho, paaralan, paglalakbay)\n4. Isumite ang form\n5. Hintayin ang approval (karaniwang 1-3 araw)\n6. Kunin sa barangay hall o i-download\n\nKailangan: Valid ID, patunay ng paninirahan. May bayad depende sa layunin. Gusto mo bang malaman tungkol sa ibang dokumento?"
        ),
        actions: [
          { label: l10n("Request Document", "Mag-request", "Magingge"), icon: FileText, href: "/login" },
          { label: l10n("Other Documents", "Ibang Dokumento", "Ibang Dokumento"), icon: FileText, onClick: undefined },
        ],
      };

    case "residency":
      return {
        content: l10n(
          "A Residency Certificate proves you are a bonafide resident of Barangay Cagraray. To request:\n\n1. Login to your account\n2. Go to Documents → New Request\n3. Select 'Residency Certificate'\n4. Provide purpose and submit\n\nProcessing: 1-2 business days. Free of charge for residents with at least 6 months residency. You'll receive a digital copy and can pick up the signed version at the office.",
          "Ang Residency Certificate ay patunay na ikaw ay tunay na residente ng Barangay Cagraray. Para humingi:\n\n1. Mag-login sa account\n2. Pumunta sa Documents → New Request\n3. Piliin ang 'Residency Certificate'\n4. Ilagay ang layunin at isumite\n\nProseso: 1-2 araw. Libre para sa mga residente na may 6 na buwan na paninirahan."
        ),
        actions: [
          { label: l10n("Request Now", "Mag-request", "Magingge"), icon: FileText, href: "/login" },
        ],
      };

    case "indigency":
      return {
        content: l10n(
          "An Indigency Certificate is for residents who need financial assistance or proof of low-income status. It's commonly used for:\n\n• Medical/financial assistance from government agencies\n• Scholarship applications\n• Free legal aid\n• Burial assistance\n\nHow to request:\n1. Login → Documents → New Request\n2. Select 'Indigency Certificate'\n3. Provide purpose and supporting details\n4. Submit and wait for processing (1-2 business days)\n\nThe certificate is free of charge.",
          "Ang Indigency Certificate ay para sa mga residente na nangangailangan ng tulong pinansyal o patunay ng mababang kita. Karaniwang ginagamit para sa:\n\n• Tulong medikal/pinansyal\n• Scholarship\n• Libreng tulong legal\n• Tulong sa libing\n\nPaano mag-request: Login → Documents → New Request → Piliin ang 'Indigency Certificate'"
        ),
      };

    case "business_permit":
      return {
        content: l10n(
          "A Barangay Business Permit is required for any business operating within the barangay. To apply:\n\n1. Login to your account\n2. Go to Documents → New Request\n3. Select 'Business Permit'\n4. Provide business details (name, type, address)\n5. Submit and pay at the barangay treasury\n\nRequirements: Valid ID, DTI/SEC registration, lease contract or proof of business address. Fee depends on business type. Processing: 2-3 business days.",
          "Ang Barangay Business Permit ay kailangan para sa anumang negosyo na nag-ooperate sa barangay. Para mag-apply:\n\n1. Mag-login\n2. Pumunta sa Documents → New Request\n3. Piliin ang 'Business Permit'\n4. Ilagay ang detalye ng negosyo (pangalan, uri, address)\n5. Isumite at magbayad sa treasury\n\nKailangan: Valid ID, DTI/SEC registration, lease contract. Bayad depende sa uri ng negosyo."
        ),
      };

    case "document_request":
      return {
        content: l10n(
          "You can request 4 types of documents online:\n\n📄 Barangay Clearance — for general purposes\n🏠 Residency Certificate — proof of residence\n💰 Indigency Certificate — for financial assistance\n🏪 Business Permit — for business operations\n\nTo request any of these:\n1. Login or register first\n2. Go to Documents page\n3. Click 'New Request'\n4. Select the document type\n5. Fill in details and submit\n\nAll requests are processed within 1-3 business days. Which document do you need?",
          "Maaari kang humingi ng 4 na uri ng dokumento online:\n\n📄 Barangay Clearance — para sa pangkalahatang layunin\n🏠 Residency Certificate — patunay ng paninirahan\n💰 Indigency Certificate — para sa tulong pinansyal\n🏪 Business Permit — para sa negosyo\n\nPara humingi: Mag-login → Documents → New Request → Piliin ang dokumento → Isumite"
        ),
        actions: [
          { label: l10n("Login to Request", "Mag-login", "Mag-login"), icon: FileText, href: "/login" },
        ],
      };

    case "register":
      return {
        content: l10n(
          "To register for an account:\n\n1. Click 'Register' on the top right of this page\n2. Fill in your personal details (name, email, contact, address)\n3. Create a username and password\n4. Submit the form\n5. Wait for admin approval (usually 1-2 days)\n\nOnce approved, you'll receive an email and can login to access all barangay services. Registration is completely free!",
          "Para mag-register:\n\n1. I-click ang 'Register' sa kanang itaas\n2. Ilagay ang iyong personal na detalye (pangalan, email, contact, address)\n3. Gumawa ng username at password\n4. Isumite ang form\n5. Hintayin ang approval ng admin (karaniwang 1-2 araw)\n\nKapag naaprubahan, makakatanggap ka ng email at maaari kang mag-login. Libre ang registration!"
        ),
        actions: [
          { label: l10n("Register Now", "Mag-register", "Mag-register"), icon: Sparkles, href: "/login?mode=register" },
        ],
      };

    case "login":
      return {
        content: l10n(
          "To login:\n\n1. Click 'Login' on the top right\n2. Enter your username/email and password\n3. Click 'Sign In'\n\nIf you don't have an account, you can register for free. If you forgot your password, click 'Forgot Password' on the login page.",
          "Para mag-login:\n\n1. I-click ang 'Login' sa kanang itaas\n2. Ilagay ang username/email at password\n3. I-click ang 'Sign In'\n\nKung wala kang account, maaari kang mag-register nang libre. Kung nakalimutan mo ang password, i-click ang 'Forgot Password'."
        ),
        actions: [
          { label: l10n("Login", "Mag-login", "Mag-login"), icon: Shield, href: "/login" },
        ],
      };

    case "forgot_password":
      return {
        content: l10n(
          "If you forgot your password:\n\n1. Go to the Login page\n2. Click 'Forgot Password'\n3. Enter your registered email\n4. Check your email for a reset link\n5. Create a new password\n\nIf you don't receive the email within 5 minutes, check your spam folder or contact the barangay secretariat for help.",
          "Kung nakalimutan mo ang password:\n\n1. Pumunta sa Login page\n2. I-click ang 'Forgot Password'\n3. Ilagay ang iyong email\n4. Tingnan ang email mo para sa reset link\n5. Gumawa ng bagong password\n\nKung hindi mo matanggap ang email sa loob ng 5 minuto, tingnan ang spam folder o makipag-ugnayan sa barangay secretariat."
        ),
      };

    case "alert":
      const alertCount = activeAlerts?.length || 0;
      if (alertCount > 0) {
        const firstAlert = activeAlerts![0];
        return {
          content: l10n(
            `⚠️ There ${alertCount === 1 ? 'is 1 active alert' : `are ${alertCount} active alerts`} right now:\n\n${activeAlerts!.map((a, i) => `${i + 1}. ${a.title || a.level || 'Alert'} — ${a.description || a.message || 'Please check details'}`).join('\n')}\n\nPlease stay alert and follow the instructions from the barangay emergency team. Check the Announcements page for the full details.`,
            `⚠️ May ${alertCount === 1 ? '1 aktibong alerto' : `${alertCount} na aktibong alerto`} ngayon:\n\n${activeAlerts!.map((a, i) => `${i + 1}. ${a.title || a.level || 'Alerto'} — ${a.description || a.message || 'Tingnan ang detalye'}`).join('\n')}\n\nManatiling alerto at sundin ang mga tagubilin ng emergency team.`,
            `⚠️ May ${alertCount === 1 ? '1 aktibong alerto' : `${alertCount} na aktibong alerto`} ngonyan:\n\n${activeAlerts!.map((a, i) => `${i + 1}. ${a.title || a.level || 'Alerto'} — ${a.description || a.message || 'Tingnan an detalye'}`).join('\n')}\n\nMag-andam asin sunodon an mga tagubilin kan emergency team.`
          ),
          actions: [
            { label: l10n("View All Alerts", "Tingnan Lahat", "Tingnan Gabos"), icon: AlertTriangle, href: "/dashboard/alerts" },
          ],
        };
      }
      return {
        content: l10n(
          "✅ Good news! There are no active emergency alerts at this time. The barangay is on normal operations. Stay prepared by keeping an emergency kit and knowing your evacuation route.",
          "✅ Magandang balita! Walang aktibong emergency alerto sa ngayon. Ang barangay ay nasa normal na operasyon. Maghanda sa pamamagitan ng pagkakaroon ng emergency kit at pag-alam ng evacuation route.",
          "✅ Marhay na bareta! Mayong aktibong emergency alerto ngonyan. An barangay yaon sa normal na operasyon. Mag-andam sa paagi nin pagkakaroon nin emergency kit asin pag-aral nin evacuation route."
        ),
        actions: [
          { label: l10n("Emergency Hotlines", "Mga Hotline", "Mga Hotline"), icon: Phone, onClick: undefined },
        ],
      };

    case "evacuation":
      return {
        content: l10n(
          "🏃 Evacuation Centers in Barangay Cagraray:\n\nThe barangay has designated evacuation centers for typhoons, floods, and other emergencies. Common locations include:\n\n• Barangay Hall (Primary Center)\n• Cagraray Elementary School\n• Cagraray National High School\n• Barangay Chapel / Covered Court\n\nDuring evacuations, bring:\n✓ Emergency kit (food, water, medicine)\n✓ Important documents\n✓ Flashlight and extra batteries\n✓ Change of clothes\n✓ Mobile phone and charger\n\nCheck the Evacuation page for real-time capacity information.",
          "🏃 Mga Evacuation Center sa Barangay Cagraray:\n\nAng barangay ay may mga itinalagang evacuation center para sa bagyo, baha, at iba pang emergency. Karaniwang lokasyon:\n\n• Barangay Hall (Pangunahing Center)\n• Cagraray Elementary School\n• Cagraray National High School\n• Barangay Chapel / Covered Court\n\nSa panahon ng evacuation, dalhin ang: emergency kit, mahahalagang dokumento, flashlight, damit, at cellphone."
        ),
        actions: [
          { label: l10n("View Centers", "Tingnan", "Tingnan"), icon: MapPin, href: "/dashboard/evacuation" },
        ],
      };

    case "hotline":
      return {
        content: l10n(
          `📞 Emergency Hotlines:\n\n🚨 Barangay Emergency: ${info?.contact || '+63 977 008 6455'}\n🚑 Philippine Red Cross: 143\n🚒 BFP (Fire): (052) 811-2236\n👮 PNP (Police): 117 or (052) 811-1234\n🏥 Catanduanes Provincial Hospital: (052) 811-3200\n🌀 PAGASA (Weather): (02) 8284-0800\n📱 National Emergency: 911\n\nAlways call the barangay first for local emergencies. We're your first responders!`,
          `📞 Mga Emergency Hotline:\n\n🚨 Barangay Emergency: ${info?.contact || '+63 977 008 6455'}\n🚑 Philippine Red Cross: 143\n🚒 BFP (Sunog): (052) 811-2236\n👮 PNP (Pulisiya): 117 o (052) 811-1234\n🏥 Catanduanes Provincial Hospital: (052) 811-3200\n🌀 PAGASA: (02) 8284-0800\n📱 National Emergency: 911\n\nLaging tumawag muna sa barangay para sa lokal na emergency. Kami ang inyong unang tumutugon!`
        ),
        actions: [
          { label: l10n("Call Barangay", "Tumawag", "Tumawag"), icon: Phone, onClick: undefined },
        ],
      };

    case "weather":
      if (weather) {
        return {
          content: l10n(
            `🌤️ Current Weather in ${info?.municipality || 'Bato'}, ${info?.province || 'Catanduanes'}:\n\nTemperature: ${weather.temp}°C\nCondition: ${weather.description}\n\n${weather.condition === 'rain' ? '☔ Bring an umbrella! Avoid flood-prone areas.' : weather.condition === 'cloud' ? '☁️ Cloudy skies. Good for outdoor activities.' : '☀️ Clear weather. Perfect for community events!'}\n\nFor more details, check the Weather tab on the Announcements page.`,
            `🌤️ Kasalukuyang Panahon sa ${info?.municipality || 'Bato'}, ${info?.province || 'Catanduanes'}:\n\nTemperatura: ${weather.temp}°C\nKondisyon: ${weather.description}\n\n${weather.condition === 'rain' ? '☔ Magdala ng payong! Iwasan ang mga lugar na maaaring bahain.' : weather.condition === 'cloud' ? '☁️ Maulap na kalangitan. Maganda para sa mga gawain sa labas.' : '☀️ Maaliwalas na panahon. Perpekto para sa mga event!'}`
          ),
          actions: [
            { label: l10n("View Forecast", "Tingnan Forecast", "Tingnan"), icon: Cloud, href: "#features" },
          ],
        };
      }
      return {
        content: l10n(
          "🌤️ To see the current weather for Bato, Catanduanes, check the Weather tab on the Announcements section. The forecast includes temperature, rainfall, and 3-day outlook to help you plan your activities.",
          "🌤️ Para makita ang kasalukuyang panahon sa Bato, Catanduanes, pumunta sa Weather tab sa Announcements section. Kasama ang temperatura, ulan, at 3-araw na forecast.",
          "🌤️ Para makita an kasalukuyang panahon sa Bato, Catanduanes, pumunta sa Weather tab sa Announcements section. Kasama an temperatura, ulan, asin 3-aldaw na forecast."
        ),
        actions: [
          { label: l10n("View Weather", "Tingnan Panahon", "Tingnan"), icon: Cloud, href: "#features" },
        ],
      };

    case "announcement":
      const annCount = announcements?.length || 0;
      if (annCount > 0) {
        return {
          content: l10n(
            `📢 Latest Announcements:\n\n${announcements!.slice(0, 3).map((a, i) => `${i + 1}. ${a.title || 'Announcement'}${a.description ? ` — ${a.description.substring(0, 80)}${a.description.length > 80 ? '...' : ''}` : ''}`).join('\n')}\n\nVisit the Announcements page for the full list and to read more details.`,
            `📢 Pinakabagong Anunsiyo:\n\n${announcements!.slice(0, 3).map((a, i) => `${i + 1}. ${a.title || 'Anunsiyo'}${a.description ? ` — ${a.description.substring(0, 80)}${a.description.length > 80 ? '...' : ''}` : ''}`).join('\n')}\n\nBisitahin ang Announcements page para sa buong listahan.`
          ),
          actions: [
            { label: l10n("View All", "Tingnan Lahat", "Tingnan Gabos"), icon: MessageCircle, href: "/dashboard/announcements" },
          ],
        };
      }
      return {
        content: l10n(
          "📢 Check the Announcements page for the latest community news, events, and updates from the barangay. You can also subscribe to get notifications.",
          "📢 Tingnan ang Announcements page para sa pinakabagong balita, event, at update mula sa barangay. Maaari ka ring mag-subscribe para sa mga notification.",
          "📢 Tingnan an Announcements page para sa pinakabagong bareta, event, asin update hali sa barangay. Pwede ka ring mag-subscribe para sa mga notification."
        ),
        actions: [
          { label: l10n("View Announcements", "Tingnan Anunsiyo", "Tingnan"), icon: MessageCircle, href: "/dashboard/announcements" },
        ],
      };

    case "contact":
      return {
        content: l10n(
          `📍 Contact Information:\n\n📍 Address: ${info?.address || 'Cagraray, Bato, Catanduanes'}\n📞 Phone: ${info?.contact || '+63 977 008 6455'}\n📧 Email: ecagraraymanagementsystem@gmail.com\n\n🕐 Office Hours: Monday to Friday, 8:00 AM - 5:00 PM\n\nYou can also use the contact form on this page to send us a message directly. We typically respond within 24 hours.`,
          `📍 Impormasyon sa Pakikipag-ugnayan:\n\n📍 Address: ${info?.address || 'Cagraray, Bato, Catanduanes'}\n📞 Telepono: ${info?.contact || '+63 977 008 6455'}\n📧 Email: ecagraraymanagementsystem@gmail.com\n\n🕐 Oras ng Opisina: Lunes hanggang Biyernes, 8:00 AM - 5:00 PM\n\nMaaari mo ring gamitin ang contact form sa page na ito para magpadala ng mensahe. Karaniwang sumasagot kami sa loob ng 24 na oras.`
        ),
        actions: [
          { label: l10n("Send Message", "Magpadala", "Magpadara"), icon: Mail, href: "#contact" },
        ],
      };

    case "location":
      return {
        content: l10n(
          `📍 ${info?.name || 'Barangay Cagraray'} is located in:\n\n${info?.municipality || 'Bato'}, ${info?.province || 'Catanduanes'}, Philippines\n\nFull address: ${info?.address || 'Cagraray, Bato, Catanduanes'}\n\nThe barangay hall is open during office hours. For directions, you can find us on Google Maps by searching for 'Barangay Cagraray Hall, Bato, Catanduanes'.`,
          `📍 ${info?.name || 'Barangay Cagraray'} ay matatagpuan sa:\n\n${info?.municipality || 'Bato'}, ${info?.province || 'Catanduanes'}, Pilipinas\n\nBuong address: ${info?.address || 'Cagraray, Bato, Catanduanes'}`
        ),
        actions: [
          { label: l10n("View Map", "Tingnan Mapa", "Tingnan"), icon: MapPin, onClick: undefined },
        ],
      };

    case "captain":
      const captain = context.officials?.find((o: any) => o.role?.toLowerCase().includes("captain") || o.role?.toLowerCase().includes("punong barangay"));
      return {
        content: captain
          ? l10n(
            `👤 Barangay Captain:\n\n${captain.name}\n${captain.role}\n${captain.committee || ''}\n\nThe captain is the overall head of the barangay and oversees all community operations. Office hours: 8AM-5PM, Monday to Friday.`,
            `👤 Punong Barangay:\n\n${captain.name}\n${captain.role}\n${captain.committee || ''}\n\nAng kapitan ay ang pangkalahatang pinuno ng barangay. Oras ng opisina: 8AM-5PM, Lunes hanggang Biyernes.`
          )
          : l10n(
            "The Barangay Captain is the chief executive of the barangay. Visit the Officials page to see the current captain and all elected officials.",
            "Ang Punong Barangay ay ang pinakamataas na pinuno ng barangay. Bisitahin ang Officials page para makita ang kasalukuyang kapitan at lahat ng mga opisyal.",
            "An Punong Barangay iyo an pinakamataas na pinuno kan barangay. Bisitahon an Officials page para makita an kasalukuyan na kapitan asin gabos na mga opisyal."
          ),
        actions: [
          { label: l10n("View Officials", "Tingnan Opisyal", "Tingnan"), icon: Users, href: "#officials" },
        ],
      };

    case "officials":
      const officialCount = context.officials?.length || 0;
      return {
        content: l10n(
          `👥 Barangay Officials:\n\nThe barangay has ${officialCount} elected officials including:\n\n• 1 Barangay Captain (Punong Barangay)\n• 7 Barangay Kagawad (Councilors)\n• 1 SK Chairperson\n• 1 Barangay Secretary\n• 1 Barangay Treasurer\n\nVisit the Officials section to see the complete list with their committees and assignments.`,
          `👥 Mga Opisyal ng Barangay:\n\nAng barangay ay may ${officialCount} na mga elected na opisyal kabilang ang:\n\n• 1 Punong Barangay\n• 7 Barangay Kagawad\n• 1 SK Chairperson\n• 1 Barangay Secretary\n• 1 Barangay Treasurer`
        ),
        actions: [
          { label: l10n("View Officials", "Tingnan Opisyal", "Tingnan"), icon: Users, href: "#officials" },
        ],
      };

    case "stats":
      return {
        content: stats ? l10n(
          `📊 Barangay Statistics:\n\n👥 Residents: ${stats.residents.toLocaleString()}\n🏠 Households: ${stats.households.toLocaleString()}\n🙋 Volunteers: ${stats.volunteers.toLocaleString()}\n📅 Projects/Events: ${stats.events.toLocaleString()}\n\nThese numbers are updated in real-time from the barangay database. The data helps officials plan better services for the community.`,
          `📊 Istatistika ng Barangay:\n\n👥 Mga Residente: ${stats.residents.toLocaleString()}\n🏠 Mga Household: ${stats.households.toLocaleString()}\n🙋 Mga Boluntaryo: ${stats.volunteers.toLocaleString()}\n📅 Mga Proyekto/Event: ${stats.events.toLocaleString()}`
        ) : l10n(
          "Statistics are being loaded. Visit the Dashboard to see the full community statistics and analytics.",
          "Istatistika ay naglo-load. Bisitahin ang Dashboard para makita ang buong istatistika ng komunidad.",
          "Istatistika yaon naglo-load. Bisitahon an Dashboard para makita an buong istatistika kan komunidad."
        ),
        actions: [
          { label: l10n("View Dashboard", "Tingnan Dashboard", "Tingnan"), icon: BarChart3, href: "/dashboard" },
        ],
      };

    case "services":
      return {
        content: l10n(
          "🛎️ Barangay Services:\n\nWe offer the following services:\n\n📄 Document Services\n   • Barangay Clearance\n   • Residency Certificate\n   • Indigency Certificate\n   • Business Permit\n\n🚨 Emergency & Safety\n   • Disaster Alerts & Warnings\n   • Evacuation Center Management\n   • Emergency Hotlines\n\n👥 Community Programs\n   • Volunteer Coordination\n   • Youth Development (SK)\n   • Senior Citizen Services\n   • PWD Support\n\n📊 Community Management\n   • Resident Database\n   • Household Tracking\n   • Event Management\n   • Reports & Analytics\n\nWhich service interests you?",
          "🛎️ Mga Serbisyo ng Barangay:\n\nNag-aalok kami ng mga sumusunod na serbisyo:\n\n📄 Mga Serbisyo sa Dokumento\n   • Barangay Clearance\n   • Residency Certificate\n   • Indigency Certificate\n   • Business Permit\n\n🚨 Emergency at Kaligtasan\n   • Mga Alerto sa Kalamidad\n   • Evacuation Center Management\n   • Mga Emergency Hotline\n\n👥 Mga Programa sa Komunidad\n   • Koordinasyon ng Boluntaryo\n   • Pagpapaunlad ng Kabataan\n   • Serbisyo sa Matatanda\n   • Suporta sa PWD\n\n📊 Pamamahala ng Komunidad\n   • Database ng Residente\n   • Pagsubaybay sa Household\n   • Pamamahala ng Event\n   • Mga Ulat at Analytics"
        ),
        actions: [
          { label: l10n("View All Services", "Tingnan Lahat", "Tingnan Gabos"), icon: FileText, href: "#features" },
        ],
      };

    case "volunteer":
      return {
        content: l10n(
          "🙋 Volunteer Program:\n\nJoin our community volunteers and help make Barangay Cagraray a better place! We need volunteers for:\n\n• Disaster response and rescue\n• Community clean-up drives\n• Medical and health missions\n• Sports and youth programs\n• Senior citizen assistance\n• Documentation and admin support\n\nBenefits: Certificate of service, priority in barangay programs, training opportunities, and the chance to give back to the community.\n\nHow to join: Register an account, then contact the Barangay Secretariat or SK office.",
          "🙋 Programa sa Boluntaryo:\n\nSumali sa aming mga boluntaryo at tulungan ang Barangay Cagraray! Kailangan namin ng mga boluntaryo para sa:\n\n• Disaster response at rescue\n• Community clean-up drives\n• Medical at health missions\n• Sports at youth programs\n• Senior citizen assistance\n\nPaano sumali: Mag-register ng account, makipag-ugnayan sa Barangay Secretariat o SK office."
        ),
        actions: [
          { label: l10n("Register to Volunteer", "Mag-register", "Mag-register"), icon: Users, href: "/login?mode=register" },
        ],
      };

    case "event":
      return {
        content: l10n(
          "📅 Community Events:\n\nThe barangay hosts various events throughout the year:\n\n• Monthly Barangay Assembly\n• Quarterly Clean-up Drives\n• Annual Foundation Day\n• Sports Fest (Barangay Meet)\n• Health and Wellness Programs\n• Senior Citizen Gathering\n• Youth Activities (SK Programs)\n\nCheck the Events page for the schedule and to register. Past events are also archived for reference.",
          "📅 Mga Event ng Komunidad:\n\nAng barangay ay nagho-host ng iba't ibang event sa buong taon:\n\n• Monthly Barangay Assembly\n• Quarterly Clean-up Drives\n• Annual Foundation Day\n• Sports Fest (Barangay Meet)\n• Health at Wellness Programs\n• Senior Citizen Gathering\n• Youth Activities (SK Programs)"
        ),
        actions: [
          { label: l10n("View Events", "Tingnan Event", "Tingnan"), icon: Calendar, href: "/dashboard/events" },
        ],
      };

    case "complaint":
      return {
        content: l10n(
          "📝 Filing a Complaint:\n\nTo file a complaint or report an issue:\n\n1. Login to your account\n2. Go to Complaints page\n3. Click 'New Complaint'\n4. Select category (noise, dispute, infrastructure, etc.)\n5. Describe the issue in detail\n6. Submit\n\nThe barangay will review and respond within 3-5 business days. For urgent matters (violence, threats, etc.), please call the police hotline 117 or barangay emergency hotline immediately.",
          "📝 Pagsasampa ng Reklamo:\n\nPara magsampa ng reklamo:\n\n1. Mag-login sa account\n2. Pumunta sa Complaints page\n3. I-click ang 'New Complaint'\n4. Pumili ng kategorya\n5. Ilarawan ang problema\n6. Isumite\n\nSasagutin ng barangay sa loob ng 3-5 araw. Para sa mga urgent na bagay, tumawag sa pulisya 117 o barangay emergency."
        ),
        actions: [
          { label: l10n("File Complaint", "Magsampa", "Magsampa"), icon: AlertTriangle, href: "/login" },
        ],
      };

    case "youth":
      return {
        content: l10n(
          "👥 Sangguniang Kabataan (SK):\n\nThe SK is the youth government of the barangay for ages 15-30. Programs include:\n\n• Youth Leadership Training\n• Sports and Athletics\n• Arts and Culture Workshops\n• Education and Scholarship Programs\n• Environmental Awareness Campaigns\n• Mental Health and Wellness\n• Livelihood and Skills Training\n\nTo join, register an account and contact the SK Chairperson. The SK office is at the barangay hall.",
          "👥 Sangguniang Kabataan (SK):\n\nAng SK ay ang youth government ng barangay para sa mga edad 15-30. Mga programa:\n\n• Youth Leadership Training\n• Sports at Athletics\n• Arts at Culture Workshops\n• Education at Scholarship Programs\n• Environmental Awareness Campaigns\n• Mental Health at Wellness\n• Livelihood at Skills Training"
        ),
      };

    case "pwd":
      return {
        content: l10n(
          "♿ PWD Services:\n\nWe support Persons With Disabilities (PWDs) through:\n\n• PWD ID registration and renewal\n• Monthly financial assistance (subject to budget)\n• Priority services in all barangay transactions\n• Accessibility improvements (ramps, rails)\n• Free medical and dental missions\n• Skills training and livelihood programs\n\nTo avail, register or update your PWD status in your account, then visit the Barangay Social Services office.",
          "♿ Mga Serbisyo para sa PWD:\n\nSuportahan namin ang mga PWD sa pamamagitan ng:\n\n• PWD ID registration at renewal\n• Monthly financial assistance\n• Priority services sa lahat ng transaksyon\n• Accessibility improvements\n• Free medical at dental missions\n• Skills training at livelihood programs"
        ),
      };

    case "senior":
      return {
        content: l10n(
          "👴 Senior Citizen Services:\n\nWe provide special services for senior citizens (60+ years old):\n\n• Senior Citizen ID registration\n• Monthly social pension (PHP 500-1000)\n• Free medical check-ups\n• Priority lanes in all transactions\n• Free medicines and vitamins\n• Birthday cash gift\n• Burial assistance\n\nTo register, visit the Office of the Senior Citizens Affairs (OSCA) at the barangay hall with your birth certificate and valid ID.",
          "👴 Mga Serbisyo para sa Matatanda:\n\nNagbibigay kami ng mga espesyal na serbisyo para sa mga matatanda (60+ taong gulang):\n\n• Senior Citizen ID registration\n• Monthly social pension (PHP 500-1000)\n• Free medical check-ups\n• Priority lanes sa lahat ng transaksyon\n• Free medicines at vitamins\n• Birthday cash gift\n• Burial assistance"
        ),
      };

    case "health":
      return {
        content: l10n(
          "🏥 Health Services:\n\nThe barangay health center offers:\n\n• Free medical consultations\n• Vaccination programs (children, COVID, flu)\n• Maternal and child health services\n• Family planning counseling\n• Nutrition programs\n• Blood pressure and sugar monitoring\n• First aid and emergency response\n\nLocation: Beside the Barangay Hall\nOperating Hours: 8AM-5PM, Monday to Friday\n\nFor emergencies, go directly to Catanduanes Provincial Hospital.",
          "🏥 Mga Serbisyo sa Kalusugan:\n\nAng barangay health center ay nag-aalok ng:\n\n• Free medical consultations\n• Vaccination programs\n• Maternal at child health services\n• Family planning counseling\n• Nutrition programs\n• Blood pressure at sugar monitoring\n• First aid at emergency response"
        ),
        actions: [
          { label: l10n("View Location", "Tingnan Lokasyon", "Tingnan"), icon: MapPin, href: "#contact" },
        ],
      };

    case "education":
      return {
        content: l10n(
          "📚 Education Support:\n\nThe barangay supports education through:\n\n• Scholarship programs (elementary to college)\n• School supplies distribution\n• Free tutorial and review classes\n• Computer literacy training\n• Alternative Learning System (ALS)\n• Day Care services (3-5 years old)\n\nTo apply, visit the Barangay Hall with your report card and valid ID. Applications are usually accepted every June for the school year.",
          "📚 Suporta sa Edukasyon:\n\nAng barangay ay sumusuporta sa edukasyon sa pamamagitan ng:\n\n• Scholarship programs\n• School supplies distribution\n• Free tutorial at review classes\n• Computer literacy training\n• Alternative Learning System (ALS)\n• Day Care services"
        ),
      };

    case "time":
      const now = new Date();
      return {
        content: l10n(
          `🕐 Current time: ${now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n\nOffice hours: Monday to Friday, 8:00 AM - 5:00 PM\n\nFor emergencies outside office hours, call the barangay hotline 24/7.`,
          `🕐 Kasalukuyang oras: ${now.toLocaleString('fil-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\n\nOras ng opisina: Lunes hanggang Biyernes, 8:00 AM - 5:00 PM`
        ),
      };

    case "trivia":
      const trivia = l10n(
        "🧠 Fun Fact: Did you know? Barangay Cagraray is one of the barangays in Bato, Catanduanes — an island province known as the 'Land of the Howling Winds'! The province was heavily affected by Typhoon Rolly in 2020, but the resilient community rebuilt stronger. Today, we're using technology to serve residents better!",
        "🧠 Nakakatuwang Katotohanan: Alam mo ba? Ang Barangay Cagraray ay isa sa mga barangay sa Bato, Catanduanes — isang isla na kilala bilang 'Land of the Howling Winds'! Ang probinsya ay labis na naapektuhan ng Typhoon Rolly noong 2020, ngunit ang matatag na komunidad ay muling nagtayo. Ngayon, gumagamit kami ng teknolohiya para mas mabuting maglingkod sa mga residente!"
      );
      return {
        content: trivia,
      };

    case "change_password":
      return {
        content: l10nFn(lang,
          "To change your password:\n\n1. Login to your account\n2. Go to Settings\n3. Click 'Change Password'\n4. Enter your current password\n5. Enter your new password (twice for confirmation)\n6. Click 'Update'\n\nTips: Use 8+ characters, mix uppercase and lowercase, add numbers and symbols.",
          "Para palitan ang iyong password:\n\n1. Mag-login sa account\n2. Pumunta sa Settings\n3. I-click ang 'Change Password'\n4. Ilagay ang kasalukuyang password\n5. Ilagay ang bagong password (dalawang beses)\n6. I-click ang 'Update'\n\nTips: 8+ characters, halo ang uppercase at lowercase, may numero at simbolo."
        ),
        actions: [{ label: l10nFn(lang, "Login", "Mag-login", "Mag-login"), icon: Shield, href: "/login" }],
        confidence: 0.9,
      };

    case "app_help":
      return {
        content: l10nFn(lang,
          "🧭 How to use the e-Cagraray Hub:\n\n🏠 Home — Browse the landing page and AI Insights\n🔐 Login — Click 'Login' on top right\n📊 Dashboard — See your overview and statistics\n📄 Documents — Request certificates and permits\n🚨 Alerts — View active emergency alerts\n📢 Announcements — Read community news\n📅 Events — Browse and register for events\n👥 Officials — Meet your barangay officials\n⚙️ Settings — Update your profile\n\nType what you need help with, or click a suggestion!",
          "🧭 Paano gamitin ang e-Cagraray Hub:\n\n🏠 Home — I-browse ang landing page at AI Insights\n🔐 Login — I-click ang 'Login' sa kanang itaas\n📊 Dashboard — Tingnan ang overview at istatistika\n📄 Documents — Mag-request ng mga dokumento\n🚨 Alerts — Tingnan ang mga emergency alerto\n📢 Announcements — Magbasa ng balita\n📅 Events — Mag-browse at mag-register\n👥 Officials — Kilala ang mga opisyal\n⚙️ Settings — I-update ang profile"
        ),
        confidence: 0.9,
      };

    case "feedback":
      return {
        content: l10nFn(lang,
          "💌 We'd love your feedback!\n\nYour suggestions help us improve. You can:\n• Use the contact form on the landing page\n• Email us at ecagraraymanagementsystem@gmail.com\n• Call us at " + (info?.contact || "+63 977 008 6455") + "\n• Talk to the Barangay Secretary\n\nWe read every message and aim to respond within 24 hours.",
          "💌 Gusto namin ang feedback mo!\n\nMaaari kang:\n• Gamitin ang contact form\n• Mag-email sa ecagraraymanagementsystem@gmail.com\n• Tumawag sa " + (info?.contact || "+63 977 008 6455") + "\n• Makipag-usap sa Barangay Secretary\n\nSinasagot namin ang lahat sa loob ng 24 na oras."
        ),
        actions: [{ label: l10nFn(lang, "Send Feedback", "Magpadala", "Magpadara"), icon: Mail, href: "#contact" }],
        confidence: 0.9,
      };

    case "privacy":
      return {
        content: l10nFn(lang,
          "🔒 Your Privacy Matters:\n\n• All personal data is encrypted (HTTPS)\n• Passwords are hashed, never stored in plain text\n• Only authorized personnel can access your data\n• We comply with the Data Privacy Act of 2012 (RA 10173)\n• You can request data deletion anytime\n• We never share your data with third parties without consent",
          "🔒 Mahalaga ang Privacy Mo:\n\n• Lahat ng personal data ay naka-encrypt\n• Ang password ay hashed\n• Sumusunod kami sa Data Privacy Act of 2012\n• Maaari kang humiling ng data deletion"
        ),
        confidence: 0.9,
      };

    case "fee":
      return {
        content: l10nFn(lang,
          "💰 Document Fees:\n\n📄 Barangay Clearance — PHP 30-100 (depends on purpose)\n🏠 Residency Certificate — Free for 6+ month residents\n💰 Indigency Certificate — Free of charge\n🏪 Business Permit — PHP 100-500 (depends on business type)\n\nNote: Senior citizens and PWDs may be exempt from certain fees. Please confirm at the barangay treasury.",
          "💰 Mga Bayad sa Dokumento:\n\n📄 Barangay Clearance — PHP 30-100\n🏠 Residency Certificate — Libre para sa 6+ buwan\n💰 Indigency Certificate — Libre\n🏪 Business Permit — PHP 100-500"
        ),
        confidence: 0.9,
      };

    case "general":
    case "smart_search":
    case "yesno_question":
    case "quantity_question":
    default:
      return smartSearch(intent, entities, context, qtype, sentiment, keywords, originalInput);
  }
}

function smartSearch(intent: string, entities: Record<string, string>, context: AIContext, qtype: string, sentiment: string, keywords: string[], originalInput: string): { content: string; suggestions?: string[]; actions?: QuickAction[]; confidence?: number; sources?: string[] } {
  const { lang, stats, info, activeAlerts = [], announcements = [], officials = [], weather, residents = [], households = [], volunteers = [], events = [], documents = [], incidents = [], evacCenters = [] } = context;
  const lower = (originalInput || "").toLowerCase();
  const sources: string[] = [];

  if (qtype === "yesno" || intent === "yesno_question") {
    return answerYesNo(originalInput, context, keywords);
  }
  if (qtype === "quantity" || intent === "quantity_question") {
    return answerQuantity(originalInput, context, keywords);
  }

  if (sentiment === "urgent") {
    return {
      content: l10nFn(lang,
        "🚨 If this is a life-threatening emergency, please call 911 or the barangay hotline " + (info?.contact || "+63 977 008 6455") + " immediately.\n\nFor non-emergency concerns, I'm here to help. Can you tell me more about what you need?",
        "🚨 Kung life-threatening emergency, tumawag sa 911 o barangay hotline " + (info?.contact || "+63 977 008 6455") + ".\n\nPara sa hindi emergency, nandito ako. Maaari mo bang sabihin ang kailangan mo?",
        "🚨 Kun life-threatening emergency, tumawag sa 911 o barangay hotline " + (info?.contact || "+63 977 008 6455") + "."
      ),
      actions: [
        { label: l10nFn(lang, "View Hotlines", "Tingnan Hotline", "Tingnan"), icon: Phone, onClick: undefined },
      ],
      confidence: 0.9,
    };
  }

  if (keywords.length > 0) {
    const searchResults: Array<{ source: string; match: string }> = [];
    announcements.forEach((a: any) => {
      const title = (a.title || "").toLowerCase();
      const desc = (a.description || a.message || "").toLowerCase();
      if (keywords.some((k) => title.includes(k) || desc.includes(k))) {
        searchResults.push({ source: "announcement", match: a.title || "Announcement" });
      }
    });
    officials.forEach((o: any) => {
      const name = (o.name || "").toLowerCase();
      const role = (o.role || "").toLowerCase();
      if (keywords.some((k) => name.includes(k) || role.includes(k))) {
        searchResults.push({ source: "official", match: `${o.name} (${o.role})` });
      }
    });
    activeAlerts.forEach((a: any) => {
      const title = (a.title || "").toLowerCase();
      const desc = (a.description || a.message || "").toLowerCase();
      if (keywords.some((k) => title.includes(k) || desc.includes(k))) {
        searchResults.push({ source: "alert", match: a.title || "Alert" });
      }
    });
    if (residents.length > 0) {
      const matched = residents.find((r: any) => {
        const name = (r.fullName || r.name || "").toLowerCase();
        return keywords.some((k) => name.includes(k));
      });
      if (matched) searchResults.push({ source: "resident", match: matched.fullName || matched.name });
    }
    events.forEach((e: any) => {
      const title = (e.title || e.name || "").toLowerCase();
      const desc = (e.description || "").toLowerCase();
      if (keywords.some((k) => title.includes(k) || desc.includes(k))) {
        searchResults.push({ source: "event", match: e.title || e.name || "Event" });
      }
    });

    if (searchResults.length > 0) {
      const grouped = searchResults.reduce((acc, r) => {
        if (!acc[r.source]) acc[r.source] = [];
        acc[r.source].push(r);
        return acc;
      }, {} as Record<string, typeof searchResults>);

      let content = l10nFn(lang, "🔍 I found these matches in our data:\n\n", "🔍 Nakita ko ang mga tugma sa aming data:\n\n", "🔍 Nakita ko an mga tugma sa samong data:\n\n");
      Object.entries(grouped).forEach(([source, matches]) => {
        const label = source === "announcement" ? "📢 Announcements"
          : source === "official" ? "👥 Officials"
          : source === "alert" ? "🚨 Alerts"
          : source === "resident" ? "👤 Residents"
          : source === "event" ? "📅 Events"
          : "📌 " + source;
        content += `${label}:\n`;
        matches.slice(0, 3).forEach((m) => { content += `  • ${m.match}\n`; });
        if (matches.length > 3) content += `  ... and ${matches.length - 3} more\n`;
        content += "\n";
        sources.push(`database:${source}`);
      });
      content += l10nFn(lang, "Visit the relevant page for full details, or ask me a more specific question!", "Bisitahin ang relevant page para sa detalye, o magtanong ng mas partikular!", "Bisitahon an relevant page para sa detalye, o magtanong nin mas partikular!");
      return {
        content,
        sources,
        confidence: 0.7,
        suggestions: [
          l10nFn(lang, "View announcements", "Tingnan anunsiyo", "Tingnan anunsiyo"),
          l10nFn(lang, "View officials", "Tingnan opisyal", "Tingnan opisyal"),
        ],
      };
    }
  }

  return {
    content: l10nFn(lang,
      "I'm not 100% sure I understood that. Let me share what I know:\n\nI can help you with:\n• 📄 Documents (clearance, residency, indigency, business permit)\n• 🚨 Alerts and emergencies\n• 🌤️ Weather updates\n• 📊 Statistics and demographics\n• 👥 Officials and leaders\n• 📢 Announcements and events\n• 📞 Hotlines and contact info\n• 🙋 Volunteer, SK, Senior, PWD programs\n• 🏥 Health and education services\n• 🧭 Site navigation\n\nCould you rephrase your question, or pick a suggestion below?",
      "Hindi ko 100% naintindihan. Narito ang alam ko:\n\nMaaari kitang tulungan sa:\n• 📄 Mga Dokumento\n• 🚨 Mga Alerto at emergency\n• 🌤️ Update sa panahon\n• 📊 Istatistika\n• 👥 Mga Opisyal\n• 📢 Mga Anunsiyo at event\n• 📞 Hotline at contact\n• 🙋 Mga Programa (Volunteer, SK, Senior, PWD)\n• 🏥 Kalusugan at edukasyon\n• 🧭 Navigation sa site\n\nMaari mo bang i-rephrase ang tanong, o pumili ng suggestion?",
      "Dimo ko 100% naintendihan. Narito an alear ko:\n\nMakatutabang tada sa saimo sa:\n• 📄 Mga Dokumento\n• 🚨 Mga Alerto asin emergency\n• 🌤️ Update sa panahon\n• 📊 Estadistika\n• 👥 Mga Opisyal\n• 📢 Mga Anunsiyo asin event\n• 📞 Hotline asin contact\n• 🙋 Mga Programa\n• 🧭 Navigation sa site\n\nPwede mo bang i-rephrase an tanong, o pumili nin suggestion?"
    ),
    suggestions: [
      l10nFn(lang, "How to request a document?", "Paano mag-request ng dokumento?", "Paano magingge nin dokumento?"),
      l10nFn(lang, "What are the active alerts?", "Ano ang mga alerto?", "Anu an mga alerto?"),
      l10nFn(lang, "Show statistics", "Ipakita ang istatistika", "Ipakita an estadistika"),
      l10nFn(lang, "Who is the captain?", "Sino ang kapitan?", "Sinu ang kapitan?"),
      l10nFn(lang, "Show me hotlines", "Ipakita ang hotline", "Ipakita an hotline"),
    ],
    confidence: 0.5,
  };
}

function answerYesNo(input: string, context: AIContext, keywords: string[]): { content: string; suggestions?: string[]; actions?: QuickAction[]; confidence?: number; sources?: string[] } {
  const { lang, stats, info, activeAlerts = [], weather } = context;
  const lower = input.toLowerCase();
  const sources: string[] = [];

  if (lower.includes("open") || lower.includes("bukas") || lower.includes("available") || lower.includes("open pa") || lower.includes("close")) {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const isOfficeHours = day >= 1 && day <= 5 && hour >= 8 && hour < 17;
    return {
      content: l10nFn(lang,
        isOfficeHours ? "✅ Yes, the barangay hall is currently OPEN (office hours: 8AM-5PM, Mon-Fri)." : "❌ No, the barangay hall is currently CLOSED. Office hours are 8AM-5PM, Monday to Friday. For emergencies, the hotline is available 24/7.",
        isOfficeHours ? "✅ Oo, ANG BARANGAY HALL AY BUKAS ngayon (8AM-5PM, Lunes-Biyernes)." : "❌ Hindi, ang barangay hall ay SARADO ngayon. Ang oras ng opisina ay 8AM-5PM, Lunes hanggang Biyernes."
      ),
      confidence: 0.9,
    };
  }
  if (lower.includes("alert") || lower.includes("disaster") || lower.includes("bagyo") || lower.includes("baha") || lower.includes("landslide")) {
    const activeCount = activeAlerts.filter((a: any) => a.status === "active").length;
    sources.push("database:alerts");
    return {
      content: l10nFn(lang,
        activeCount > 0 ? `⚠️ Yes, there ${activeCount === 1 ? "is 1 active alert" : `are ${activeCount} active alerts`} right now. Please stay alert and follow the instructions.` : `✅ No, there are no active alerts at this time. The barangay is on normal operations.`,
        activeCount > 0 ? `⚠️ Oo, may ${activeCount === 1 ? "1 aktibong alerto" : `${activeCount} na aktibong alerto`} ngayon.` : `✅ Hindi, walang aktibong alerto ngayon.`
      ),
      sources,
      confidence: 0.95,
    };
  }
  if (lower.includes("rain") || lower.includes("ulan") || lower.includes("raining")) {
    sources.push("external:open-meteo");
    if (weather?.condition === "rain") {
      return {
        content: l10nFn(lang, "☔ Yes, it's currently raining. Please bring an umbrella and avoid flood-prone areas.", "☔ Oo, umuulan ngayon. Magdala ng payong at iwasan ang mga lugar na maaaring bahain."),
        sources,
        confidence: 0.95,
      };
    }
    return {
      content: l10nFn(lang, "🌤️ No, it's not currently raining. The current condition is " + (weather?.description || "clear") + ".", "🌤️ Hindi, hindi umuulan ngayon. Kasalukuyang kondisyon: " + (weather?.description || "maaliwalas") + "."),
      sources,
      confidence: 0.9,
    };
  }
  if (lower.includes("register") || lower.includes("mag-register") || lower.includes("sign up") || lower.includes("create account")) {
    return {
      content: l10nFn(lang, "✅ Yes, you can register for free! Click the 'Register' button on the top right of the page or visit /login?mode=register. After admin approval (1-2 days), you can access all barangay services.", "✅ Oo, maaari kang mag-register nang libre! I-click ang 'Register' na button."),
      actions: [{ label: l10nFn(lang, "Register Now", "Mag-register", "Mag-register"), icon: Sparkles, href: "/login?mode=register" }],
      confidence: 0.95,
    };
  }
  if (lower.includes("free") || lower.includes("libre") || lower.includes("bayad") || lower.includes("fee") || lower.includes("cost")) {
    return {
      content: l10nFn(lang, "💰 Some services are FREE (residency for 6+ month residents, indigency, registration), while documents like clearance and business permits have small fees (PHP 30-500).", "💰 Ang ilang serbisyo ay LIBRE, habang ang mga dokumento tulad ng clearance at business permit ay may maliit na bayad."),
      confidence: 0.9,
    };
  }
  if (lower.includes("deliver") || lower.includes("pickup") || lower.includes("kunin") || lower.includes("download")) {
    return {
      content: l10nFn(lang, "📋 Documents can be picked up at the barangay hall during office hours. Digital copies are also available for download in your dashboard.", "📋 Ang mga dokumento ay maaaring kunin sa barangay hall sa oras ng opisina. May digital copy din sa dashboard."),
      confidence: 0.9,
    };
  }
  if (lower.includes("approve") || lower.includes("aprubahan") || lower.includes("how long")) {
    return {
      content: l10nFn(lang, "✅ Account approval usually takes 1-2 business days. You'll receive an email once approved.", "✅ Ang account approval ay karaniwang tumatagal ng 1-2 araw. Makakatanggap ka ng email kapag naaprubahan."),
      confidence: 0.9,
    };
  }
  if (lower.includes("id") && (lower.includes("need") || lower.includes("kailangan") || lower.includes("require"))) {
    return {
      content: l10nFn(lang, "✅ Yes, you need a valid government-issued ID (passport, driver's license, UMID, PhilSys ID, voter's ID, etc.) for most transactions.", "✅ Oo, kailangan mo ng valid government-issued ID para sa karamihan ng transaksyon."),
      confidence: 0.9,
    };
  }

  return {
    content: l10nFn(lang,
      "I'm not sure how to answer that yes/no question. Could you give me more context? For example:\n• Is the barangay open?\n• Are there any alerts?\n• Can I register online?\n• Is it raining?",
      "Hindi ko sigurado sa tanong. Maaari mo bang bigyan ako ng karagdagang konteksto? Halimbawa:\n• Bukas ba ang barangay?\n• May alerto ba?\n• Pwede ba mag-register online?\n• Umuulan ba?",
      "Dimo ko sigurado sa tanong. Pwede mo bang bigyan ako nin karagdagang konteksto?"
    ),
    suggestions: [
      l10nFn(lang, "Is the barangay open?", "Bukas ba ang barangay?", "Bukas ba an barangay?"),
      l10nFn(lang, "Any active alerts?", "May alerto ba?", "May alerto ba?"),
      l10nFn(lang, "Can I register?", "Pwede ba mag-register?", "Pwede ba mag-register?"),
    ],
    confidence: 0.5,
  };
}

function answerQuantity(input: string, context: AIContext, keywords: string[]): { content: string; suggestions?: string[]; actions?: QuickAction[]; confidence?: number; sources?: string[] } {
  const { lang, stats, info, activeAlerts = [], residents = [], households = [], volunteers = [], events = [], documents = [], incidents = [], evacCenters = [], officials = [] } = context;
  const lower = input.toLowerCase();
  const sources: string[] = [];
  const totalResidents = residents.length > 0 ? residents.length : (stats?.residents || 0);
  const totalHouseholds = households.length > 0 ? households.length : (stats?.households || 0);
  const totalVolunteers = volunteers.length > 0 ? volunteers.length : (stats?.volunteers || 0);

  if (/\b(resident|residents|population|people|tao|ilang|how many people|how many residents)\b/.test(lower)) {
    sources.push("database:residents");
    return {
      content: l10nFn(lang, `📊 We have **${totalResidents.toLocaleString()}** registered residents in the barangay.`, `📊 Mayroon kaming **${totalResidents.toLocaleString()}** na nakarehistrong residente sa barangay.`),
      sources,
      confidence: 0.95,
    };
  }
  if (/\b(household|households|pamilya|family|how many family)\b/.test(lower)) {
    sources.push("database:households");
    return {
      content: l10nFn(lang, `🏠 There are **${totalHouseholds.toLocaleString()}** registered households.`, `🏠 May **${totalHouseholds.toLocaleString()}** na nakarehistrong household.`),
      sources,
      confidence: 0.95,
    };
  }
  if (/\b(volunteer|volunteers|boluntaryo)\b/.test(lower)) {
    sources.push("database:volunteers");
    return {
      content: l10nFn(lang, `🙋 We have **${totalVolunteers.toLocaleString()}** active volunteers.`, `🙋 Mayroon kaming **${totalVolunteers.toLocaleString()}** na aktibong boluntaryo.`),
      sources,
      confidence: 0.95,
    };
  }
  if (/\b(event|events|activity|gathering|program|how many events)\b/.test(lower)) {
    sources.push("database:events");
    return {
      content: l10nFn(lang, `📅 We have **${events.length.toLocaleString()}** community events.`, `📅 Mayroon kaming **${events.length.toLocaleString()}** na event sa komunidad.`),
      sources,
      confidence: 0.95,
    };
  }
  if (/\b(document|documents|certificate|request|how many documents)\b/.test(lower)) {
    sources.push("database:documents");
    return {
      content: l10nFn(lang, `📄 Total document requests: **${documents.length.toLocaleString()}** (Pending: ${documents.filter((d: any) => d.status === "pending").length}, Approved: ${documents.filter((d: any) => d.status === "approved").length}).`, `📄 Kabuuang dokumento: **${documents.length.toLocaleString()}** (Nakabinbin: ${documents.filter((d: any) => d.status === "pending").length}, Aprubado: ${documents.filter((d: any) => d.status === "approved").length}).`),
      sources,
      confidence: 0.95,
    };
  }
  if (/\b(incident|incidents|report|insidente)\b/.test(lower)) {
    sources.push("database:incidents");
    return {
      content: l10nFn(lang, `⚠️ Total incidents: **${incidents.length.toLocaleString()}**.`, `⚠️ Kabuuang insidente: **${incidents.length.toLocaleString()}**.`),
      sources,
      confidence: 0.95,
    };
  }
  if (/\b(alert|alerts|warning|emergency|alerto)\b/.test(lower)) {
    const activeCount = activeAlerts.filter((a: any) => a.status === "active").length;
    sources.push("database:alerts");
    return {
      content: l10nFn(lang, `🚨 Active alerts: **${activeCount}** out of ${activeAlerts.length} total.`, `🚨 Aktibong alerto: **${activeCount}** sa ${activeAlerts.length} kabuuan.`),
      sources,
      confidence: 0.95,
    };
  }
  if (/\b(official|officials|kagawad|councilor|leader|pinuno)\b/.test(lower)) {
    sources.push("database:officials");
    return {
      content: l10nFn(lang, `👥 We have **${officials.length}** barangay officials.`, `👥 Mayroon kaming **${officials.length}** na opisyal ng barangay.`),
      sources,
      confidence: 0.95,
    };
  }
  if (/\b(evacuation|shelter|evac center)\b/.test(lower)) {
    sources.push("database:evac_centers");
    return {
      content: l10nFn(lang, `🏃 We have **${evacCenters.length}** designated evacuation centers.`, `🏃 Mayroon kaming **${evacCenters.length}** na itinalagang evacuation center.`),
      sources,
      confidence: 0.95,
    };
  }
  if (/\b(purok|zone|sitio|how many purok)\b/.test(lower)) {
    const purokSet = new Set(residents.map((r: any) => r.purok).filter(Boolean));
    return {
      content: l10nFn(lang, `📍 We have **${purokSet.size}** puroks/zones.`, `📍 Mayroon kaming **${purokSet.size}** na purok/zone.`),
      sources: ["database:residents"],
      confidence: 0.9,
    };
  }

  return {
    content: l10nFn(lang,
      "I can tell you how many of any of these we have:\n• Residents, Households, Volunteers\n• Events, Documents, Incidents\n• Active alerts, Officials, Evac centers\n\nTry asking 'How many residents do we have?' or 'How many documents are pending?'",
      "Maaari kong sabihin kung gaano karami ang mayroon kami sa:\n• Residente, Household, Boluntaryo\n• Event, Dokumento, Insidente\n• Aktibong alerto, Opisyal, Evac center\n\nSubukan mong magtanong 'Ilang residente ang mayroon?' o 'Ilang dokumento ang nakabinbin?'",
      "Maaari kong sabihin kung gaano karami an igwa kami sa:\n• Residente, Household, Boluntaryo\n• Event, Dokumento, Insidente"
    ),
    confidence: 0.5,
  };
}

function l10nFn(lang: Language, en: string, fil: string, bik?: string): string {
  if (lang === "en") return en;
  if (lang === "fil") return fil;
  return bik || fil;
}

const HISTORY_KEY = (lang: Language) => `ecagraray:chat-history:${lang}`;
const LLM_PREFS_KEY = "ecagraray:chat-llm-optin";

type SerializedMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestions?: string[];
};

const GREETING_PREFIXES: Record<Language, string[]> = {
  en: ["Hello", "Hi", "Hey"],
  fil: ["Kumusta", "Mabuhay"],
  bik: ["Marhay", "Mayong"],
};

function isGreetingContent(content: string | undefined, lang: Language): boolean {
  if (!content) return false;
  const lc = content.trim().toLowerCase();
  return GREETING_PREFIXES[lang].some((p) => lc.startsWith(p.toLowerCase()));
}

function defaultGreetingActions(): QuickAction[] {
  return [
    { label: "Document Services", icon: FileText, href: "#features" },
    { label: "Active Alerts", icon: AlertTriangle, href: "#features" },
  ];
}

function makeGreeting(lang: Language): Message {
  return {
    id: Date.now(),
    role: "assistant",
    content: greetings[lang],
    timestamp: new Date(),
    suggestions: ["Document services", "Active alerts", "Register", "Who is the captain?"],
    actions: defaultGreetingActions(),
  };
}

export function AIAssistant({ lang, context }: { lang: Language; context: AIContext }) {
  const [open, setOpen] = useState(false);
  const { mounted: aiMounted, dataState: aiState } = useAnimatedMount(open, 250);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content: greetings[lang],
      timestamp: new Date(),
      suggestions: ["Document services", "Active alerts", "Register", "Who is the captain?"],
      actions: [
        { label: "Document Services", icon: FileText, href: "#features" },
        { label: "Active Alerts", icon: AlertTriangle, href: "#features" },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [memory, setMemory] = useState<ConversationMemory>({ messageCount: 0, topics: [], followUps: [] });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [pulse, setPulse] = useState(true);

  // LLM opt-in state (opt-in so we never surprise users with API usage).
  const [useLLM, setUseLLM] = useState(false);
  const [llmAvailable, setLlmAvailable] = useState(false);
  const [llmBanner, setLlmBanner] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (open && unreadCount > 0) {
      setUnreadCount(0);
    }
  }, [open, unreadCount]);

  useEffect(() => {
    if (messages.length === 1 && open) {
      inputRef.current?.focus();
    }
  }, [open, messages.length]);

  // Restore conversation history for the current language.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(HISTORY_KEY(lang));
      if (raw) {
        const parsed = JSON.parse(raw) as SerializedMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Re-hydrate the default greeting only if the persisted first
          // message is one we recognise; otherwise prepend a fresh greeting.
          const restored: Message[] = parsed.map((m, idx) => {
            const ts = m.timestamp ? new Date(m.timestamp) : new Date();
            const safeTs = isNaN(ts.getTime()) ? new Date() : ts;
            const isGreeting = idx === 0 && isGreetingContent(m.content, lang);
            return {
              id: typeof m.id === "number" ? m.id : Date.now() + idx,
              role: m.role === "user" ? "user" : "assistant",
              content: typeof m.content === "string" ? m.content : "",
              timestamp: safeTs,
              suggestions: Array.isArray(m.suggestions)
                ? m.suggestions.filter((s) => typeof s === "string")
                : undefined,
              // Only re-attach the default action buttons to the greeting —
              // user/assistant replies never had them in the first place.
              actions: isGreeting ? defaultGreetingActions() : undefined,
            };
          });
          // Always make sure the conversation starts with the greeting.
          if (restored[0]?.role !== "assistant" || !isGreetingContent(restored[0].content, lang)) {
            restored.unshift(makeGreeting(lang));
          }
          setMessages(restored);
        }
      } else {
        setMessages([makeGreeting(lang)]);
      }
    } catch {
      setMessages([makeGreeting(lang)]);
    }
    setMemory({ messageCount: 0, topics: [], followUps: [] });
  }, [lang]);

  // Persist conversation history. We only write when the user has sent at
  // least one message; otherwise we keep the slot empty so the next mount
  // renders a fresh greeting. We also strip non-serialisable fields (the
  // Lucide icon refs and any callbacks) so JSON.stringify cannot turn them
  // into undefined and break the next render.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasUserTurn = messages.some((m) => m.role === "user");
    try {
      if (!hasUserTurn) {
        localStorage.removeItem(HISTORY_KEY(lang));
        return;
      }
      const trimmed: SerializedMessage[] = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-40)
        .map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp ?? ""),
          suggestions: Array.isArray(m.suggestions) ? m.suggestions : undefined,
          // Strip: actions (icon refs), onClick, typing, intent, data, sources.
        }));
      localStorage.setItem(HISTORY_KEY(lang), JSON.stringify(trimmed));
    } catch {
      // ignore quota / serialization errors
    }
  }, [messages, lang]);

  // Restore LLM opt-in preference and probe availability.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = localStorage.getItem(LLM_PREFS_KEY);
      if (v === "1") setUseLLM(true);
    } catch {
      // ignore
    }
    pingAI({})
      .then((r) => setLlmAvailable(!!r?.available))
      .catch(() => setLlmAvailable(false));
  }, []);

  const toggleLLM = useCallback(() => {
    setUseLLM((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LLM_PREFS_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      setLlmBanner(
        next
          ? lang === "en"
            ? "Cagri AI Pro is on — replies use the cloud LLM (still grounded in barangay facts)."
            : lang === "fil"
              ? "Naka-on ang Cagri AI Pro — gumagamit na ito ng cloud LLM."
              : "Naka-on an Cagri AI Pro — gumagamit na ini nin cloud LLM."
          : lang === "en"
            ? "Switched back to fast local mode."
            : lang === "fil"
              ? "Bumalik sa mabilis na local mode."
              : "Bumalik sa mabilisan local mode."
      );
      window.setTimeout(() => setLlmBanner(null), 4000);
      return next;
    });
  }, [lang]);

  // Listen for the global "open Cagri chat" event fired by AISearch / nav.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const openHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ prompt?: string }>).detail;
      setOpen(true);
      if (detail?.prompt) {
        // Defer so the input ref is mounted.
        window.setTimeout(() => {
          setInput(detail.prompt ?? "");
          inputRef.current?.focus();
        }, 50);
      }
    };
    window.addEventListener("cagri:open-chat", openHandler);
    return () => window.removeEventListener("cagri:open-chat", openHandler);
  }, []);

  // Mobile swipe-down-to-dismiss (only on touch devices when sheet is at the top).
  const touchStart = useRef<{ y: number; t: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 640) return; // desktop uses close button
    const t = e.touches[0];
    touchStart.current = { y: t.clientY, t: Date.now() };
  }, []);
  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (typeof window === "undefined") return;
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      const dy = t.clientY - start.y;
      const dt = Date.now() - start.t;
      if (dy > 80 && dt < 400) {
        setOpen(false);
      }
    },
    [],
  );

  const handleSend = (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || thinking) return;

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);
    setIsTyping(true);

    const { intent, entities, confidence, qtype, sentiment, keywords } = detectIntent(text, memory);
    const minDelay = 400;
    const maxDelay = 1100;
    const delay = Math.min(maxDelay, minDelay + Math.random() * (maxDelay - minDelay));

    setMemory((m) => ({
      ...m,
      lastIntent: intent,
      lastUserMessage: text,
      lastEntities: entities,
      messageCount: m.messageCount + 1,
      topics: [...m.topics.slice(-5), intent],
    }));

    // LLM path — opt-in, opt-in only. Falls through to rules on any failure.
    if (useLLM && llmAvailable) {
      askAI({
        data: {
          lang,
          messages: [
            ...messages
              .filter((m) => m.role === "user" || m.role === "assistant")
              .filter((m) => !m.typing)
              .slice(-6)
              .map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
        },
      })
        .then((res) => {
          const textOut = res?.usedLLM && res.text
            ? res.text
            : generateResponse(intent, entities, context, qtype, sentiment, keywords, text).content;
          appendAssistantReply(textOut, intent);
        })
        .catch(() => {
          const r = generateResponse(intent, entities, context, qtype, sentiment, keywords, text);
          appendAssistantReply(r.content, intent, r.suggestions, r.actions);
        });
      return;
    }

    setTimeout(() => {
      const response = generateResponse(intent, entities, context, qtype, sentiment, keywords, text);
      setIsTyping(false);
      const { content, suggestions: responseSuggestions, actions } = response;
      appendAssistantReply(content, intent, responseSuggestions, actions);
    }, delay);
  };

  // Shared "type out a reply and finalize it" helper. Used by both the
  // rules engine and the LLM path.
  const appendAssistantReply = (
    content: string,
    intent: string,
    responseSuggestions?: string[],
    actions?: QuickAction[],
  ) => {
    setIsTyping(false);
    const followUps = getFollowUps(intent, lang);
    const mergedSuggestions = responseSuggestions && responseSuggestions.length > 0
      ? responseSuggestions
      : followUps;

    const words = content.split(/(\s+)/);
    let currentText = "";
    let wordIndex = 0;
    const typingSpeed = Math.max(8, Math.min(20, 1500 / words.length));

    const typeInterval = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += words[wordIndex];
        wordIndex++;
        setMessages((prev) => {
          const newMsgs = [...prev];
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg && lastMsg.role === "assistant" && lastMsg.typing) {
            newMsgs[newMsgs.length - 1] = { ...lastMsg, content: currentText };
          } else {
            newMsgs.push({
              id: Date.now() + 1,
              role: "assistant",
              content: currentText,
              timestamp: new Date(),
              typing: true,
              suggestions: mergedSuggestions,
              actions: actions,
              intent,
            });
          }
          return newMsgs;
        });
      } else {
        clearInterval(typeInterval);
        setMessages((prev) => {
          const newMsgs = [...prev];
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg) {
            newMsgs[newMsgs.length - 1] = { ...lastMsg, typing: false, suggestions: mergedSuggestions };
          }
          return newMsgs;
        });
        setThinking(false);
      }
    }, typingSpeed);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    handleSend(suggestion);
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content: greetings[lang],
        timestamp: new Date(),
        suggestions: ["Document services", "Active alerts", "Register", "Who is the captain?"],
      },
    ]);
    setMemory({ messageCount: 0, topics: [], followUps: [] });
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(HISTORY_KEY(lang));
      } catch {
        // ignore
      }
    }
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 no-print">
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className={`group relative grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-110 ${pulse ? "ai-button-pulse" : ""}`}
            aria-label="Open AI Assistant"
          >
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-30" />
            <Brain className="relative h-7 w-7 sm:h-8 sm:w-8 transition-transform group-hover:rotate-12" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-lg animate-bounce">
                {unreadCount}
              </span>
            )}
            <span className="absolute right-full mr-3 hidden sm:flex items-center gap-2 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 px-3.5 py-2 text-xs font-bold text-foreground shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Ask Cagri AI
            </span>
          </button>
        )}
      </div>

      {aiMounted && (
        <div
          data-state={aiState}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm sm:bg-black/30 sm:backdrop-blur-md no-print data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={() => setOpen(false)}
        >
          <div
            ref={sheetRef}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            data-state={aiState}
            className="absolute inset-x-0 bottom-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:left-auto sm:top-auto w-full sm:w-[420px] sm:h-[680px] sm:max-h-[85vh] max-h-[92vh] bg-card/95 backdrop-blur-2xl sm:rounded-3xl rounded-t-3xl sm:rounded-b-3xl border border-border/40 shadow-2xl flex flex-col overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-4 data-[state=open]:slide-in-from-bottom-4 duration-200 sm:data-[state=closed]:slide-out-to-bottom-4 sm:data-[state=open]:slide-in-from-bottom-4"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative px-5 py-4 border-b border-border/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
              <div className="absolute inset-0 ai-header-glow pointer-events-none" />
              <div className="sm:hidden flex justify-center pt-1 pb-2">
                <GripHorizontal className="h-5 w-5 text-muted-foreground/60" aria-hidden="true" />
              </div>
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30">
                      <Brain className="h-5 w-5" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-foreground truncate">Cagri AI</span>
                      <Sparkles className="h-3 w-3 text-primary shrink-0" />
                      {useLLM && llmAvailable && (
                        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider">
                          <Wand2 className="h-2.5 w-2.5" />
                          Pro
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-success uppercase tracking-wider flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                      {useLLM && llmAvailable
                        ? (lang === "en" ? "Cloud LLM" : lang === "fil" ? "Cloud LLM" : "Cloud LLM")
                        : (lang === "en" ? "Online & Ready" : lang === "fil" ? "Handa Na" : "Andam Na")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {llmAvailable && (
                    <button
                      onClick={toggleLLM}
                      className={`grid h-9 w-9 place-items-center rounded-xl transition min-h-[44px] min-w-[44px] ${
                        useLLM
                          ? "bg-violet-500/15 text-violet-600 dark:text-violet-300 hover:bg-violet-500/25"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                      title={useLLM ? "Cagri AI Pro is on" : "Enable Cagri AI Pro (cloud LLM)"}
                      aria-label="Toggle Cagri AI Pro"
                      aria-pressed={useLLM}
                    >
                      <Wand2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={clearChat}
                    className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition min-h-[44px] min-w-[44px]"
                    title="Reset conversation"
                    aria-label="Reset conversation"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition min-h-[44px] min-w-[44px]"
                    title="Close"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="relative mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                <Zap className="h-3 w-3 text-primary" />
                <span className="font-bold uppercase tracking-wider">{taglines[lang]}</span>
                <span className="text-border">•</span>
                <span>{lang === "en" ? "Knows about Cagraray" : lang === "fil" ? "Alam ang Cagraray" : "Aram an Cagraray"}</span>
              </div>
              {llmBanner && (
                <div className="relative mt-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-[10.5px] font-semibold text-violet-700 dark:text-violet-200 animate-ai-fade-in">
                  {llmBanner}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 sm:px-5 overscroll-contain">
              {messages.map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-ai-fade-in`}
                >
                  {msg.role === "assistant" && idx === 0 && (
                    <div className="mr-2 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                      <Brain className="h-3.5 w-3.5" />
                    </div>
                  )}
                  {msg.role === "assistant" && idx > 0 && (
                    <div className="mr-2 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div className={`max-w-[80%] flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-md shadow-md shadow-primary/20"
                          : "bg-muted/60 text-foreground rounded-tl-md border border-border/30"
                      }`}
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {msg.content}
                      {msg.typing && (
                        <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-ai-cursor" />
                      )}
                    </div>
                    {msg.actions && msg.actions.length > 0 && !msg.typing && (
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {msg.actions.map((action, ai) => (
                          <a
                            key={ai}
                            href={action.href}
                            onClick={(e) => {
                              if (action.onClick) {
                                e.preventDefault();
                                action.onClick();
                              }
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/20 transition min-h-[36px]"
                          >
                            <action.icon className="h-3 w-3" />
                            {action.label}
                          </a>
                        ))}
                      </div>
                    )}
                    {msg.suggestions && msg.suggestions.length > 0 && !msg.typing && (
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {msg.suggestions.map((s, si) => (
                          <button
                            key={si}
                            onClick={() => handleSuggestion(s)}
                            className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-card/60 hover:bg-muted/60 hover:border-primary/40 px-3 py-1.5 text-[10.5px] font-semibold text-foreground transition min-h-[36px]"
                          >
                            <ChevronRight className="h-2.5 w-2.5" />
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="text-[9px] text-muted-foreground/60 font-medium px-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start animate-ai-fade-in">
                  <div className="mr-2 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md bg-muted/60 border border-border/30 px-4 py-3 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary/60 ai-typing-dot" />
                    <span className="h-2 w-2 rounded-full bg-primary/60 ai-typing-dot" style={{ animationDelay: "0.2s" }} />
                    <span className="h-2 w-2 rounded-full bg-primary/60 ai-typing-dot" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.filter((m) => m.role !== "system").length <= 1 && (
              <div className="border-t border-border/30 bg-card/40 px-3 pt-3 pb-2 sm:px-4">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-1 pb-1.5">
                  {lang === "en" ? "Quick start" : lang === "fil" ? "Mabilis na simula" : "Mabilisan na pagsimula"}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_REPLIES[lang].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q.prompt)}
                      className="group inline-flex items-center gap-1.5 rounded-xl border border-border/40 bg-card/70 hover:border-primary/40 hover:bg-primary/5 px-2.5 py-2 text-[11px] font-bold text-foreground transition min-h-[40px] text-left"
                    >
                      <q.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{q.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border/30 bg-card/60 backdrop-blur-md p-3 sm:p-4">
              <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-background/60 p-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={lang === "en" ? "Ask Cagri anything..." : lang === "fil" ? "Magtanong kay Cagri..." : "Magtanong ki Cagri..."}
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground min-h-[40px]"
                  disabled={thinking}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || thinking}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  aria-label="Send message"
                >
                  {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[9px] text-muted-foreground text-center mt-2 font-medium">
                {lang === "en" ? "AI responses are for guidance only. Verify with official LGU channels." : lang === "fil" ? "Ang mga sagot ng AI ay para sa gabay lamang. Kumpirmahin sa opisyal na LGU." : "An mga tubag nin AI iyo para sa gabay sana. Kumpirmahon sa opisyal na LGU."}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
