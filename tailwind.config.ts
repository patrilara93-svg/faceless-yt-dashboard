import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
    darkMode: "media",
    theme: {
          extend: {
                  colors: {
                            canvas: "#0b0d12",
                            panel: "#12151c",
                            panelborder: "#232733",
                            accent: "#ff3b30",
                            accent2: "#7c5cff",
                  },
          },
    },
    plugins: [],
};

export default config;
