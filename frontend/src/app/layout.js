import "./globals.css";

export const metadata = {
  title: "CatVision AI — Breed Classifier",
  description: "Upload a cat photo to identify its breed in our cozy cat cafe.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Quicksand:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-cafe-bg text-cafe-brown" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
