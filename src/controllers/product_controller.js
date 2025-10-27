// src/controllers/product_controller.js
import { supabaseAdmin } from "../config/supabaseClient.js";

/* =========================================================
   🛍️ PRODUCTOS CRUD
========================================================= */

/**
 * ✅ Crear un nuevo producto
 */
export async function createProduct(req, res) {
  try {
    const { nombre, descripcion, precio, stock, categoria, imagen } = req.body;

    // Validar campos requeridos
    if (!nombre || !descripcion || !precio) {
      return res.status(400).json({ error: "Campos obligatorios faltantes." });
    }

    const producto = {
      nombre,
      descripcion,
      precio: Number(precio),
      stock: stock ? Number(stock) : 0,
      categoria: categoria || "General",
      imagen: imagen || null,
      creado_en: new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("productos")
      .insert([producto]) // 👈 Debe ser un array
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: "✅ Producto creado correctamente.",
      producto: data,
    });
  } catch (err) {
    console.error("❌ Error al crear producto:", err);
    res.status(500).json({ error: "Error al crear producto" });
  }
}

/**
 * ✅ Listar todos los productos
 */
export async function listProducts(_req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from("productos")
      .select("*")
      .order("creado_en", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("❌ Error al listar productos:", err);
    res.status(500).json({ error: "Error al listar productos" });
  }
}

/**
 * ✅ Obtener un producto por ID
 */
export async function getProduct(req, res) {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("productos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("❌ Error al obtener producto:", err);
    res.status(500).json({ error: "Error al obtener producto" });
  }
}

/**
 * ✅ Actualizar un producto por ID
 */
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoria, imagen } = req.body;

    const producto = {
      nombre,
      descripcion,
      precio: precio ? Number(precio) : undefined,
      stock: stock ? Number(stock) : undefined,
      categoria,
      imagen,
      actualizado_en: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("productos")
      .update(producto)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: "✅ Producto actualizado correctamente.",
      producto: data,
    });
  } catch (err) {
    console.error("❌ Error al actualizar producto:", err);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
}

/**
 * ✅ Eliminar un producto por ID
 */
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from("productos").delete().eq("id", id);

    if (error) throw error;
    res.json({ message: "🗑️ Producto eliminado correctamente." });
  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
}
