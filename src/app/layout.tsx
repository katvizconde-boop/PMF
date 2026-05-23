import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "PMF System",
  description: "Performance Management Form — automate your evaluations end-to-end.",
  icons: {
    icon: [
      { url: "/arrow.svg", type: "image/svg+xml" },
    ],
    apple: "/arrow.svg",
    shortcut: "/arrow.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
