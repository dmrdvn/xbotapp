"use client";

import { useState, useEffect, useCallback } from "react";
import { Content, ContentStatus } from "@/types/Content";
import { Profile } from "@/types/profile";
import { getAuth } from "firebase/auth";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface QueueManagerProps {
  profiles: Profile[];
}

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export function QueueManager({ profiles }: QueueManagerProps) {
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ContentStatus | "all">("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // İçerikleri getir
  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error("Yetkilendirme gerekli");
      }

      // Tüm profillerin içeriklerini getir
      const allContents = await Promise.all(
        profiles.map(async (profile) => {
          const response = await fetch(`/api/content/list?profileId=${profile.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          return data.success ? data.data : [];
        })
      );

      // İçerikleri birleştir
      const mergedContents = allContents.flat();
      setContents(mergedContents);
    } catch (error) {
      console.error('İçerikler yüklenirken hata:', error);
      toast.error('İçerikler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [profiles]);

  // Event listener'ı ekle
  useEffect(() => {
    const handleQueueUpdate = () => {
      console.log("[QueueManager] Queue updated event alındı");
      fetchContents();
    };

    // Event listener'ı kaydet
    window.addEventListener('queueUpdated', handleQueueUpdate);

    // İlk yükleme
    fetchContents();

    // Cleanup
    return () => {
      window.removeEventListener('queueUpdated', handleQueueUpdate);
    };
  }, [profiles, fetchContents]); // profiles ve fetchContents değiştiğinde yeniden yükle

  // İçerik durumunu güncelle
  const handleStatusChange = async (contentId: string, newStatus: ContentStatus) => {
    setIsUpdating(contentId);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();

      if (!token) {
        throw new Error("Yetkilendirme gerekli");
      }

      const response = await fetch(`/api/content/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contentId,
          status: newStatus
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Durum güncellenemedi");
      }

      // İçerikleri yenile
      await fetchContents();
      toast.success("Durum başarıyla güncellendi");

    } catch (error) {
      console.error('Durum güncellenirken hata:', error);
      toast.error('Durum güncellenirken bir hata oluştu');
    } finally {
      setIsUpdating(null);
    }
  };

  // İçerikleri filtrele
  const filteredContents = contents.filter(
    (content) => selectedStatus === "all" || content.status === selectedStatus
  );

  const formatDate = (date: Date | string | FirestoreTimestamp | null | undefined) => {
    if (!date) return "-";
    try {
      // Firestore Timestamp kontrolü
      if (typeof date === 'object' && 'seconds' in date) {
        // Firestore Timestamp'i Date objesine çevir
        const dateObj = new Date((date as FirestoreTimestamp).seconds * 1000);
        return dateObj.toLocaleString('tr-TR', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Normal tarih string'i veya Date objesi ise
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleString('tr-TR', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select
          value={selectedStatus}
          onValueChange={(value) => setSelectedStatus(value as ContentStatus | "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Durum filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="queued">Kuyrukta</SelectItem>
            <SelectItem value="published">Yayınlandı</SelectItem>
            <SelectItem value="failed">Başarısız</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profil</TableHead>
              <TableHead>İçerik</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Oluşturulma</TableHead>
              <TableHead>Planlanma</TableHead>
              <TableHead>Yayınlanma</TableHead>
              <TableHead>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : contents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Henüz içerik yok
                </TableCell>
              </TableRow>
            ) : (
              filteredContents.map((content) => {
                const profile = profiles.find(p => p.id === content.profileId);
                return (
                  <TableRow key={content.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            <User2 className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{profile?.name || "Silinmiş Profil"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate font-medium">
                      {content.content}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          content.status === "published" && "bg-green-500/10 text-green-500 hover:bg-green-500/20",
                          content.status === "failed" && "bg-red-500/10 text-red-500 hover:bg-red-500/20",
                          content.status === "queued" && "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                        )}
                      >
                        {content.status === "queued"
                          ? "Kuyrukta"
                          : content.status === "published"
                          ? "Yayınlandı"
                          : "Başarısız"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(content.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(content.scheduledFor)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(content.publishedAt)}
                    </TableCell>
                    <TableCell>
                      {content.status === "queued" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(content.id!, "published")}
                          disabled={isUpdating === content.id}
                        >
                          {isUpdating === content.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Yayınlanıyor
                            </>
                          ) : (
                            "Hemen Yayınla"
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}