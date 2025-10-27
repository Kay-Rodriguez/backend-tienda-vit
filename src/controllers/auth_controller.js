import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { usuarios as Users, Tokens } from "../models/usuario.js";
import { sendMail } from "../config/nodemailer.js";
import { signJwt } from "../middlewares/JWT.js";
import { supabase } from "../config/supabaseClient.js";

const TOKEN_HOURS = 24;

function addHours(date, h) {
  const d = new Date(date);
  d.setHours(d.getHours() + h);
  return d.toISOString();
}
/* =========================================================
   🧩 HU-001 Registrar, verificar y eliminar cuenta
========================================================= */

// ✅ Registrar usuario
export async function register(req, res) {
  try {
    const { email, password, nombre, apellido, celular, provincia } = req.body;

    if (!email || !password || !nombre || !apellido || !celular || !provincia) {
  return res.status(400).json({ message: "Faltan campos obligatorios." });
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
if (!passwordRegex.test(password)) {
  return res.status(400).json({
    message:
      "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo especial.",
  });
}
    const exists = await Users.findByEmail(email);
    if (exists)
      return res.status(409).json({ message: "El correo ya está registrado." });

    const password_hash = await bcrypt.hash(password, 12);
    const user = await Users.create({email, password_hash, nombre, apellido, celular, provincia, role: "cliente", is_verified: false, activo: true, created_at: new Date().toISOString(),});

    // Token de verificación
    const token = uuidv4();
    await Tokens.createVerify(user.id, token, addHours(new Date(), TOKEN_HOURS));

    const verifyUrl = `${process.env.FRONTEND_URL}/verify/${token}`;
    await sendMail({
      to: user.email,
      subject: "Verifica tu cuenta en VIT 💬",
      html: `
        <h2>🛒¡Bienvenido/a a VIT!🛍</h2>
        <h1>Hola, ${user.nombre}</h1>
        <p>Por favor verifica tu cuenta haciendo clic en el siguiente enlace:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        <p>El enlace expira en ${TOKEN_HOURS} horas.</p>
        <p>💙 VIT 💙</p>
        <p>Gracias por registrarte en nuestra plataforma. Somos una plataforma de comercio electrónico diseñada para Ecuador. Disfruta de un catálogo de productos cuidadosamente seleccionado, un carrito de compras inteligente y un chatbot con inteligencia artificial que resuelve tus dudas al instante.</p>
        <hr>
        `,
    });

    res.status(201).json({
      message: "Usuario registrado. Revisa tu correo para verificar la cuenta.",
    });
  } catch (err) {
    console.error(" Error al registrar:", err);
    res.status(500).json({ message: "Error al registrar usuario." });
  }
}
// Verificar cuenta por token
export async function verify(req, res) {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ message: "Token requerido." });

    const row = await Tokens.getVerify(token);
    if (!row) return res.status(400).json({ message: "Token inválido o expirado." });

    if (new Date(row.expira_en) < new Date()) {
      await Tokens.deleteVerify(row.id);
      return res.status(400).json({ message: "Token expirado." });
    }

    await Users.updateById(row.usuario_id, { is_verified: true });
    await Tokens.deleteVerify(row.id);

    res.json({ message: "Cuenta verificada con éxito." });
  } catch (err) {
    console.error(" Error al verificar cuenta:", err);
    res.status(500).json({ message: "Error interno al verificar cuenta." });
  }
}

// ✅ Eliminar cuenta (borrado definitivo)
export async function deleteAccount(req, res) {
  try {
    const userId = req.user.id;

    // Eliminar avatar si existe
    const { data: user } = await supabase.from("usuarios").select("avatar").eq("id", userId).single();

    if (user?.avatar) {
      try {
        const filePath = user.avatar.split("/avatars/")[1];
        await supabase.storage.from("avatars").remove([filePath]);
      } catch (e) {
        console.warn(" No se pudo eliminar el avatar:", e.message);
      }
    }
    // Eliminar usuario
    await Users.deleteById(userId);
    res.json({ message: "Cuenta eliminada correctamente." });
  } catch (err) {
    console.error("Error al eliminar cuenta:", err);
    res.status(500).json({ message: "Error al eliminar cuenta." });
  }
}
/* =========================================================
    HU-002 Iniciar sesión, cerrar sesión y restablecer contraseña
========================================================= */

// Iniciar sesión
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await Users.findByEmail(email);
    if (!user) return res.status(401).json({ message: "Credenciales inválidas." });
    if (!user.is_verified)
      return res.status(403).json({ message: "Cuenta no verificada." });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Credenciales inválidas." });

    const token = signJwt({ id: user.id, role: user.role, email: user.email });
    res.json({
      token,
      user: {id: user.id,nombre: user.nombre,email: user.email,role: user.role,},
    });
  } catch (err) {
    console.error(" Error al iniciar sesión:", err);
    res.status(500).json({ message: "Error interno en login." });
  }
}

// Cerrar sesión
export async function logout(_req, res) {
  res.json({ message: "Sesión cerrada. El token debe eliminarse en el cliente." });
}

//  Olvidé mi contraseña (envía enlace por correo)
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await Users.findByEmail(email);
    if (!user)
      return res.json({ message: "Si el correo existe, se enviará un enlace." });

    const token = uuidv4();
    await Tokens.createReset(user.id, token, addHours(new Date(), 1));

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Restablecer contraseña - VIT 💬",
      html: `
        <h2>🛒¡Bienvenido/a a VIT!🛍</h2>
        <h1>Hola ${user.nombre}</h1>
        <p>Puedes restablecer tu contraseña haciendo clic aquí:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Este enlace expira en 1 hora.</p>
        <p>💙 VIT 💙</p>
        <p>Gracias por ser parte de nuestra plataforma. En VIT, nos esforzamos por ofrecerte la mejor experiencia de compra en línea en Ecuador, con un catálogo de productos seleccionado cuidadosamente, un carrito de compras inteligente y un chatbot con inteligencia artificial para resolver tus dudas al instante.</p>
        <hr>
      `,
    });

    res.json({ message: "Se ha enviado un enlace de restablecimiento si el correo existe." });
  } catch (err) {
    console.error(" Error en forgotPassword:", err);
    res.status(500).json({ message: "Error interno." });
  }
}

// ✅ Restablecer contraseña (usando token)
export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ message: "Datos incompletos." });
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
if (!passwordRegex.test(password)) {
  return res.status(400).json({
    message:
      "La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo especial.",
  });
}
    const row = await Tokens.getReset(token);
    if (!row) return res.status(400).json({ message: "Token inválido o expirado." });

    if (new Date(row.expira_en) < new Date()) {
      await Tokens.deleteReset(row.id);
      return res.status(400).json({ message: "Token expirado." });
    }

    const password_hash = await bcrypt.hash(password, 12);
    await Users.updateById(row.usuario_id, { password_hash });
    await Tokens.deleteReset(row.id);

    res.json({ message: "Contraseña actualizada correctamente." });
  } catch (err) {
    console.error(" Error al restablecer contraseña:", err);
    res.status(500).json({ message: "Error interno." });
  }
}
