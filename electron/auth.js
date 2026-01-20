const db = require("./database");
const bcrypt = require("bcryptjs");

// This function handles the "Sign Up" process
async function handleSignUp(email, password, username) {
  try {
    // 1. Hash the password (10 rounds of security)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    return new Promise((resolve, reject) => {
      // 2. Insert User into the Parent Table
      const sql = `INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)`;

      db.run(sql, [email, hashedPassword, username], function (err) {
        if (err) {
          if (err.message.includes("UNIQUE constraint")) {
            reject("Email already registered.");
          } else {
            reject(err.message);
          }
          return;
        }

        const newUserId = this.lastID; // The ID SQL just generated

        // 3. Create Default Settings for this specific user
        const settingsSql = `INSERT INTO user_settings (user_id) VALUES (?)`;
        db.run(settingsSql, [newUserId], (sErr) => {
          if (sErr) console.error("Settings error:", sErr);
          resolve({ success: true, user: { user_id: newUserId } });
        });
      });
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function handleLogin(email, password) {
  return new Promise((resolve, reject) => {
    // 1. Find the user by email
    const sql = `SELECT * FROM users WHERE email = ?`;

    db.get(sql, [email], async (err, user) => {
      if (err) return reject(err.message);

      // 2. If user doesn't exist, stop here
      if (!user) {
        return resolve({ success: false, error: "User not found" });
      }

      // 3. Compare the provided password with the stored Hash
      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (isMatch) {
        // 4. Success! Return the user (excluding the password for safety)
        resolve({
          success: true,
          user: {
            user_id: user.user_id, // Match your DB column name
            email: user.email,
            username: user.username,
          },
        });
      } else {
        resolve({ success: false, error: "Invalid password" });
      }
    });
  });
}

module.exports = { handleSignUp, handleLogin };
