/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "hsl(240, 10%, 4%)",
                foreground: "hsl(0, 0%, 98%)",
                primary: {
                    DEFAULT: "hsl(250, 95%, 64%)",
                    foreground: "hsl(0, 0%, 100%)",
                },
                secondary: {
                    DEFAULT: "hsl(240, 5%, 15%)",
                    foreground: "hsl(0, 0%, 98%)",
                },
                muted: {
                    DEFAULT: "hsl(240, 5%, 10%)",
                    foreground: "hsl(240, 5%, 65%)",
                },
                accent: {
                    DEFAULT: "hsl(250, 95%, 64%)",
                    foreground: "hsl(0, 0%, 100%)",
                },
                border: "hsl(240, 5%, 15%)",
                input: "hsl(240, 5%, 15%)",
                ring: "hsl(250, 95%, 64%)",
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [],
}
