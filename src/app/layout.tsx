import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "PesoCollector",
  description: "Panel para gestionar clientes, deudas y pagos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
