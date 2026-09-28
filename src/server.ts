import express from "express";
import productRoutes from "./routes/product.routes";

const app = express();

app.use(express.json());

app.use("/products", productRoutes);

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});