"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auth } from "@/services/firebase/config";
import { getUserSettings, updateUserSettings } from "@/services/firebase/settings";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

// List of common timezones
const TIMEZONES = [
  "UTC",
  "Europe/Istanbul",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Tokyo"
];

// Language type
type Language = "tr" | "en";

// Settings type for general settings only
export interface GeneralSettings {
  timezone: string;
  language: Language;
}

const settingsFormSchema = z.object({
  timezone: z.string(),
  language: z.enum(["tr", "en"]),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Auth durumunu kontrol et
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        toast({
          title: "Yetkisiz Erişim",
          description: "Bu sayfaya erişmek için giriş yapmanız gerekiyor.",
          variant: "destructive",
        });
        router.push("/auth/login");
      }
    });

    return () => unsubscribe();
  }, [router, toast]);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: "tr",
    },
  });

  // Ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const settingsResponse = await getUserSettings(user.uid);
        if (settingsResponse.success && settingsResponse.data) {
          const language = settingsResponse.data.language as Language || "tr";
          const generalSettings: GeneralSettings = {
            timezone: settingsResponse.data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            language,
          };
          form.reset(generalSettings);
        }
      } catch (error) {
        console.error("Ayarlar yüklenirken hata:", error);
        toast({
          title: "Hata",
          description: "Ayarlar yüklenirken bir hata oluştu.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [form, toast]);

  async function onSubmit(data: SettingsFormValues) {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Hata",
        description: "Oturum açmanız gerekiyor.",
        variant: "destructive",
      });
      router.push("/auth/login");
      return;
    }

    try {
      // Mevcut ayarları al ve sadece genel ayarları güncelle
      const currentSettings = await getUserSettings(user.uid);
      if (!currentSettings.success) {
        throw new Error("Mevcut ayarlar alınamadı");
      }

      // Varsayılan değerleri oluştur
      const defaultSettings = {
        tweetFrequency: {
          minTweetsPerDay: 3,
          maxTweetsPerDay: 8,
          minInterval: 30,
        },
        replyFrequency: {
          minRepliesPerDay: 5,
          maxRepliesPerDay: 15,
          minInterval: 10,
        },
        interactionLimits: {
          maxLikesPerDay: 100,
          maxRetweetsPerDay: 20,
          maxFollowsPerDay: 20,
        },
        activeHours: {
          start: "09:00",
          end: "21:00",
        },
        isEnabled: false,
      };

      // Mevcut ayarları koru ve sadece genel ayarları güncelle
      const updatedSettings = {
        ...defaultSettings,
        ...currentSettings.data,
        timezone: data.timezone,
        language: data.language,
        userId: user.uid, // Kullanıcı ID'sini ekle
      };
      
      await updateUserSettings(user.uid, updatedSettings);
      toast({
        title: "Başarılı",
        description: "Ayarlarınız başarıyla güncellendi.",
      });
    } catch (error) {
      console.error("Ayarlar güncellenirken hata:", error);
      toast({
        title: "Hata",
        description: "Ayarlar güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Genel Ayarlar</h1>
        <p className="text-muted-foreground">
          Uygulama genelinde kullanılacak ayarları yapılandırın.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Sistem Ayarları</CardTitle>
              <CardDescription>
                Zaman dilimi ve dil gibi temel ayarları yapılandırın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zaman Dilimi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Zaman dilimi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIMEZONES.map((timezone) => (
                          <SelectItem key={timezone} value={timezone}>
                            {timezone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Tüm tarih ve saat gösterimleri için kullanılacak zaman dilimi
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dil</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Dil seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Uygulama arayüzünde kullanılacak dil
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full">
            Ayarları Kaydet
          </Button>
        </form>
      </Form>
    </div>
  );
} 