const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

// ENV VARIABLES
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// MongoDB
const client = new MongoClient(MONGO_URI);
let productsCollection;

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("shop");
    productsCollection = db.collection("products");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

connectDB();

// ROOT ENDPOINT (REQUIRED)
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// CREATE product
app.post("/api/products", async (req, res) => {
  try {
    const { name, price, category } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const result = await productsCollection.insertOne({
      name,
      price: Number(price),
      category,
    });

    res.status(201).json({
      message: "Product created",
      id: result.insertedId,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// READ all products
app.get("/api/products", async (req, res) => {
  const products = await productsCollection.find().toArray();
  res.json(products);
});

// READ product by ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await productsCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(product);
  } catch {
    res.status(400).json({ error: "Invalid ID" });
  }
});

// UPDATE product
app.put("/api/products/:id", async (req, res) => {
  const result = await productsCollection.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );

  res.json({ updated: result.modifiedCount });
});

// DELETE product
app.delete("/api/products/:id", async (req, res) => {
  const result = await productsCollection.deleteOne({
    _id: new ObjectId(req.params.id),
  });

  res.json({ deleted: result.deletedCount });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

