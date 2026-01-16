import type { Metadata } from "next";
import "../styles/globals.css";
import { AppToaster } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "PesoCollector",
  description: "Panel para gestionar clientes, deudas y pagos",
  icons: {
    icon: "/PesoCollector.ico",
    shortcut: "/PesoCollector.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
