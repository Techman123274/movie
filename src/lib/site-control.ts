import { auth, currentUser } from "@clerk/nextjs/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";

type SiteControlState = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updatedAt: string;
  updatedBy: string | null;
};

type SiteControlUpdate = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updatedBy: string | null;
};

const SITE_CONTROL_PATH = path.join(process.cwd(), "data", "site-control.json");

const DEFAULT_SITE_CONTROL_STATE: SiteControlState = {
  maintenanceMode: false,
  maintenanceMessage: "Subflix is getting a quick polish. We'll be back shortly.",
  updatedAt: new Date(0).toISOString(),
  updatedBy: null,
};

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? null;
}

async function ensureSiteControlFile() {
  await fs.mkdir(path.dirname(SITE_CONTROL_PATH), { recursive: true });

  try {
    await fs.access(SITE_CONTROL_PATH);
  } catch {
    await fs.writeFile(SITE_CONTROL_PATH, `${JSON.stringify(DEFAULT_SITE_CONTROL_STATE, null, 2)}\n`, "utf8");
  }
}

async function readSiteControlStateFromDisk(): Promise<SiteControlState> {
  await ensureSiteControlFile();

  try {
    const raw = await fs.readFile(SITE_CONTROL_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<SiteControlState>;

    return {
      maintenanceMode: Boolean(parsed.maintenanceMode),
      maintenanceMessage: parsed.maintenanceMessage?.trim() || DEFAULT_SITE_CONTROL_STATE.maintenanceMessage,
      updatedAt: parsed.updatedAt || DEFAULT_SITE_CONTROL_STATE.updatedAt,
      updatedBy: parsed.updatedBy ?? null,
    };
  } catch {
    return DEFAULT_SITE_CONTROL_STATE;
  }
}

export async function getSiteControlState() {
  await connection();
  return readSiteControlStateFromDisk();
}

export async function updateSiteControlState(nextState: SiteControlUpdate) {
  await ensureSiteControlFile();

  const resolvedState: SiteControlState = {
    maintenanceMode: nextState.maintenanceMode,
    maintenanceMessage: nextState.maintenanceMessage.trim() || DEFAULT_SITE_CONTROL_STATE.maintenanceMessage,
    updatedAt: new Date().toISOString(),
    updatedBy: nextState.updatedBy,
  };

  await fs.writeFile(SITE_CONTROL_PATH, `${JSON.stringify(resolvedState, null, 2)}\n`, "utf8");

  return resolvedState;
}

export async function getAdminContext() {
  const { userId } = await auth();

  if (!userId) {
    return {
      userId: null,
      email: null,
      isAdmin: false,
      hasExplicitAllowList: env.admin.emails.length > 0,
    };
  }

  const user = await currentUser();
  const email = normalizeEmail(user?.emailAddresses[0]?.emailAddress ?? null);
  const allowedEmails = env.admin.emails.map((entry) => entry.toLowerCase());

  return {
    userId,
    email,
    isAdmin: allowedEmails.length ? Boolean(email && allowedEmails.includes(email)) : true,
    hasExplicitAllowList: allowedEmails.length > 0,
  };
}

export async function requireAdminAccess() {
  const admin = await getAdminContext();

  if (!admin.userId) {
    redirect("/sign-in");
  }

  if (!admin.isAdmin) {
    redirect("/browse");
  }

  return admin;
}
