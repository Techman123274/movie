import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const avatarDir = path.join(projectRoot, "src", "assets", "avatars");
const bucket = process.env.SUPABASE_PROFILE_AVATAR_BUCKET || "profile-avatars";
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const formatLabel = (fileName) =>
  fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Profile Avatar";

const main = async () => {
  const files = (await readdir(avatarDir))
    .filter((fileName) => /\.(png|jpe?g|webp|avif|gif)$/i.test(fileName))
    .sort((left, right) => left.localeCompare(right));

  if (files.length === 0) {
    console.log("No avatar images found to seed.");
    return;
  }

  const summary = [];

  for (const [index, fileName] of files.entries()) {
    const filePath = path.join(avatarDir, fileName);
    const storagePath = `system/${fileName}`;
    const fileBuffer = await readFile(filePath);

    const { error: uploadError } = await client.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        cacheControl: "3600",
        contentType: undefined,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(storagePath);
    const payload = {
      user_id: null,
      asset_kind: "builtin",
      storage_path: storagePath,
      public_url: publicUrlData?.publicUrl || "",
      label: formatLabel(fileName),
      legacy_avatar_index: 8 + index,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: existingError } = await client
      .from("profile_avatar_assets")
      .select("id")
      .eq("storage_path", storagePath)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing?.id) {
      const { error } = await client
        .from("profile_avatar_assets")
        .update(payload)
        .eq("id", existing.id);

      if (error) {
        throw error;
      }
    } else {
      const { error } = await client
        .from("profile_avatar_assets")
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }
    }

    summary.push(storagePath);
  }

  console.log(`Seeded ${summary.length} built-in avatars to bucket "${bucket}".`);
};

main().catch((error) => {
  console.error("Avatar seed failed:", error.message || error);
  process.exit(1);
});
