import { Router } from "express";
import _productController5187 from "../controller/productController.js";
const { getPublicProduct, getPublicProducts  } = _productController5187;

const router = Router();

router.get("/", getPublicProducts);
router.get("/:id", getPublicProduct);

export default router;
