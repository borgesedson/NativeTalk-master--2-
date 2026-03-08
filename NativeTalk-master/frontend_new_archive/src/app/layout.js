import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-outfit",
});

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

export const metadata = {
    title: "NativeTalk | Premium Multilingual Communication",
    description: "Break language barriers with real-time translation and high-end video calls.",
    manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${outfit.variable} ${inter.variable} dark`}>
            <body className="min-h-screen bg-background overflow-x-hidden">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
