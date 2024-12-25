"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { login } from "@/services/firebase/auth";
import { createLog } from "@/services/firebase/log";
import { LogType, LogSeverity } from "@/types/log";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await login({ email, password });

      if (response.success && response.user) {
        // Başarılı giriş logu
        await createLog({
          userId: response.user.id,
          type: LogType.USER_LOGIN,
          severity: LogSeverity.MEDIUM,
          message: "Kullanıcı başarıyla giriş yaptı",
          metadata: {
            details: {
              email: response.user.email
            }
          }
        });

        router.push("/dashboard");
      } else {
        setError(response.message);
        
        // Hata logu
        await createLog({
          userId: "anonymous",
          type: LogType.ERROR,
          severity: LogSeverity.HIGH,
          message: "Giriş başarısız",
          metadata: {
            details: {
              error: response.message,
              code: "AUTH_ERROR",
              email
            }
          }
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Giriş yapılırken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">xBot&apos;a Giriş Yap</CardTitle>
          <CardDescription>
            Twitter hesaplarınızı yönetmek için giriş yapın
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-posta
              </label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Şifre
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
            <div className="text-sm text-center space-y-2">
              <Link 
                href="/forgot-password"
                className="text-primary hover:underline block"
              >
                Şifremi Unuttum
              </Link>
              <span className="text-muted-foreground">
                Hesabınız yok mu?{" "}
                <Link 
                  href="/register"
                  className="text-primary hover:underline"
                >
                  Kayıt Ol
                </Link>
              </span>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 