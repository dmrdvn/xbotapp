"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useRouter } from "next/navigation";
import { auth } from "@/services/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfiles } from "@/services/firebase/profile";
import { createLog } from "@/services/firebase/log";
import { LogType, LogSeverity } from "@/types/log";
import { Profile } from "@/types/profile";
import { User } from "@/types/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'User',
          emailVerified: firebaseUser.emailVerified,
          isActive: firebaseUser.emailVerified,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          role: 'user'
        });

        // Kullanıcının profillerini getir
        try {
          const response = await getUserProfiles(firebaseUser.uid);
          if (response.success && response.data) {
            setProfiles(response.data);
          }
        } catch (error) {
          console.error("Profil getirme hatası:", error);
          await createLog({
            userId: firebaseUser.uid,
            type: LogType.ERROR,
            severity: LogSeverity.HIGH,
            message: "Profiller yüklenirken hata oluştu",
            metadata: {
              details: {
                code: "PROFILE_FETCH_ERROR",
                error: error instanceof Error ? error.message : "Bilinmeyen hata"
              }
            }
          });
        }
      } else {
        setUser(null);
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      if (user) {
        await createLog({
          userId: user.id,
          type: LogType.USER_LOGOUT,
          severity: LogSeverity.LOW,
          message: "Kullanıcı çıkış yaptı",
          metadata: {
            details: {
              email: user.email
            }
          }
        });
      }
      
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Çıkış hatası:", error);
      if (user) {
        await createLog({
          userId: user.id,
          type: LogType.ERROR,
          severity: LogSeverity.HIGH,
          message: "Çıkış yapılırken hata oluştu",
          metadata: {
            details: {
              code: "LOGOUT_ERROR",
              error: error instanceof Error ? error.message : "Bilinmeyen hata"
            }
          }
        });
      }
    }
  };

  // Loading durumunda
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  // Kullanıcı yoksa hiçbir şey render etme
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={user}
        onLogout={handleLogout}
      />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar profiles={profiles} className="w-64 border-r" />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 