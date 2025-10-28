# 🛍️ Backend Tienda VIT

Este proyecto implementa el backend para la aplicación **Tienda VIT**, desarrollada con **Node.js + Express** y **Supabase** como base de datos.

## 🚀 Funcionalidades Implementadas

### 📘 HU-001 — Registrar, Verificar y Eliminar Cuenta
- Registro de usuarios con envío de correo de verificación (Nodemailer)
- Activación mediante token (tabla `tokens`)
- Eliminación definitiva de cuenta (usuario y avatar en Supabase)

### 🔐 HU-002 — Iniciar Sesión, Cerrar Sesión y Restablecer Contraseña
- Login con JWT y verificación de cuenta activa
- Logout (token stateless)
- Recuperación de contraseña por correo con token temporal

### 👤 HU-003 — Gestión de Perfil
- Consultar perfil del usuario autenticado
- Actualizar datos personales (nombre, celular, provincia, avatar)

## 🧩 En Desarrollo

### 🧑‍💼 HU-004 — Gestión de Usuarios por Administrador
- Listar todos los usuarios
- Actualizar rol, nombre, provincia, etc.
- Eliminar o desactivar usuarios

### 🛒 HU-005 — Gestión de Catálogo de Productos
- Crear, listar, actualizar y eliminar productos
- Controlar consistencia ante ventas simultáneas
  
- Gestión de Productos e Imágenes
Este módulo permite crear, actualizar, eliminar y listar productos desde el panel de administración.
Cada producto puede contener una o varias imágenes, las cuales se almacenan en Supabase Storage mediante peticiones multipart/form-data.

Seguridad:
Todas las rutas están protegidas con autenticación JWT y middleware requireAdmin, garantizando que solo los usuarios con rol administrador puedan realizar estas operacione

## ⚙️ Tecnologías Utilizadas
- Node.js + Express
- Supabase (PostgreSQL)
- JWT (Json Web Tokens)
- Nodemailer (Gmail SMTP)
- Helmet, CORS y Rate Limiting para seguridad

## 🧠 Autor
**Isaac Quinapallo**  
Proyecto de titulación — Tecnólogo Superior en Desarrollo de Software
