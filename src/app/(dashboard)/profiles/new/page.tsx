"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { auth } from "@/services/firebase/config";
import { createProfile } from "@/services/firebase/profile";
import { createLog } from "@/services/firebase/log";
import { LogType, LogSeverity } from "@/types/log";
import { BotBehaviorSettings, CreateProfileDTO } from "@/types/profile";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

// Form için Zod şeması - CreateProfileDTO ile eşleşir
const profileFormSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  surname: z.string().min(2, "Soyisim en az 2 karakter olmalıdır"),
  age: z.number().min(18, "Yaş en az 18 olmalıdır").max(100, "Yaş en fazla 100 olabilir"),
  occupation: z.string().min(2, "Meslek en az 2 karakter olmalıdır"),
  lifestyle: z.string().min(2, "Yaşam tarzı en az 2 karakter olmalıdır"),
  mentality: z.string().min(2, "Düşünce yapısı en az 2 karakter olmalıdır"),
  toneOfVoice: z.string().min(2, "Konuşma tarzı en az 2 karakter olmalıdır"),
  personalityTraits: z.array(z.string()).default([]).transform((val) => {
    if (Array.isArray(val)) return val;
    return [];
  }),
  interests: z.array(z.string()).default([]).transform((val) => {
    if (Array.isArray(val)) return val;
    return [];
  }),
  language: z.string().default("tr"),
  isActive: z.boolean().default(false),
  botBehavior: z.object({
    tweetsPerDay: z.number().min(1, "Günlük tweet sayısı en az 1 olmalıdır").max(48, "Günlük tweet sayısı en fazla 48 olabilir"),
    repliesPerDay: z.number().min(0, "Günlük yanıt sayısı en az 0 olmalıdır").max(100, "Günlük yanıt sayısı en fazla 100 olabilir"),
    likesPerDay: z.number().min(0, "Günlük beğeni sayısı en az 0 olmalıdır").max(100, "Günlük beğeni sayısı en fazla 100 olabilir"),
    retweetsPerDay: z.number().min(0, "Günlük retweet sayısı en az 0 olmalıdır").max(100, "Günlük retweet sayısı en fazla 100 olabilir"),
    followsPerDay: z.number().min(0, "Günlük takip sayısı en az 0 olmalıdır").max(100, "Günlük takip sayısı en fazla 100 olabilir"),
    minDelayBetweenActions: z.number().min(1, "İşlemler arası minimum süre en az 1 dakika olmalıdır"),
    maxDelayBetweenActions: z.number().min(1, "İşlemler arası maksimum süre en az 1 dakika olmalıdır"),
    activeHoursStart: z.number().min(0, "Başlangıç saati 0-23 arasında olmalıdır").max(23, "Başlangıç saati 0-23 arasında olmalıdır"),
    activeHoursEnd: z.number().min(0, "Bitiş saati 0-23 arasında olmalıdır").max(23, "Bitiş saati 0-23 arasında olmalıdır"),
    activeDays: z.array(z.string()).default(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]),
  }).refine((data) => data.maxDelayBetweenActions > data.minDelayBetweenActions, {
    message: "Maksimum süre minimum süreden büyük olmalıdır",
    path: ["maxDelayBetweenActions"],
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const defaultBotBehavior: BotBehaviorSettings = {
  tweetsPerDay: 24,
  repliesPerDay: 50,
  likesPerDay: 50,
  retweetsPerDay: 25,
  followsPerDay: 20,
  minDelayBetweenActions: 15,
  maxDelayBetweenActions: 30,
  activeHoursStart: 9,
  activeHoursEnd: 23,
  activeDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
};

// Özellik ve ilgi alanları için seçenekler
const personalityOptions = [
  "Dışa dönük",
  "İçe dönük",
  "Enerjik",
  "Sakin",
  "Pozitif",
  "Analitik",
  "Yaratıcı",
  "Mantıklı",
  "Duygusal",
  "Sistematik"
];

const interestOptions = [
  "Teknoloji",
  "Spor",
  "Sanat",
  "Bilim",
  "Edebiyat",
  "Seyahat",
  "Oyun",
  "Moda",
  "Sağlık",
  "İş Dünyası",
  "Ekonomi",
  "Politika",
  "Eğitim"
];

export default function NewProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      surname: "",
      age: 25,
      occupation: "",
      lifestyle: "",
      mentality: "",
      toneOfVoice: "",
      language: "tr",
      personalityTraits: [],
      interests: [],
      isActive: false,
      botBehavior: defaultBotBehavior,
    },
  });

  const onSubmit = async (formData: ProfileFormValues) => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("Oturum açmanız gerekiyor");
      router.push("/login");
      return;
    }

    try {
      setLoading(true);

      // CreateProfileDTO tipine uygun veri oluştur
      const profileData: CreateProfileDTO = {
        userId: user.uid,
        name: formData.name,
        surname: formData.surname,
        age: formData.age,
        personalityTraits: formData.personalityTraits,
        interests: formData.interests,
        occupation: formData.occupation,
        lifestyle: formData.lifestyle,
        mentality: formData.mentality,
        toneOfVoice: formData.toneOfVoice,
        language: formData.language,
        botBehavior: formData.botBehavior,
      };

      const response = await createProfile(profileData);

      if (response.success) {
        await createLog({
          userId: user.uid,
          type: LogType.PROFILE_CREATED,
          severity: LogSeverity.MEDIUM,
          message: "Yeni profil oluşturuldu",
          metadata: {
            profileId: response.data?.id,
            details: {
              name: profileData.name
            }
          }
        });

        toast.success("Profil başarıyla oluşturuldu");
        router.push("/profiles");
      } else {
        toast.error(response.message || "Profil oluşturulurken bir hata oluştu");
      }
    } catch (error) {
      console.error("Profil oluşturma hatası:", error);
      toast.error("Profil oluşturulurken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 h-full">
      <div>
        <h1 className="text-3xl font-bold">Yeni Profil Oluştur</h1>
        <p className="text-muted-foreground">
          Bot için yeni bir kişilik profili oluşturun
        </p>
      </div>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Profil Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İsim</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Soyisim</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yaş</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="25"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meslek</FormLabel>
                      <FormControl>
                        <Input placeholder="Yazılım Geliştirici" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lifestyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yaşam Tarzı</FormLabel>
                      <FormControl>
                        <Input placeholder="Aktif, spor sever" {...field} />
                      </FormControl>
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
                          <SelectItem value="en">İngilizce</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="personalityTraits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kişilik Özellikleri</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            const currentTraits = field.value || [];
                            if (!currentTraits.includes(value)) {
                              field.onChange([...currentTraits, value]);
                            }
                          }}
                          value=""
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Özellik seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {personalityOptions.map((trait) => (
                              <SelectItem key={trait} value={trait}>
                                {trait}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value?.map((trait) => (
                          <Button
                            key={trait}
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              field.onChange(field.value?.filter((t) => t !== trait));
                            }}
                          >
                            {trait} ×
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>İlgi Alanları</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            const currentInterests = field.value || [];
                            if (!currentInterests.includes(value)) {
                              field.onChange([...currentInterests, value]);
                            }
                          }}
                          value=""
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="İlgi alanı seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {interestOptions.map((interest) => (
                              <SelectItem key={interest} value={interest}>
                                {interest}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value?.map((interest) => (
                          <Button
                            key={interest}
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              field.onChange(field.value?.filter((i) => i !== interest));
                            }}
                          >
                            {interest} ×
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mentality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Düşünce Yapısı</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Yenilikçi ve analitik düşünce yapısı"
                          className="h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toneOfVoice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konuşma Tarzı</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Profesyonel ve samimi bir dil kullanır"
                          className="h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <CardHeader>
                <CardTitle>Bot Davranışları</CardTitle>
              </CardHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="botBehavior.tweetsPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Günlük Tweet Sayısı</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="botBehavior.repliesPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Günlük Yanıt Sayısı</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="botBehavior.likesPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Günlük Beğeni Sayısı</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="botBehavior.retweetsPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Günlük Retweet Sayısı</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="botBehavior.followsPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Günlük Takip Sayısı</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="botBehavior.minDelayBetweenActions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Bekleme Süresi (dakika)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="botBehavior.maxDelayBetweenActions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maksimum Bekleme Süresi (dakika)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="botBehavior.activeHoursStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aktif Saat Başlangıcı (0-23)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={23}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="botBehavior.activeHoursEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aktif Saat Bitişi (0-23)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={23}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Aktiflik Durumu</FormLabel>
                        <FormDescription>
                          Profil aktif olduğunda bot çalışmaya başlar
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
              </div>

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Oluşturuluyor..." : "Profil Oluştur"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 