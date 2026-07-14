export default function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="app-shell">{children}</div>;
}
