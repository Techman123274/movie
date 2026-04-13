import { base44 } from "@/api/base44Client";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

export const getOtherFriendEmail = (requestRow, myEmail) => {
  const mine = normalizeEmail(myEmail);
  const requester = normalizeEmail(requestRow?.requester_email);
  const addressee = normalizeEmail(requestRow?.addressee_email);
  if (!mine || !requester || !addressee) {
    return "";
  }
  return requester === mine ? addressee : requester;
};

export const listFriendRequests = async () => base44.friends.listRequests();

export const sendFriendRequest = async ({ email, name = "" } = {}) => {
  const entry = await base44.friends.sendRequest({ email, name });
  return entry;
};

export const acceptFriendRequest = async (id) =>
  base44.friends.updateRequestStatus({ id, status: "accepted" });

export const declineFriendRequest = async (id) =>
  base44.friends.updateRequestStatus({ id, status: "declined" });

export const cancelFriendRequest = async (id) =>
  base44.friends.updateRequestStatus({ id, status: "cancelled" });

export const removeFriend = async (id) =>
  base44.friends.updateRequestStatus({ id, status: "removed" });

