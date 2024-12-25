"use client"
import { Button } from '@/components/ui/button';
import { Twitter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface TwitterConnectButtonProps {
  profileId: string;
  isConnected?: boolean;
  onConnect?: () => Promise<void>;
  onDisconnect?: () => Promise<void>;
}

export function TwitterConnectButton({ profileId, isConnected, onConnect, onDisconnect }: TwitterConnectButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      if (onConnect) {
        await onConnect();
      }
      window.location.href = `/api/auth/twitter/connect?profile_id=${profileId}`;
    } catch (error) {
      console.error('Failed to connect Twitter:', error);
      toast.error('Twitter bağlantısı başlatılırken bir hata oluştu');
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/twitter/disconnect?profile_id=${profileId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect Twitter');
      }

      if (onDisconnect) {
        await onDisconnect();
      }

      toast.success('Twitter bağlantısı kesildi');
      router.refresh();
    } catch (error) {
      console.error('Failed to disconnect Twitter:', error);
      toast.error('Twitter bağlantısı kesilirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isConnected ? "destructive" : "default"}
      size="sm"
      disabled={isLoading}
      onClick={isConnected ? handleDisconnect : handleConnect}
      className="flex items-center gap-2"
    >
      <Twitter className="h-4 w-4" />
      <span>
        {isLoading
          ? 'İşlem yapılıyor...'
          : isConnected
          ? 'Twitter Bağlantısını Kes'
          : 'Twitter\'a Bağlan'}
      </span>
    </Button>
  );
} 