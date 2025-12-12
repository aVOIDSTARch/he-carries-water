// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import preact from "@astrojs/preact";

import tailwindcss from "@tailwindcss/vite";

import auth from "auth-astro";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: "https://hecarrieswater.com",
  output: "server", // Enable SSR for authentication
  adapter: node({
    mode: "standalone",
  }),
  integrations: [mdx(), sitemap(), preact({ devtools: true }), auth()],

  server: {
    port: 2982,
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
