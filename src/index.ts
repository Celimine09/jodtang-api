import express, { type Request, type Response } from "express";
import cors from "cors";
import transactionRoutes from "./routes/transaction.route";
import userRoutes from "./routes/user.route";
import { setupSwagger } from "./utils/swagger";
import { startCronJobs } from "./services/cron.job";
import budgetRoutes from "./routes/budget.route";
import savingRoutes from "./routes/saving.route";
import recurringRoutes from "./routes/recurring.route";
import categoryRoutes from "./routes/category.route";
import authRoutes from "./routes/auth.route";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/savings", savingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/auths", authRoutes);

setupSwagger(app);

app.listen(PORT, () => {
  console.log(`🚀 Server is running firmly on http://localhost:${PORT}`);
  startCronJobs();
});
