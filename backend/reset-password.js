import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Bare schema, no pre-save hashing hook — we hash manually below so a
// direct field update here never gets silently double-hashed.
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  familyRole: { type: String, default: "self" },
  role: { type: String, enum: ["user", "admin"], default: "user" },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function resetPassword() {
  console.log("🤖 FRIDAY Protocol - Password Reset");

  const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!dbUri) {
    console.error("❌ Error: MONGODB_URI is missing from your .env file.");
    process.exit(1);
  }

  rl.question("Enter the account Email to reset: ", (email) => {
    rl.question("Enter the new password (min 6 characters): ", async (password) => {

      if (!password || password.length < 6) {
        console.error("❌ Password must be at least 6 characters.");
        rl.close();
        process.exit(1);
      }

      console.log(`\n🔄 Initializing connection to database...`);
      try {
        await mongoose.connect(dbUri, { dbName: "friday_finance" });
        console.log(`✅ Database connected successfully!`);

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (!existing) {
          console.log(`⚠️ No user found with email ${email}.`);
        } else {
          const hashedPassword = await bcrypt.hash(password, 12);
          existing.password = hashedPassword;
          await existing.save();
          console.log(`🎉 Success! Password reset for ${email}. You can now log in via the FRIDAY dashboard.`);
        }

      } catch (error) {
        console.error("❌ Reset Failed. Could not connect to the database.");
        console.error(`Error details: ${error.message}`);
        console.error("Please check your MONGO_URI in .env or your network connection.");
      } finally {
        await mongoose.disconnect();
        rl.close();
      }
    });
  });
}

resetPassword();
