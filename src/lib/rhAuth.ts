import { rhSupabase, rhTenantId } from "./rhSupabase";

export const signInRH = async (email: string, password: string) => {
  if (!rhSupabase) throw new Error("Supabase RH não configurado.");
  const { data, error } = await rhSupabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOutRH = async () => {
  if (!rhSupabase) return;
  const { error } = await rhSupabase.auth.signOut();
  if (error) throw error;
};

export const requestRHPasswordReset = async (email: string) => {
  if (!rhSupabase) throw new Error("Supabase RH não configurado.");
  const { error } = await rhSupabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

export const getCurrentRHMember = async () => {
  if (!rhSupabase) return null;
  const { data: sessionData } = await rhSupabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user || !rhTenantId) return null;

  const { data, error } = await rhSupabase
    .from("rh_tenant_members")
    .select("*")
    .eq("tenant_id", rhTenantId)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
};
