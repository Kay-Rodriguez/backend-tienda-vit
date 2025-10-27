import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import router from "./routes/index.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

app.get("/", (_, res) =>
  res.json({ ok: true, message: "✅ API VIT funcionando y conectada a Supabase" })
);

app.use("/api", router);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Error interno" });
});

// Errores globales
process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Promesa rechazada sin capturar:", reason);
});
process.on("uncaughtException", (err) => {
  console.error(" Excepción no capturada:", err);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`✅ API escuchando en http://localhost:${PORT}`)
);
