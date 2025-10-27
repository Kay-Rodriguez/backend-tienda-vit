/*import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { usuarios as Users, Tokens } from '../models/usuario.js';
import { sendMail } from '../config/nodemailer.js';
import { signJwt } from '../middlewares/JWT.js';
import { supabase } from "../config/supabaseClient.js";

const TOKEN_HOURS = 24;

function addHours(date, h) {
  const d = new Date(date);
  d.setHours(d.getHours() + h);
  return d.toISOString();}

// Registro
export async function register(req, res) {
  const { email, password, nombre, apellido, celular, provincia } = req.body;
  if (!email || !password || !nombre || !apellido || !celular || !provincia) {
    return res.status(400).json({ message: 'Campos obligatorios' });
  }
  const exists = await Users.findByEmail(email);
  if (exists) return res.status(409).json({ message: 'Email ya registrado' });

  const password_hash = await bcrypt.hash(password, 12);
  const user = await Users.create({ email, password_hash, nombre, apellido, celular, provincia, role: 'cliente' });

  // token de verificación
  const token = uuidv4();
  await Tokens.createVerify(user.id, token, addHours(new Date(), TOKEN_HOURS));

  const verifyUrl = `${process.env.FRONTEND_URL}/verify/${token}`;
  await sendMail({
    to: user.email,
    subject: 'Verifica tu cuenta en VIT - Plataforma de Atención al Cliente 💬',
    html: `<h1> 🛒¡Bienvenido/a a VIT!🛍</h1>
    <p>Hola ${user.nombre},</p>
           <p>Por favor verifica tu cuenta haciendo click en el siguiente enlace:</p>
           <p><a href="${verifyUrl}">${verifyUrl}</a></p>
           <p>Este enlace expira en ${TOKEN_HOURS} horas.</p>
           <p>💙 VIT 💙<p>
           <p>Gracias por registrarte en nuestra plataforma. Somos una plataforma de comercio electrónico diseñada para Ecuador. Disfruta de un catálogo de productos cuidadosamente seleccionado, un carrito de compras inteligente y un chatbot con inteligencia artificial que resuelve tus dudas al instante.</p>
            <hr>`
  });
 res.status(201).json({ message: 'Usuario creado. Revisa tu correo para verificar la cuenta.' });
}
// Verificación
export async function verify(req, res) {
  const token = req.params.token;
  if (!token) return res.status(400).json({ message: "Token requerido" });

  const row = await Tokens.getVerify(token);
  if (!row) return res.status(400).json({ message: "Token inválido" });

  if (new Date(row.expira_en) < new Date()) {
    await Tokens.deleteVerify(row.id);
    return res.status(400).json({ message: "Token expirado" });
  }

  await Users.updateById(row.usuario_id, { is_verified: true });
  await Tokens.deleteVerify(row.id);
  res.json({ message: "Cuenta verificada con éxito" });
}

// Login
export async function login(req, res) {
  const { email, password } = req.body;
  const user = await Users.findByEmail(email);
  if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });
  if (!user.is_verified) return res.status(403).json({ message: 'Cuenta no verificada' });

  const token = signJwt({ id: user.id, role: user.role, email: user.email });
  return res.json({ token, user: { id: user.id, email: user.email, nombre: user.nombre, role: user.role } });
}

// Logout (stateless)
export async function logout(_req, res) {
  return res.json({ message: 'Logout realizado (borrar token en cliente)' });
}

// Forgot password
export async function forgotPassword(req, res) {
  const { email } = req.body;
  const user = await Users.findByEmail(email);
  if (!user) return res.json({ message: 'Si el correo existe, se enviará un enlace' });

  const token = uuidv4();
  await Tokens.createReset(user.id, token, addHours(new Date(), 1));

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Restablecer contraseña - VIT Plataforma de Atención al Cliente 💬',
    html: `<h1>🛍🛒¡Bienvenido/a a VIT!🛍🛒</h1>
    <p>Hola ${user.nombre},</p>
           <p>Puedes restablecer tu contraseña usando este enlace (válido 1 hora):</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>`
  });

  return res.json({ message: 'Si el correo existe, se enviará un enlace' });
}

// Reset password
export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    if (!token || !password)
      return res.status(400).json({ message: "Datos inválidos" });

    // Validar que el token exista en la tabla tokens
    const { data: tokenRow, error: tokenError } = await supabase
      .from("tokens")
      .select("*")
      .eq("token", token)
      .eq("type", "reset")
      .single();

    if (tokenError || !tokenRow)
      return res.status(400).json({ message: "Token inválido o no encontrado" });

    if (new Date(tokenRow.expires_at) < new Date()) {
      await supabase.from("tokens").delete().eq("id", tokenRow.id);
      return res.status(400).json({ message: "Token expirado" });
    }

    // Validar contraseña segura
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{5,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "La contraseña debe tener al menos 5 caracteres, una mayúscula, un número y un símbolo especial.",
      });
    }

    // Actualizar contraseña
    const bcrypt = await import("bcrypt");
    const password_hash = await bcrypt.hash(password, 12);

    const { error: updateError } = await supabase
      .from("usuarios")
      .update({ password_hash })
      .eq("id", tokenRow.user_id);

    if (updateError) throw updateError;

    // Eliminar el token usado
    await supabase.from("tokens").delete().eq("id", tokenRow.id);

    return res.json({ message: "Contraseña actualizada correctamente" });
  } catch (err) {
    console.error("❌ Error en resetPassword:", err);
    res.status(500).json({ message: "Error interno al restablecer contraseña" });
  }
}
// Eliminar cuenta (propietario)

export async function deleteAccount(req, res) {
  try {
    const userId = req.user.id;

    // 1️⃣ Buscar usuario en Supabase
    const { data: user, error: userError } = await supabase
      .from("usuarios")
      .select("avatar")
      .eq("id", userId)
      .single();

    if (userError) throw userError;

    // 2️⃣ Si tiene avatar, eliminarlo del Storage
    if (user?.avatar) {
      try {
        const filePath = user.avatar.split("/avatars/")[1];
        await supabase.storage.from("avatars").remove([filePath]);
      } catch (storageError) {
        console.warn("⚠️ No se pudo eliminar el avatar del Storage:", storageError.message);
      }
    }

    // 3️⃣ Eliminar usuario de la base de datos
    await Users.deleteById(userId);

    return res.json({ message: "⚠️ Cuenta eliminada correctamente." });
  } catch (err) {
    console.error("❌ Error al eliminar cuenta:", err);
    res.status(500).json({ error: "Error al eliminar cuenta" });
  }
}


// 📌 Actualizar usuario
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { nombre, apellido, celular, provincia, avatar } = req.body;

    const { data, error } = await supabase
      .from("usuarios")
      .update({
        nombre,
        apellido,
        celular,
        provincia,
        avatar,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*");

    if (error) throw error;
    if (!data || data.length === 0)
      return res.status(404).json({ message: "Usuario no encontrado" });

    res.json({ message: "✅ Perfil actualizado correctamente.", user: data[0] });
  } catch (err) {
    console.error("❌ Error al actualizar usuario:", err);
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
}*/