import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// OpenNext settings for Cloudflare Workers. No incremental cache yet: our
// pages fetch their data in the browser or render per request.
export default defineCloudflareConfig();
