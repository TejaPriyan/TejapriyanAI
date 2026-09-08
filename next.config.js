const path = require("path");

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack: (config) => {
    // Explicit alias so "@/..." resolves in every compilation context.
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
};
