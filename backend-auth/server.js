const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const { Server } = require("socket.io");

// Configuration
const app = express();
const PORT = 4000;
const JWT_SECRET = "your_jwt_secret";
const io = new Server(5000, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/authDB", {
}).then(async () => {
  console.log("Connected to MongoDB");
  await createDefaultUsers();
});

// Ajout de cette fonction après la connexion à MongoDB
const createDefaultUsers = async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    const defaultUsers = [
      { username: "user1", password: await bcrypt.hash("password1", 10), pin: await bcrypt.hash("12345", 10) },
      { username: "user2", password: await bcrypt.hash("password2", 10), pin: await bcrypt.hash("56782", 10) },
    ];
    await User.insertMany(defaultUsers);
    console.log("Default users created.");
  } else {
    console.log("Default users already exist.");
  }
};

// User Schema
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  pin: String,
});

const User = mongoose.model("User", UserSchema);

// Routes
app.post("/register", async (req, res) => {
  const { username, password, pin } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const hashedPin = await bcrypt.hash(pin, 10);
  const newUser = new User({ username, password: hashedPassword, pin: hashedPin });
  await newUser.save();
  res.json({ message: "User registered successfully!" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ message: "Login successful", token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

app.post("/verify-pin", async (req, res) => {
  const { username, pin } = req.body;
  const user = await User.findOne({ username });
  
  // Ajout de logs pour le débogage
  console.log(`Vérification du PIN pour l'utilisateur: ${username}`);
  console.log(`PIN fourni: ${pin}`);
  console.log(`PIN stocké: ${user ? user.pin : 'Utilisateur non trouvé'}`);

  if (user && (await bcrypt.compare(pin, user.pin))) {
    io.emit("authenticated", { username });
    res.json({ message: "PIN verified!" });
  } else {
    res.status(401).json({ message: "Invalid PIN" });
  }
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
