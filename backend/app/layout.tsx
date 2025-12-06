export const metadata = {
  title: 'Backend Parroquias',
  description: 'Backend para la aplicación de Parroquias con ChatKit',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
