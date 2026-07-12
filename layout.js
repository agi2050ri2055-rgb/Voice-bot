export const metadata = {
  title: 'VANI — Voice Assistant',
  description: 'A voice-driven banking assistant demo, powered by Claude.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0A0A0C' }}>{children}</body>
    </html>
  );
}
