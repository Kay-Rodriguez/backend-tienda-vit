import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { persistSession: false } }
);

(async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .select("count", { count: "exact", head: true });
    if (error) throw error;
    console.log("✅ Conectado a Supabase correctamente");
  } catch (err) {
    console.error("❌ Error al conectar con Supabase:", err.message);
  }
})();
