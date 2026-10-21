const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { status } = require("@grpc/grpc-js");
const users = require("../infrastructure/user-repository");

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    fail(status.INTERNAL, "JWT secret is not configured");
  }

  return secret;
}

async function register(input) {
  const username = (input.username || "").trim();
  const password = input.password || "";
  const email = (input.email || "").trim().toLowerCase();
  const phone = (input.phone || "").trim();

  if (
    !/^[a-zA-Z0-9_]{3,50}$/.test(username) ||
    password.length < 6 ||
    Buffer.byteLength(password, "utf8") > 72 ||
    email.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    phone.length > 20
  ) {
    fail(status.INVALID_ARGUMENT, "Invalid registration data");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await users.createUser({
      username,
      passwordHash,
      email,
      phone
    });

    return {
      message: "User registered successfully",
      uid: user.uid
    };
  } catch (error) {
    if (error.code === "23505") {
      fail(status.ALREADY_EXISTS, "Username or email already exists");
    }

    throw error;
  }
}

async function login(input) {
  const username = (input.username || "").trim();
  const password = input.password || "";

  if (!username || !password) {
    fail(status.INVALID_ARGUMENT, "Username and password are required");
  }

  const user = await users.findByUsername(username);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    fail(status.UNAUTHENTICATED, "Invalid username or password");
  }

  const accessToken = jwt.sign(
    { role: user.role },
    getSecret(),
    {
      algorithm: "HS256",
      subject: String(user.uid),
      expiresIn: 3600
    }
  );

  return {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600
  };
}

async function verifyToken(input) {
  const secret = getSecret();
  let payload;

  try {
    payload = jwt.verify(input.token || "", secret, {
      algorithms: ["HS256"]
    });
  } catch {
    fail(status.UNAUTHENTICATED, "Invalid or expired token");
  }

  const uid = Number(payload.sub);
  const roles = ["CUSTOMER", "ADMIN", "SHIPMENT_STAFF"];

  if (
    !Number.isInteger(uid) ||
    uid <= 0 ||
    uid > 2147483647 ||
    !roles.includes(payload.role)
  ) {
    fail(status.UNAUTHENTICATED, "Invalid token claims");
  }

  return {
    uid,
    role: payload.role
  };
}

module.exports = {
  register,
  login,
  verifyToken
};