import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { filterItemsForProfile } from "@/lib/preferences";
import { listGlobalSocialFeed, SOCIAL_CHANGED_EVENT } from "@/lib/social";
import { useAppTheme } from "@/lib/theme";
import { useAppOutletContext } from "@/lib/outlet-context";
import {
  getOtherFriendEmail,
  listFriendRequests,
  sendFriendRequest,
} from "@/lib/friends";
import { listFriendsPresence } from "@/lib/presence";
import {
  createGroupThread,
  getOrCreateDmThread,
  listMyThreads,
  listThreadMembers,
  listThreadMessages,
  markThreadRead,
  sendChatMessage,
} from "@/lib/chat";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

export default function SocialHub() {
  const { user, activeProfile } = useAppOutletContext();
  const { themeDefinition } = useAppTheme();
  const isHulu = themeDefinition.shellVariant === "hulu";
  const navigate = useNavigate();

  const [tab, setTab] = useState("friends");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const [friendEmail, setFriendEmail] = useState("");
  const [friendName, setFriendName] = useState("");
  const [friendRequests, setFriendRequests] = useState({ incoming: [], outgoing: [], accepted: [] });
  const [presenceRows, setPresenceRows] = useState([]);

  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [selectedThreadMembers, setSelectedThreadMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef(null);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupMembersText, setGroupMembersText] = useState("");

  // community
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const showNotice = (message) => {
    setNotice(message);
    if (typeof window !== "undefined") {
      window.setTimeout(() => setNotice(""), 2200);
    }
  };

  const loadFeed = async () => {
    setLoading(true);
    const items = await listGlobalSocialFeed({ limit: 80 }).catch(() => []);
    setFeedItems(items);
    setLoading(false);
  };

  const refreshFriends = async () => {
    const requests = await listFriendRequests().catch(() => ({ incoming: [], outgoing: [], accepted: [] }));
    setFriendRequests(requests);

    const emails = (requests.accepted || [])
      .map((row) => getOtherFriendEmail(row, user?.email))
      .filter(Boolean);

    const rows = await listFriendsPresence(emails).catch(() => []);
    setPresenceRows(rows);
  };

  const refreshThreads = async () => {
    const rows = await listMyThreads().catch(() => []);
    setThreads(rows);
  };

  const refreshSelectedThread = async (threadId) => {
    if (!threadId) {
      return;
    }

    const [memberRows, messageRows] = await Promise.all([
      listThreadMembers(threadId).catch(() => []),
      listThreadMessages(threadId, 120).catch(() => []),
    ]);

    setSelectedThreadMembers(memberRows);
    setMessages(messageRows);
    markThreadRead(threadId);
  };

  useEffect(() => {
    loadFeed();

    const handleSocialChange = () => {
      loadFeed();
    };

    window.addEventListener(SOCIAL_CHANGED_EVENT, handleSocialChange);
    return () => window.removeEventListener(SOCIAL_CHANGED_EVENT, handleSocialChange);
  }, []);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    void refreshFriends();
    void refreshThreads();
    return undefined;
  }, [user?.email]);

  useEffect(() => {
    if (tab !== "friends" || !user) {
      return undefined;
    }

    void refreshFriends();
    const timer = window.setInterval(() => void refreshFriends(), 12_000);
    return () => window.clearInterval(timer);
  }, [tab, user?.email]);

  useEffect(() => {
    if (tab !== "chat" || !user) {
      return undefined;
    }

    void refreshThreads();
    const timer = window.setInterval(() => void refreshThreads(), 7_000);
    return () => window.clearInterval(timer);
  }, [tab, user?.email]);

  useEffect(() => {
    if (tab !== "chat" || !selectedThread?.id) {
      return undefined;
    }

    void refreshSelectedThread(selectedThread.id);
    const timer = window.setInterval(() => void refreshSelectedThread(selectedThread.id), 3_000);
    return () => window.clearInterval(timer);
  }, [selectedThread?.id, tab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, selectedThread?.id]);

  const presenceByEmail = useMemo(() => {
    const map = new Map();
    presenceRows.forEach((row) => {
      if (row?.user_email) {
        map.set(String(row.user_email).toLowerCase(), row);
      }
    });
    return map;
  }, [presenceRows]);

  const acceptedFriends = useMemo(() => {
    const mine = normalizeEmail(user?.email);
    return (friendRequests.accepted || [])
      .map((row) => {
        const otherEmail = getOtherFriendEmail(row, mine);
        return {
          id: row.id,
          email: otherEmail,
          presence: otherEmail ? presenceByEmail.get(String(otherEmail).toLowerCase()) : null,
        };
      })
      .filter((row) => row.email);
  }, [friendRequests.accepted, presenceByEmail, user?.email]);

  const isPresenceOnline = (presence) => {
    const updatedAt = presence?.last_seen_at || presence?.updated_at;
    if (!updatedAt) {
      return false;
    }
    const ageMs = Date.now() - new Date(updatedAt).getTime();
    return ageMs < 70_000;
  };

  const sendRequest = async (event) => {
    event.preventDefault();
    if (!friendEmail.trim()) {
      return;
    }

    try {
      setBusy(true);
      await sendFriendRequest({ email: friendEmail, name: friendName });
      setFriendEmail("");
      setFriendName("");
      showNotice("Friend request sent.");
      await refreshFriends();
    } catch (error) {
      showNotice(error?.message || "Could not send that friend request yet.");
    } finally {
      setBusy(false);
    }
  };

  const runRequestAction = async (fn, id, message) => {
    try {
      setBusy(true);
      await fn(id);
      showNotice(message);
      await refreshFriends();
    } catch (error) {
      showNotice(error?.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const openDmForFriend = async (email) => {
    if (!email) {
      return;
    }

    try {
      setBusy(true);
      const thread = await getOrCreateDmThread(email);
      setTab("chat");
      setSelectedThread(thread);
      await refreshThreads();
    } catch (error) {
      showNotice(error?.message || "Could not open chat yet.");
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedThread?.id || !messageText.trim()) {
      return;
    }

    try {
      setBusy(true);
      await sendChatMessage({
        threadId: selectedThread.id,
        messageText,
        senderName: activeProfile?.name || user?.full_name || user?.email,
        senderAvatarUrl: activeProfile?.avatar_asset_url || user?.image_url || null,
      });
      setMessageText("");
      await refreshSelectedThread(selectedThread.id);
      await refreshThreads();
    } catch (error) {
      showNotice(error?.message || "Could not send message yet.");
    } finally {
      setBusy(false);
    }
  };

  const submitCreateGroup = async (event) => {
    event.preventDefault();
    const memberEmails = groupMembersText
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    try {
      setBusy(true);
      const thread = await createGroupThread({ title: groupTitle, memberEmails });
      setGroupTitle("");
      setGroupMembersText("");
      showNotice("Group created.");
      setTab("chat");
      setSelectedThread(thread);
      await refreshThreads();
    } catch (error) {
      showNotice(error?.message || "Could not create group yet.");
    } finally {
      setBusy(false);
    }
  };

  const getActorName = (entry) =>
    entry.actor_name || entry.profile_name || entry.created_by || "Subflix Member";

  const getActionCopy = (entry) => {
    switch (entry.activity_type) {
      case "liked":
        return "liked";
      case "rated":
        return `rated ${entry.rating_value || ""}/5`;
      case "watchlist_added":
        return "saved to My List";
      case "watch_started":
        return "started watching";
      case "commented":
      case "comment":
        return "commented";
      default:
        return "shared";
    }
  };

  const visibleFeed = useMemo(() => {
    const normalized = feedItems.map((entry) => ({
      ...entry,
      adult: Boolean(entry.is_adult),
      id: entry.tmdb_id,
    }));

    return filterItemsForProfile(normalized, activeProfile);
  }, [feedItems, activeProfile]);

  const stats = useMemo(() => {
    const ratings = visibleFeed.filter((entry) => entry.activity_type === "rated");
    const comments = visibleFeed.filter((entry) => entry.activity_type === "comment" || entry.activity_type === "commented");
    const members = new Set(visibleFeed.map(getActorName).filter(Boolean));

    return {
      comments: comments.length,
      members: members.size,
      ratings: ratings.length,
    };
  }, [visibleFeed]);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 pb-28 pt-24 text-white md:px-12 md:pb-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[var(--brand)]">Community</p>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Social Hub</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400 md:text-base">
              Friends, chat, presence, and community activity—all in one place.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            {[
              { id: "friends", label: "Friends" },
              { id: "chat", label: "Chat" },
              { id: "community", label: "Community" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`min-h-10 rounded-xl px-3 text-xs font-semibold uppercase tracking-[0.18em] transition-colors md:text-sm ${
                  tab === t.id ? "bg-white text-black" : "text-white/75 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {notice && <p className="mb-4 text-sm text-[#86efac]">{notice}</p>}

        {tab === "friends" ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-gray-400">
            Loading friends…
          </div>
        ) : tab === "chat" ? (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-gray-400">
            Loading chat…
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-gray-400">
            Loading community…
          </div>
        )}
      </div>
    </div>
  );
}
