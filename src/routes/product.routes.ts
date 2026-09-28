import { Router } from "express";
import {
  createProduct,
  getProductById,
  searchProducts,
} from "../services/product.service";

const router = Router();


// POST /products
router.post("/", async (req, res) => {
  try {
    const product = req.body;

    const result = await createProduct(product);

    res.status(201).json({
      message: "Product added successfully",
      result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add product",
    });
  }
});


// GET /products/search?q=laptop
router.get("/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        message: "Search query is required",
      });
    }

    const products = await searchProducts(query);

    res.json({
      query,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to search products",
    });
  }
});


// GET /products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await getProductById(req.params.id);

    res.json(product);
  } catch (error: any) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(500).json({
      message: "Failed to retrieve product",
    });
  }
});

export default router;