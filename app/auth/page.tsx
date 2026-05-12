import { AuthForm } from "@/components/auth-form";
import { Card, SectionHeading } from "@/components/ui/card";

export default function AuthPage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div>
        <SectionHeading
          eyebrow="Welcome to StockFlow"
          title="Sign in to manage your stock photo batches."
          description="Use a magic link to access your dashboard, uploads, metadata review tables, and export downloads."
        />
      </div>
      <Card>
        <AuthForm />
      </Card>
    </main>
  );
}
