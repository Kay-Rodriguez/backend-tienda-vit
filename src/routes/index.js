import express from "express";
import { body } from "express-validator";
import {
  register,
  verify,
  login,
  logout,
  forgotPassword,
  resetPassword,
  deleteAccount,
} from "../controllers/auth_controller.js";

import {
  me,
  updateMe,
  getUserById,
} from "../controllers/user_controller.js";

import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product_controller.js";

import { authRequired, requireAdmin } from "../middlewares/JWT.js";

const router = express.Router();

/* =========================================================
   🔐 AUTENTICACIÓN (HU-001 y HU-002)
========================================================= */
router.post("/auth/register", body("email").isEmail(), register);
router.get("/auth/verify/:token", verify);
router.post("/auth/login", login);
router.post("/auth/logout", authRequired, logout);
router.post("/auth/forgot-password", body("email").isEmail(), forgotPassword);
router.post("/auth/reset-password", resetPassword);
router.delete("/auth/delete", authRequired, deleteAccount);

/* =========================================================
   👤 PERFIL DE USUARIO (HU-003)
========================================================= */
router.get("/users/me", authRequired, me);
router.put("/users/me", authRequired, updateMe);
router.get("/users/:id", authRequired, requireAdmin, getUserById);

/* =========================================================
   🛍️ PRODUCTOS (CRUD)
========================================================= */
router.get("/products", listProducts);
router.get("/products/:id", getProduct);
router.post("/products", authRequired, requireAdmin, createProduct);
router.put("/products/:id", authRequired, requireAdmin, updateProduct);
router.delete("/products/:id", authRequired, requireAdmin, deleteProduct);

export default router;
