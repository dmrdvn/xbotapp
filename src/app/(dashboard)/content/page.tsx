"use client";

import { ContentGenerator } from "@/components/content/ContentGenerator";
import { QueueManager } from "@/components/content/QueueManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfiles } from "@/hooks/use-profiles";

export default function ContentPage() {
  const { profiles, loading: isLoadingProfiles } = useProfiles();

  if (isLoadingProfiles) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-[200px]">
          <div className="text-muted-foreground">Profiller yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <Tabs defaultValue="generate">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="generate">İçerik Oluştur</TabsTrigger>
            <TabsTrigger value="queue">Kuyruk Yönetimi</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="generate">
          <ContentGenerator 
            profiles={profiles}
          />
        </TabsContent>
        
        <TabsContent value="queue" className="mt-6">
          <QueueManager 
            profiles={profiles}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
