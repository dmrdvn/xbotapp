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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auth } from "@/services/firebase/config";
import { getUserSettings, updateUserSettings } from "@/services/firebase/settings";



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

const settingsFormSchema = z.object({
  tweetFrequency: z.object({
    minTweetsPerDay: z.number().min(0).max(48),
    maxTweetsPerDay: z.number().min(0).max(48),
    minInterval: z.number().min(15),
  }),
  replyFrequency: z.object({
    minRepliesPerDay: z.number().min(0).max(100),
    maxRepliesPerDay: z.number().min(0).max(100),
    minInterval: z.number().min(5),
  }),
  interactionLimits: z.object({
    maxLikesPerDay: z.number().min(0).max(500),
    maxRetweetsPerDay: z.number().min(0).max(100),
    maxFollowsPerDay: z.number().min(0).max(100),
  }),
  activeHours: z.object({
    start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "HH:mm formatında olmalı"),
    end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "HH:mm formatında olmalı"),
  }),
  timezone: z.string(),
  isEnabled: z.boolean(),
}).refine((data) => {
  return data.tweetFrequency.maxTweetsPerDay >= data.tweetFrequency.minTweetsPerDay;
}, {
  message: "Maksimum tweet sayısı, minimum tweet sayısından büyük veya eşit olmalı",
  path: ["tweetFrequency.maxTweetsPerDay"],
}).refine((data) => {
  return data.replyFrequency.maxRepliesPerDay >= data.replyFrequency.minRepliesPerDay;
}, {
  message: "Maksimum yanıt sayısı, minimum yanıt sayısından büyük veya eşit olmalı",
  path: ["replyFrequency.maxRepliesPerDay"],
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
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
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isEnabled: false,
    },
  });

  // Ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const settingsResponse = await getUserSettings(user.uid);
        if (settingsResponse.success && settingsResponse.data) {
          form.reset(settingsResponse.data);

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
    if (!user) return;

    try {
      await updateUserSettings(user.uid, data);
 

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
        <h1 className="text-3xl font-bold">Ayarlar</h1>
        <p className="text-muted-foreground">
          Twitter bot davranışlarını ve limitlerini yapılandırın.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Tweet Sıklığı</CardTitle>
              <CardDescription>
                Botun ne sıklıkla tweet atması gerektiğini yapılandırın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="tweetFrequency.minTweetsPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Tweet/Gün</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tweetFrequency.maxTweetsPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Tweet/Gün</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tweetFrequency.minInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Aralık (dk)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yanıt Sıklığı</CardTitle>
              <CardDescription>
                Botun diğer tweetlere ne sıklıkla yanıt vermesi gerektiğini yapılandırın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="replyFrequency.minRepliesPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Yanıt/Gün</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="replyFrequency.maxRepliesPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Yanıt/Gün</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="replyFrequency.minInterval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Aralık (dk)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Etkileşim Limitleri</CardTitle>
              <CardDescription>
                Günlük maksimum etkileşim limitlerini ayarlayın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="interactionLimits.maxLikesPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Beğeni/Gün</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interactionLimits.maxRetweetsPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Retweet/Gün</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interactionLimits.maxFollowsPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Takip/Gün</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aktif Saatler</CardTitle>
              <CardDescription>
                Botun aktif olacağı saat aralığını belirleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="activeHours.start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Başlangıç Saati</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="activeHours.end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bitiş Saati</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
              <CardDescription>
                Zaman dilimi ve bot durumu gibi genel ayarları yapılandırın.
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Bot Durumu</FormLabel>
                      <FormDescription>
                        Botu etkinleştirin veya devre dışı bırakın
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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