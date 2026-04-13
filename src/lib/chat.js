import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "subflix:chat:last-read";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const readLastReadMap = () => {
  if (typeof window === "undefined") {
    return Object.create(null);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") {
      return Object.create(null);
    }

    const safeMap = Object.create(null);
    Object.entries(parsed).forEach(([key, value]) => {
      safeMap[String(key)] = typeof value === "string" ? value : null;
    });

    return safeMap;
  } catch {
    return Object.create(null);
  }
};

const writeLastReadMap = (map) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map || {}));
};

export const getLastReadAt = (threadId) => {
  const map = readLastReadMap();
  return map?.[threadId] || null;
};

export const markThreadRead = (threadId, atIso = new Date().toISOString()) => {
  if (!threadId) {
    return;
  }

  const map = readLastReadMap();
  map[threadId] = atIso;
  writeLastReadMap(map);
};

export const listMyThreads = async () => base44.chat.listMyThreads();

export const listThreadMembers = async (threadId) => base44.chat.listThreadMembers(threadId);

export const listThreadMessages = async (threadId, limit = 80) =>
  base44.chat.listThreadMessages(threadId, limit);

export const sendChatMessage = async ({ threadId, messageText, senderName, senderAvatarUrl }) =>
  base44.chat.sendMessage({ threadId, messageText, senderName, senderAvatarUrl });

export const getOrCreateDmThread = async (friendEmail) =>
  base44.chat.getOrCreateDmThread(normalizeEmail(friendEmail));

export const createGroupThread = async ({ title, memberEmails }) =>
  base44.chat.createGroupThread({ title, memberEmails });

export const leaveThread = async (threadId) => base44.chat.leaveThread(threadId);
