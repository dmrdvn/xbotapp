'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { resetPassword } from '@/services/firebase/auth';
import { createLog } from '@/services/firebase/log';
import { LogType, LogSeverity } from '@/types/log';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await resetPassword(email);

      if (response.success) {
        setSuccess(true);
        
        // Başarılı sıfırlama talebi logu
        await createLog({
          userId: 'anonymous',
          type: LogType.USER_REGISTER,
          severity: LogSeverity.MEDIUM,
          message: 'Şifre sıfırlama e-postası gönderildi',
          metadata: {
            details: {
              email: email
            }
          }
        });
      } else {
        setError(response.message);
        
        // Hata logu
        await createLog({
          userId: 'anonymous',
          type: LogType.ERROR,
          severity: LogSeverity.HIGH,
          message: 'Şifre sıfırlama talebi başarısız',
          metadata: {
            details: {
              error: response.message,
              code: 'AUTH_ERROR',
              email: email
            }
          }
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('Şifre sıfırlama işlemi sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Şifre Sıfırlama</CardTitle>
          <CardDescription>
            E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-md text-sm">
                Şifre sıfırlama bağlant��sı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
            </Button>
            <div className="text-sm text-center">
              <Link 
                href="/login"
                className="text-primary hover:underline"
              >
                Giriş sayfasına dön
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 