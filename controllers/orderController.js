import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Products.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import fs from "node:fs";

export default {
  getUserOrders: async (req, res) => {
    const { id: userId } = req.params;

    try {
      console.log(
        "getUserOrders - Received userId:",
        userId,
        "Type:",
        typeof userId
      );
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId format" });
      }

      const userOrders = await Order.find({ userId })
        .populate({
          path: "products.productId",
          select:
            "title supplier price images tallas colores numeros_calzado stock",
        })
        .sort({ createdAt: -1 })
        .lean();

      if (!userOrders.length) {
        return res
          .status(404)
          .json({ message: "No orders found for this user" });
      }

      res.status(200).json(userOrders);
    } catch (error) {
      console.error("Error fetching user orders:", {
        message: error.message,
        stack: error.stack,
      });
      res
        .status(500)
        .json({ message: "Error fetching orders", error: error.message });
    }
  },

  createOrder: async (req, res) => {
    let body = req.body;
    let paymentReceipt = { url: null, public_id: null };

    try {
      console.log("createOrder - Request details:", {
        method: req.method,
        headers: req.headers,
        body: req.body,
        file: req.file, // Use req.file for upload.single
      });

      // Parse FormData JSON
      if (body.data) {
        try {
          body = JSON.parse(body.data);
        } catch (error) {
          console.error("Invalid JSON in data field:", error.message);
          return res
            .status(400)
            .json({ message: "Invalid JSON in data field" });
        }
      } else {
        console.error("Missing data field in request body");
        return res.status(400).json({ message: "Missing data field" });
      }

      const { userId, customerId, products, total, payment_status } = body;

      if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid userId format" });
      }
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({ message: "Invalid customerId format" });
      }
      if (!products || !Array.isArray(products) || products.length === 0) {
        return res
          .status(400)
          .json({ message: "Products array is required and cannot be empty" });
      }
      if (!["pending", "completed", "failed"].includes(payment_status)) {
        return res.status(400).json({ message: "Invalid payment_status" });
      }

      // Handle payment receipt upload
      if (req.file) {
        const folderName = "mbolo_payment_receipts";
        try {
          console.log(`Uploading payment receipt: ${req.file.originalname}`, {
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size,
          });
          const result = await uploadImage(req.file.path, folderName);
          paymentReceipt = { url: result.url, public_id: result.public_id };
          fs.unlinkSync(req.file.path); // Clean up local file
        } catch (error) {
          console.error("Error uploading payment receipt to Cloudinary:", {
            message: error.message,
            stack: error.stack,
          });
          const errorMessage = error.message.includes("File size too large")
            ? "El archivo es demasiado grande. Máximo 40MB."
            : "Error uploading payment receipt to Cloudinary";
          return res
            .status(500)
            .json({ message: errorMessage, error: error.message });
        }
      } else {
        console.log("No payment receipt provided; proceeding without upload");
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        let calculatedTotal = 0;
        const validatedProducts = [];

        for (const item of products) {
          const { productId, quantity, color, talla } = item;

          if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new Error(`Invalid productId: ${productId}`);
          }
          if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error(`Invalid quantity for product ${productId}`);
          }

          const product = await Product.findById(productId).session(session);
          if (!product) {
            throw new Error(`Product not found: ${productId}`);
          }
          if (product.stock < quantity) {
            throw new Error(`Insufficient stock for product ${product.title}`);
          }
          if (color && !product.colores.includes(color)) {
            throw new Error(
              `Invalid color ${color} for product ${product.title}`
            );
          }
          if (talla) {
            if (product.tallas.length > 0 && !product.tallas.includes(talla)) {
              throw new Error(
                `Invalid talla ${talla} for product ${product.title}`
              );
            }
            if (
              product.numeros_calzado.length > 0 &&
              !product.numeros_calzado.includes(parseFloat(talla))
            ) {
              throw new Error(
                `Invalid numero_calzado ${talla} for product ${product.title}`
              );
            }
          }

          const subtotal = product.price * quantity;
          validatedProducts.push({
            productId,
            quantity,
            subtotal,
            color: color || null,
            talla: talla || null,
          });
          calculatedTotal += subtotal;
        }

        // Validate total only if provided
        if (total && parseFloat(total) !== calculatedTotal) {
          throw new Error(
            `Total mismatch: provided ${total}, calculated ${calculatedTotal}`
          );
        }

        const newOrder = new Order({
          userId,
          customerId,
          products: validatedProducts,
          total: calculatedTotal,
          payment_status,
          paymentReceipt,
        });

        await newOrder.save({ session });
        await session.commitTransaction();

        res
          .status(201)
          .json({ message: "Order created successfully", order: newOrder });
      } catch (error) {
        await session.abortTransaction();
        if (paymentReceipt.public_id) {
          await deleteImage(paymentReceipt.public_id).catch((err) =>
            console.error("Error deleting payment receipt:", err)
          );
        }
        throw error;
      } finally {
        session.endSession();
      }
    } catch (error) {
      console.error("Error creating order:", {
        message: error.message,
        stack: error.stack,
        requestBody: body,
      });
      if (paymentReceipt.public_id) {
        await deleteImage(paymentReceipt.public_id).catch((err) =>
          console.error("Error deleting payment receipt:", err)
        );
      }
      if (error.name === "ValidationError") {
        return res.status(400).json({
          message: "Validation error",
          errors: Object.values(error.errors).map((err) => err.message),
        });
      }
      res
        .status(400)
        .json({ message: error.message || "Error creating order" });
    }
  },
  getOrderById: async (req, res) => {
    const { orderId } = req.params;

    try {
      console.log("getOrderById - Received orderId:", orderId);
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: "Invalid orderId format" });
      }

      const order = await Order.findById(orderId)
        .populate({
          path: "products.productId",
          select: "title supplier price images tallas colores numeros_calzado",
        })
        .lean();

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.status(200).json(order);
    } catch (error) {
      console.error("Error fetching order:", {
        message: error.message,
        stack: error.stack,
      });
      res
        .status(500)
        .json({ message: "Error fetching order", error: error.message });
    }
  },
};
