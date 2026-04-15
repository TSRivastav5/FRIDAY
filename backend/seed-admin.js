import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  familyRole: { type: String, default: "self" },
});

// Avoid model re-compilation error if this is run multiple times
const User = mongoose.models.User || mongoose.model("User", userSchema);

async function createAdmin() {
  console.log("🤖 FRIDAY Protocol - Admin Initialization");
  
  const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!dbUri) {
    console.error("❌ Error: MONGODB_URI is missing from your .env file.");
    process.exit(1);
  }

  rl.question("Enter your Admin Name (e.g., Tony Stark): ", (name) => {
    rl.question("Enter your Admin Email (e.g., boss@stark.com): ", async (email) => {
      rl.question("Enter your initial Passcode: ", async (password) => {
        
        console.log(`\n🔄 Initializing connection to database...`);
        try {
          await mongoose.connect(dbUri, { dbName: "friday_finance" });
          console.log(`✅ Database connected successfully!`);
          
          const existing = await User.findOne({ email: email.toLowerCase() });
          if (existing) {
            console.log(`⚠️ User with email ${email} already exists! Use the login page.`);
          } else {
            const hashedPassword = await bcrypt.hash(password, 12);
            await User.create({
              name: name || "Boss",
              email: email.toLowerCase(),
              password: hashedPassword,
              familyRole: "self"
            });
            console.log(`🎉 Success! Admin protocol '${name}' created. You can now log in via the FRIDAY dashboard.`);
          }
          
        } catch (error) {
          console.error("❌ Initialization Failed. Could not connect to the database.");
          console.error(`Error details: ${error.message}`);
          console.error("Please check your MONGO_URI in .env or your network connection.");
        } finally {
          await mongoose.disconnect();
          rl.close();
        }
      });
    });
  });
}

createAdmin();
