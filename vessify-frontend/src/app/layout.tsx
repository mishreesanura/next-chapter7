import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

const cabinetGrotesk = localFont({
  src: "./fonts/CabinetGrotesk-Variable.woff2",
  variable: "--font-cabinet-grotesk",
  weight: "100 900",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Next Chapter",
  description: "WhatsApp placement details parser and tracker"
};

const themeScript = `
try {
  const storedTheme = window.localStorage.getItem("app-theme");
  const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : preferredTheme;
} catch {
  document.documentElement.dataset.theme = "light";
}
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cabinetGrotesk.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "rounded-full border-0 bg-[var(--toast-bg)] text-[var(--toast-ink)] shadow-soft"
            }
          }}
        />
      </body>
    </html>
  );
}
