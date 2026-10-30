import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;

// Enables Cloudflare bindings/env during `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
