import { supabaseAdmin } from "../config/supabaseClient.js";

export const usuarios = {
  async findByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return data || null;
  },
  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },
  async create(user) {
    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .insert(user)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async updateById(id, patch) {
    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async deleteById(id) {
    const { error } = await supabaseAdmin
      .from("usuarios")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
  async list({ page = 1, size = 20, q }) {
    const from = (page - 1) * size;
    const to = from + size - 1;
    let query = supabaseAdmin
      .from("usuarios")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (q) query = query.ilike("email", `%${q}%`);
    const { data, error, count } = await query.range(from, to);
    if (error) throw error;
    return { data, count, page, size };
  },
};

export const Tokens = {
  async createVerify(usuario_id, token, expira_en) {
    const { error } = await supabaseAdmin.from("tokens").insert({
      usuario_id,
      tipo: "verificacion_email",
      token,
      expira_en,
    });
    if (error) throw error;
  },
  async getVerify(token) {
    const { data, error } = await supabaseAdmin
      .from("tokens")
      .select("*")
      .eq("token", token)
      .eq("tipo", "verificacion_email")
      .single();
    if (error) throw error;
    return data;
  },
  async deleteVerify(id) {
    const { error } = await supabaseAdmin
      .from("tokens")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
  async createReset(usuario_id, token, expira_en) {
    const { error } = await supabaseAdmin.from("tokens").insert({
      usuario_id,
      tipo: "recuperacion_password",
      token,
      expira_en,
    });
    if (error) throw error;
  },
  async getReset(token) {
    const { data, error } = await supabaseAdmin
      .from("tokens")
      .select("*")
      .eq("token", token)
      .eq("tipo", "recuperacion_password")
      .single();
    if (error) throw error;
    return data;
  },
  async deleteReset(id) {
    const { error } = await supabaseAdmin
      .from("tokens")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
