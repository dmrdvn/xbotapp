import { useState, useEffect } from "react";
import { Profile } from "@/types/profile";
import { getUserProfiles } from "@/services/firebase/profile";
import { auth } from "@/services/firebase/config";

export function useProfiles() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Kullanıcı oturumu bulunamadı");
          return;
        }

        const response = await getUserProfiles(user.uid);
        if (response.success && response.data) {
          setProfiles(response.data);
        } else {
          setError("Profiller yüklenemedi");
        }
      } catch (error) {
        console.error("Profil yükleme hatası:", error);
        setError("Profiller yüklenirken bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, []);

  const refreshProfiles = async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (user) {
      try {
        const response = await getUserProfiles(user.uid);
        if (response.success && response.data) {
          setProfiles(response.data);
        }
      } catch (error) {
        console.error("Profil yenileme hatası:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return {
    profiles,
    loading,
    error,
    refreshProfiles,
  };
} 