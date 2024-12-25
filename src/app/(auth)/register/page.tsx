"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { register } from "@/services/firebase/auth";
import { createLog } from "@/services/firebase/log";
import { LogType, LogSeverity } from "@/types/log";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Şifre kontrolü
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }

    try {
      const response = await register(formData);

      if (response.success && response.user) {
        // Başarılı kayıt logu
        await createLog({
          userId: response.user.id,
          type: LogType.USER_REGISTER,
          severity: LogSeverity.LOW,
          message: 'Yeni kullanıcı kaydı başarılı',
          metadata: {
            details: {
              displayName: response.user.displayName,
              email: response.user.email
            }
          }
        });

        router.push('/dashboard');
      } else {
        setError(response.message);
        
        // Hata logu
        await createLog({
          userId: 'anonymous',
          type: LogType.ERROR,
          severity: LogSeverity.HIGH,
          message: 'Kayıt işlemi başarısız',
          metadata: {
            details: {
              code: 'AUTH_ERROR',
              email: formData.email,
              error: response.message
            }
          }
        });
      }
    } catch (error) {
      console.error('Register error:', error);
      setError('Kayıt sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">xBot&apos;a Kayıt Ol</CardTitle>
          <CardDescription>
            Twitter hesaplarınızı yönetmek için hesap oluşturun
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
              <label htmlFor="displayName" className="text-sm font-medium">
                Ad Soyad
              </label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="Ad Soyad"
                value={formData.displayName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-posta
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ornek@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Şifre
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Şifre Tekrar
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </Button>
            <div className="text-sm text-center">
              <span className="text-muted-foreground">
                Zaten hesabınız var mı?{' '}
                <Link 
                  href="/login"
                  className="text-primary hover:underline"
                >
                  Giriş Yap
                </Link>
              </span>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 