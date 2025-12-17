// Load environment variables from .env for Expo config
const dotenv = require("dotenv");
dotenv.config();

module.exports = ({ config }) => ({
  ...config,
  extra: {
    SUPABASE_URL:
      process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    SUPABASE_ANON_KEY:
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      "",
  },
  android: {
    package: "com.ehsanpo.trackingapp",
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE",
      },
    },
  },
});
