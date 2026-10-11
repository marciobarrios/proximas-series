import { LoginButton } from "@/components/auth/login-button";

export const metadata = { title: "Acceso privado" };

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-semibold">Próximas Series</h1>
      <p className="text-muted-foreground">Aplicación privada. Solo su propietario puede acceder.</p>
      {error && <p role="alert">No se ha podido autorizar esta cuenta.</p>}
      <LoginButton />
    </main>
  );
}
