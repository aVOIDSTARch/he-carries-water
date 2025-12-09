// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import preact from "@astrojs/preact";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://hecarrieswater.com",
  integrations: [mdx(), sitemap(), preact({ devtools: true })],

  vite: {
    plugins: [tailwindcss()],
  },
});
