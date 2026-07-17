import { rhSupabase, rhTenantId } from "./rhSupabase";

type RHBucket = "rh-employee-photos" | "rh-employee-documents" | "rh-payslips" | "rh-signatures";

const sanitizeFileName = (fileName: string) =>
  fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

export const uploadRHFile = async (bucket: RHBucket, employeeId: string, file: File) => {
  if (!rhSupabase || !rhTenantId) throw new Error("Supabase RH não configurado.");

  const path = `${rhTenantId}/${employeeId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { data, error } = await rhSupabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;
  return data.path;
};

export const createRHFileSignedUrl = async (bucket: RHBucket, path: string, expiresIn = 600) => {
  if (!rhSupabase) throw new Error("Supabase RH não configurado.");
  const { data, error } = await rhSupabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
};
