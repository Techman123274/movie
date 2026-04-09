const isBrowser = typeof window !== "undefined";

export const PREFERENCE_CHANGED_EVENT = "subflix:preference-changed";
export const ACTIVE_PROFILE_CHANGED_EVENT = "subflix:active-profile-changed";

export const MATURITY_OPTIONS = [
  { value: "all", label: "All Maturity Ratings" },
  { value: "teens", label: "Teens and below" },
  { value: "older_kids", label: "Older Kids and below" },
  { value: "little_kids", label: "Little Kids only" },
];

export const readPreference = (key, fallback = "") => {
  if (!isBrowser) {
    return fallback;
  }
  return window.localStorage.getItem(key) ?? fallback;
};

export const writePreference = (key, value) => {
  if (!isBrowser) {
    return;
  }
  window.localStorage.setItem(key, String(value));
  window.dispatchEvent(
    new CustomEvent(PREFERENCE_CHANGED_EVENT, {
      detail: { key, value: String(value) },
    })
  );
};

export const removePreference = (key) => {
  if (!isBrowser) {
    return;
  }
  window.localStorage.removeItem(key);
  window.dispatchEvent(
    new CustomEvent(PREFERENCE_CHANGED_EVENT, {
      detail: { key, value: null },
    })
  );
};

export const getProfileContentLevel = (profile) => {
  if (!profile) {
    return "all";
  }
  if (profile.is_kids) {
    return profile.maturity_rating || "older_kids";
  }
  return profile.maturity_rating || "all";
};

export const getProfileBadge = (profile) => {
  if (!profile) {
    return null;
  }
  if (profile.is_kids) {
    return "Kids";
  }
  return profile.maturity_rating && profile.maturity_rating !== "all"
    ? MATURITY_OPTIONS.find((option) => option.value === profile.maturity_rating)?.label || null
    : null;
};

const SAFE_GENRES = new Set([16, 35, 12, 14, 10751, 10402, 99, 10762]);
const LITTLE_KIDS_ALLOWED_GENRES = new Set([16, 35, 12, 14, 10751, 10402, 10762]);
const OLDER_KIDS_ALLOWED_GENRES = new Set([16, 35, 12, 14, 10751, 10402, 99, 10762]);
const TEEN_BLOCKED_GENRES = new Set([27, 53, 80, 10768]);
const KIDS_BLOCKED_GENRES = new Set([27, 53, 80, 9648, 10768, 10759, 10765, 10766]);
const MATURE_KEYWORDS = [
  "murder",
  "killer",
  "serial",
  "blood",
  "violent",
  "violence",
  "crime",
  "cartel",
  "drug",
  "sex",
  "sexual",
  "nudity",
  "rape",
  "abuse",
  "war",
  "terror",
  "demon",
  "haunted",
  "ghost",
  "slasher",
  "prison",
  "mafia",
  "gang",
  "suicide",
];
const ADULT_ANIMATION_PATTERNS = [
  "family guy",
  "the simpsons",
  "simpsons",
  "south park",
  "rick and morty",
  "american dad",
  "big mouth",
  "bojack horseman",
  "solar opposites",
  "f is for family",
  "robot chicken",
  "drawn together",
  "mr. pickles",
  "the boondocks",
  "harley quinn",
  "archer",
  "inside job",
  "human resources",
  "disenchantment",
  "sausage party",
];

const getGenreIds = (item) =>
  item.genre_ids ||
  item.genres?.map((genre) => genre.id) ||
  [];

const hasGenre = (item, genreSet) => getGenreIds(item).some((id) => genreSet.has(id));
const allGenresAllowed = (item, allowedSet) => getGenreIds(item).every((id) => allowedSet.has(id));
const getProfileText = (item) =>
  `${item.title || item.name || ""} ${item.overview || ""}`.toLowerCase();
const hasMatureKeyword = (item) => MATURE_KEYWORDS.some((keyword) => getProfileText(item).includes(keyword));
const isAdultAnimationTitle = (item) =>
  ADULT_ANIMATION_PATTERNS.some((pattern) => getProfileText(item).includes(pattern));

export const isAllowedForProfile = (item, profile) => {
  if (!item || !profile) {
    return true;
  }

  const level = getProfileContentLevel(profile);
  if (level === "all") {
    return item.adult !== true;
  }

  if (item.adult === true) {
    return false;
  }

  if (profile.is_kids && isAdultAnimationTitle(item)) {
    return false;
  }

  if (level === "teens") {
    return !hasGenre(item, TEEN_BLOCKED_GENRES) && !hasMatureKeyword(item);
  }

  if (level === "older_kids") {
    const genreIds = getGenreIds(item);
    if (genreIds.length === 0) {
      return false;
    }
    return !hasGenre(item, KIDS_BLOCKED_GENRES) &&
      !hasMatureKeyword(item) &&
      allGenresAllowed(item, OLDER_KIDS_ALLOWED_GENRES);
  }

  if (level === "little_kids") {
    const genreIds = getGenreIds(item);
    if (genreIds.length === 0) {
      return false;
    }
    return !hasMatureKeyword(item) &&
      allGenresAllowed(item, LITTLE_KIDS_ALLOWED_GENRES) &&
      genreIds.some((id) => SAFE_GENRES.has(id));
  }

  return true;
};

export const filterItemsForProfile = (items, profile) =>
  (items || []).filter((item) => isAllowedForProfile(item, profile));

export const ACTIVE_PROFILE_STORAGE_KEY = "subflix_active_profile";

export const saveActiveProfile = (profile) => {
  if (!isBrowser) {
    return;
  }
  if (!profile) {
    removePreference(ACTIVE_PROFILE_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent(ACTIVE_PROFILE_CHANGED_EVENT, {
        detail: { profile: null },
      })
    );
    return;
  }
  window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(
    new CustomEvent(ACTIVE_PROFILE_CHANGED_EVENT, {
      detail: { profile },
    })
  );
};

export const readActiveProfile = () => {
  if (!isBrowser) {
    return null;
  }

  const raw = window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
