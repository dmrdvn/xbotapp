"use client";

import { useState, useEffect } from "react";
import { Profile } from "@/types/profile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle2, User2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ContentGeneratorProps {
  profiles: Profile[];
}

export function ContentGenerator({ profiles }: ContentGeneratorProps) {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [generatedContents, setGeneratedContents] = useState<string[]>([]);
  const [selectedContents, setSelectedContents] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingToQueue, setIsAddingToQueue] = useState(false);

  // LocalStorage'dan verileri yükle
  useEffect(() => {
    const savedProfile = localStorage.getItem('selectedProfile');
    const savedContents = localStorage.getItem('generatedContents');
    const savedSelectedContents = localStorage.getItem('selectedContents');

    if (savedProfile) {
      const profile = profiles.find(p => p.id === savedProfile);
      if (profile) setSelectedProfile(profile);
    }

    if (savedContents) {
      setGeneratedContents(JSON.parse(savedContents));
    }

    if (savedSelectedContents) {
      setSelectedContents(new Set(JSON.parse(savedSelectedContents)));
    }
  }, [profiles]);

  // Verileri LocalStorage'a kaydet
  useEffect(() => {
    if (selectedProfile) {
      localStorage.setItem('selectedProfile', selectedProfile.id);
    }
    localStorage.setItem('generatedContents', JSON.stringify(generatedContents));
    localStorage.setItem('selectedContents', JSON.stringify(Array.from(selectedContents)));
  }, [selectedProfile, generatedContents, selectedContents]);

  const handleGenerate = async () => {
    if (!selectedProfile) {
      toast.error("Lütfen bir profil seçin");
      return;
    }

    setIsGenerating(true);
    setSelectedContents(new Set());

    try {
      const contents = await Promise.all(
        Array(6).fill(null).map(() =>
          fetch("/api/ai/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profile: {
                name: selectedProfile.name,
                personalityTraits: selectedProfile.personalityTraits,
                interests: selectedProfile.interests,
                toneOfVoice: selectedProfile.toneOfVoice,
                language: selectedProfile.language
              }
            }),
          }).then(res => res.json())
        )
      );

      const newContents = contents.map(c => c.content || c.data).filter(Boolean);
      setGeneratedContents(newContents);
      toast.success("İçerikler başarıyla üretildi!");
    } catch (error) {
      console.error("İçerik üretme hatası:", error);
      toast.error("İçerik üretilirken bir hata oluştu");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToQueue = async () => {
    if (!selectedProfile) {
      toast.error("Lütfen bir profil seçin");
      return;
    }

    if (selectedContents.size === 0) {
      toast.error("Lütfen en az bir içerik seçin");
      return;
    }

    setIsAddingToQueue(true);

    try {
      // Seçili içerikleri kuyruğa ekle
      const selectedItems = generatedContents.filter((_, index) => selectedContents.has(index));
      
      // Her içerik için Firebase'e kaydet
      const promises = selectedItems.map(async (content) => {
        const scheduledFor = new Date();
        scheduledFor.setHours(scheduledFor.getHours() + 1); // 1 saat sonrası

        const response = await fetch("/api/content/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            profileId: selectedProfile.id,
            content,
            scheduledFor: scheduledFor.toISOString()  // ISO string formatına çevir
          })
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || "İçerik kaydedilemedi");
        }

        return data;
      });

      await Promise.all(promises);

      // Event tetikle
      window.dispatchEvent(new Event('queueUpdated'));

      // Seçili içerikleri temizle
      setSelectedContents(new Set());
      
      // Üretilen içerikleri temizle
      setGeneratedContents([]);

      // LocalStorage'ı temizle
      localStorage.removeItem('generatedContents');
      localStorage.removeItem('selectedContents');

      toast.success("Seçili içerikler kuyruğa eklendi");
    } catch (error) {
      console.error("Kuyruğa ekleme hatası:", error);
      toast.error("İçerikler kuyruğa eklenirken bir hata oluştu");
    } finally {
      setIsAddingToQueue(false);
    }
  };

  const toggleContent = (index: number) => {
    const newSelected = new Set(Array.from(selectedContents));
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedContents(newSelected);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select
          value={selectedProfile?.id}
          onValueChange={(profileId) => {
            const profile = profiles.find(p => p.id === profileId);
            setSelectedProfile(profile || null);
          }}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Profil seçin">
              {selectedProfile && (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      <User2 className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedProfile.name}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      <User2 className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span>{profile.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          onClick={() => handleGenerate()} 
          disabled={!selectedProfile || isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              İçerik Üretiliyor
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              İçerik Üret
            </>
          )}
        </Button>
      </div>

      {generatedContents.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {generatedContents.map((content, index) => (
            <Card
              key={index}
              className={`cursor-pointer overflow-hidden transition-colors ${
                selectedContents.has(index) ? 'bg-muted/50' : 'hover:bg-muted/50'
              }`}
              onClick={() => toggleContent(index)}
            >
              <div className="p-6">
                {/* Tweet Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        <User2 className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">
                        {selectedProfile?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        @{selectedProfile?.name?.toLowerCase().replace(/\s+/g, '')}
                      </p>
                    </div>
                  </div>
                  {selectedContents.has(index) && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>

                {/* Tweet Content */}
                <div className="mb-3">
                  <p className="whitespace-pre-wrap text-[15px] font-medium leading-normal text-foreground">
                    {content}
                  </p>
                </div>

                {/* Tweet Footer */}
                <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
                  <Badge variant="outline" className="bg-background text-xs font-normal">
                    Tweet {index + 1}
                  </Badge>
                  {selectedContents.has(index) ? (
                    <span className="text-xs text-primary">Kuyruğa Eklenecek</span>
                  ) : (
                    <span className="text-xs">Seç</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedContents.size > 0 && (
        <div className="sticky bottom-4 flex justify-end gap-2">
          <Button
            onClick={() => handleAddToQueue()}
            disabled={selectedContents.size === 0 || isAddingToQueue}
            size="lg"
            className="shadow-lg"
          >
            {isAddingToQueue ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Kuyruğa Ekleniyor
              </>
            ) : (
              `Seçilenleri (${selectedContents.size}) Kuyruğa Ekle`
            )}
          </Button>
        </div>
      )}
    </div>
  );
} 