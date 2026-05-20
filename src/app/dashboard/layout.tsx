import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DomainQA DevOps Dashboard",
  description: "Real-time monitoring, container management, and CI/CD pipeline visualization",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
