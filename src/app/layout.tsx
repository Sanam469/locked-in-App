import "./globals.css";
import Navbar from "@/component/Navbar";
import BackgroundShell from "@/component/BackgroundShell";
import { ThemeProvider } from "@/component/ThemeContext"; // Import the context we created

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-red-500/30">
        <ThemeProvider>
          <Navbar />
          <BackgroundShell>{children}</BackgroundShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
