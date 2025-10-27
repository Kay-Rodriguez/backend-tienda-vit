import { usuarios as Users } from "../models/usuario.js";
import { supabaseAdmin } from "../config/supabaseClient.js";

/* =========================================================
   🧩 HU-003 Gestionar perfil
========================================================= */

// ✅ Obtener perfil propio
export async function me(req, res) {
  try {
    const u = await Users.findById(req.user.id);
    if (!u) return res.status(404).json({ message: "Usuario no encontrado." });

    const { password_hash, ...safe } = u;
    res.json(safe);
  } catch (err) {
    console.error("❌ Error al obtener perfil:", err);
    res.status(500).json({ message: "Error interno." });
  }
}

// ✅ Actualizar perfil (solo datos permitidos)
export async function updateMe(req, res) {
  try {
    const allowed = ["nombre", "apellido", "celular", "provincia", "avatar"];
    const patch = {};

    for (const k of allowed) if (k in req.body) patch[k] = req.body[k];

    const updated = await Users.updateById(req.user.id, {
      ...patch,
      updated_at: new Date().toISOString(),
    });

    const { password_hash, ...safe } = updated;
    res.json({ message: "Perfil actualizado correctamente.", user: safe });
  } catch (err) {
    console.error("❌ Error al actualizar perfil:", err);
    res.status(500).json({ message: "Error interno." });
  }
}

// ✅ Obtener usuario por ID (solo admin)
export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Usuario no encontrado." });
    res.json(data);
  } catch (err) {
    console.error("❌ Error al obtener usuario:", err);
    res.status(500).json({ message: "Error interno." });
  }
}

 /*========================================================
   🧑‍💼 ADMINISTRACIÓN DE USUARIOS
========================================================= 

// Listar usuarios (paginado + búsqueda)
export async function listUsers(req, res) {
  try {
    const { page, size, q } = req.query;
    const result = await Users.list({
      page: Number(page) || 1,
      size: Number(size) || 20,
      q,
    });
    res.json(result);
  } catch (err) {
    console.error("❌ Error al listar usuarios:", err);
    res.status(500).json({ error: "Error al listar usuarios" });
  }
}

// Crear usuario (solo admin)
export async function adminCreateUser(req, res) {
  try {
    const {
      email,
      password,
      nombre,
      apellido,
      celular,
      provincia,
      role = "cliente",
    } = req.body;

    if (!email || !password || !nombre || !apellido || !celular || !provincia) {
      return res
        .status(400)
        .json({ message: "Faltan campos obligatorios para crear el usuario." });
    }

    const bcrypt = await import("bcrypt");
    const password_hash = await bcrypt.default.hash(password, 12);

    const user = await Users.create({
      email,
      password_hash,
      nombre,
      apellido,
      celular,
      provincia,
      role,
      is_verified: true,
    });

    res.status(201).json(user);
  } catch (err) {
    console.error("❌ Error al crear usuario:", err);
    res.status(500).json({ error: "Error al crear usuario" });
  }
}

// Actualizar usuario (solo admin)
export async function adminUpdateUser(req, res) {
  try {
    const { id } = req.params;
    const allowed = [
      "nombre",
      "apellido",
      "celular",
      "provincia",
      "role",
      "is_verified",
    ];

    const patch = {};
    for (const k of allowed) if (k in req.body) patch[k] = req.body[k];

    const updated = await Users.updateById(id, patch);
    res.json(updated);
  } catch (err) {
    console.error("❌ Error al actualizar usuario (admin):", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
}

// Eliminar usuario (solo admin)
export async function adminDeleteUser(req, res) {
  try {
    const { id } = req.params;
    await Users.deleteById(id);
    res.json({ message: "Usuario eliminado correctamente." });
  } catch (err) {
    console.error("❌ Error al eliminar usuario:", err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
} */
