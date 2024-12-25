"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, MoreVertical, Plus, Pencil, Trash2, Twitter } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { auth } from "@/services/firebase/config";
import { getUserProfiles, deleteProfile } from "@/services/firebase/profile";
import { createLog } from "@/services/firebase/log";
import { LogType, LogSeverity } from "@/types/log";
import { Profile } from "@/types/profile";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";

const getProfileDescription = (profile: Profile): string => {
  const parts = [
    profile.occupation,
    `${profile.age} yaşında`,
    profile.lifestyle
  ].filter(Boolean);

  return parts.join(", ") || "Profil detayları eklenmemiş";
};

export default function ProfilesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const loadProfiles = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      setLoading(true);
      const response = await getUserProfiles(user.uid);
      
      if (response.success && response.data) {
        setProfiles(response.data);
      }
    } catch (error) {
      console.error("Profil yükleme hatası:", error);
      toast.error("Profiller yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleDelete = async (profile: Profile) => {
    if (!profile.id) return;
    
    const user = auth.currentUser;
    if (!user) return;

    try {
      const response = await deleteProfile(profile.id);
      
      if (response.success) {
        // Log oluştur
        await createLog({
          userId: user.uid,
          type: LogType.PROFILE_DELETED,
          severity: LogSeverity.MEDIUM,
          message: "Profil silindi",
          metadata: {
            profileId: profile.id,
            details: {
              code: "PROFILE_DELETED",
              name: profile.name
            }
          }
        });

        toast.success("Profil başarıyla silindi");
        loadProfiles(); // Profil listesini yenile
      } else {
        toast.error(response.message || "Profil silinirken bir hata oluştu");
      }
    } catch (error) {
      console.error("Profil silme hatası:", error);
      toast.error("Profil silinirken bir hata oluştu");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Twitter Profilleri</h1>
          <p className="text-muted-foreground">
            Twitter hesaplarınızı yönetin ve bot ayarlarını yapılandırın
          </p>
        </div>
        <Button asChild>
          <Link href="/profiles/new">
            <Plus className="h-4 w-4 mr-2" />
            Yeni Profil
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <Card key={profile.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="space-y-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  {profile.name} {profile.surname}
                  {profile.isActive && (
                    <Badge variant="secondary" className="ml-2 bg-green-500 hover:bg-green-600">
                      Aktif
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span>Oluşturulma:</span>
                    {profile.createdAt ? format(
                      profile.createdAt instanceof Timestamp 
                        ? profile.createdAt.toDate() 
                        : new Date(profile.createdAt), 
                      "dd MMM yyyy", 
                      { locale: tr }
                    ) : ""}
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push(`/profiles/${profile.id}`)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Düzenle
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={() => handleDelete(profile)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {profile.twitterAccessToken ? (
                    <Badge variant="secondary" className="gap-1">
                      <Twitter className="h-3 w-3" />
                      Twitter Bağlı
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <Twitter className="h-3 w-3" />
                      Twitter Bağlı Değil
                    </Badge>
                  )}
                  {!profile.isActive && (
                    <Badge variant="destructive">
                      Pasif
                    </Badge>
                  )}
                </div>
                <div className="text-sm">
                  {getProfileDescription(profile)}
                </div>
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Tweet/Gün</div>
                    <div className="font-medium">{profile.botBehavior?.tweetsPerDay || 0}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Beğeni/Gün</div>
                    <div className="font-medium">{profile.botBehavior?.likesPerDay || 0}</div>
                  </div>
                </div>
              </div>

              {profile.lastError && (
                <div className="pt-4 border-t">
                  <div className="text-sm text-red-500 flex items-start gap-2">
                    <span className="font-medium">Son hata:</span>
                    <span>{profile.lastError}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {profiles.length === 0 && (
          <div className="col-span-full">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-muted-foreground mb-6">
                  Henüz bir Twitter profili eklenmemiş
                </div>
                <Button asChild>
                  <Link href="/profiles/new">
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Profili Ekle
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 