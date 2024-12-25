"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, User, Settings, Bot, MessageSquare, Activity, Zap } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { auth } from "@/services/firebase/config";
import { getUserLogs, getLogStats } from "@/services/firebase/log";
import { LogType, LogSeverity, Log } from "@/types/log";
import { toast } from "@/components/ui/use-toast";

const LOGS_PER_PAGE = 20;

const filterFormSchema = z.object({
  type: z.array(z.nativeEnum(LogType)).optional(),
  severity: z.array(z.nativeEnum(LogSeverity)).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FilterFormValues = z.infer<typeof filterFormSchema>;

interface LogStats {
  totalLogs: number;
  byType: Record<LogType, number>;
  bySeverity: Record<LogSeverity, number>;
  lastError?: {
    message: string;
    createdAt: Date;
  };
}

// Log tiplerini kategorilere ayır
const logCategories = {
  system: [LogType.SYSTEM, LogType.ERROR, LogType.WARNING, LogType.INFO, LogType.DEBUG],
  user: [LogType.USER_LOGIN, LogType.USER_LOGOUT, LogType.USER_REGISTER, LogType.USER_UPDATE, LogType.USER_DELETE],
  profile: [LogType.PROFILE_CREATED, LogType.PROFILE_UPDATED, LogType.PROFILE_DELETED, LogType.PROFILE_CONNECT, LogType.PROFILE_DISCONNECT],
  bot: [LogType.BOT_ENABLED, LogType.BOT_DISABLED, LogType.BOT_SETTINGS_UPDATE],
  content: [LogType.CONTENT_QUEUED, LogType.TWEET_CREATED, LogType.TWEET_SCHEDULED, LogType.TWEET_PUBLISHED, LogType.TWEET_FAILED,
           LogType.REPLY_CREATED, LogType.REPLY_SCHEDULED, LogType.REPLY_PUBLISHED, LogType.REPLY_FAILED],
  interaction: [LogType.LIKE_PERFORMED, LogType.RETWEET_PERFORMED, LogType.FOLLOW_PERFORMED, LogType.UNFOLLOW_PERFORMED],
  api: [LogType.API_RATE_LIMIT, LogType.API_ERROR, LogType.OPENAI_ERROR]
};

export default function LogsPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      type: [],
      severity: [],
      startDate: "",
      endDate: "",
    },
  });

  const loadLogs = useCallback(async (filters?: FilterFormValues, isLoadMore: boolean = false) => {
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Hata",
        description: "Oturum açmanız gerekiyor",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Loglar yükleniyor...", { filters, userId: user.uid });

      // İlk yüklemede veya filtre değiştiğinde istatistikleri getir
      if (!isLoadMore) {
        const statsResponse = await getLogStats(user.uid, {
          startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
          endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
        });

        console.log("İstatistikler alındı:", statsResponse);

        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        }
      }

      // Logları getir
      const logsResponse = await getUserLogs(user.uid, {
        type: !filters?.type?.length || filters.type[0] === LogType.ALL ? undefined : filters.type,
        severity: !filters?.severity?.length || filters.severity[0] === LogSeverity.ALL ? undefined : filters.severity,
        startDate: filters?.startDate ? new Date(filters.startDate) : undefined,
        endDate: filters?.endDate ? new Date(filters.endDate) : undefined,
        maxResults: LOGS_PER_PAGE,
        page: page,
      });

      console.log("Loglar alındı:", logsResponse);

      if (logsResponse.success && logsResponse.data) {
        const newLogs = logsResponse.data;
        setLogs(isLoadMore ? [...logs, ...newLogs] : newLogs);
        setHasMore(newLogs.length === LOGS_PER_PAGE);
      } else {
        toast({
          title: "Hata",
          description: logsResponse.error || "Loglar yüklenirken bir hata oluştu",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Log yükleme hatası:", error);
      toast({
        title: "Hata",
        description: "Loglar yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, logs]);

  // İlk yükleme
  useEffect(() => {
    const savedFilters = localStorage.getItem('logFilters');
    if (savedFilters) {
      const filters = JSON.parse(savedFilters);
      form.setValue('type', filters.type || []);
      form.setValue('severity', filters.severity || []);
    }
    loadLogs(form.getValues());
  }, [form, loadLogs]);

  const loadMore = () => {
    setPage(prev => prev + 1);
    loadLogs(form.getValues(), true);
  };

  const onSubmit = async (data: FilterFormValues) => {
    setPage(1);
    setHasMore(true);
    localStorage.setItem('logFilters', JSON.stringify(data));
    await loadLogs(data);
  };

  const getSeverityColor = (severity: LogSeverity) => {
    switch (severity) {
      case LogSeverity.LOW:
        return "text-green-500";
      case LogSeverity.MEDIUM:
        return "text-yellow-500";
      case LogSeverity.HIGH:
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  const getTypeColor = (type: LogType) => {
    // Sistem logları
    if (logCategories.system.includes(type)) {
      return "text-purple-500";
    }
    // Kullanıcı logları
    if (logCategories.user.includes(type)) {
      return "text-blue-500";
    }
    // Profil logları
    if (logCategories.profile.includes(type)) {
      return "text-green-500";
    }
    // Bot logları
    if (logCategories.bot.includes(type)) {
      return "text-yellow-500";
    }
    // İçerik logları
    if (logCategories.content.includes(type)) {
      return "text-indigo-500";
    }
    // Etkileşim logları
    if (logCategories.interaction.includes(type)) {
      return "text-pink-500";
    }
    // API logları
    if (logCategories.api.includes(type)) {
      return "text-red-500";
    }
    return "text-gray-500";
  };

  const getTypeIcon = (type: LogType) => {
    // Sistem logları
    if (logCategories.system.includes(type)) {
      return <AlertCircle className="h-4 w-4" />;
    }
    // Kullanıcı logları
    if (logCategories.user.includes(type)) {
      return <User className="h-4 w-4" />;
    }
    // Profil logları
    if (logCategories.profile.includes(type)) {
      return <Settings className="h-4 w-4" />;
    }
    // Bot logları
    if (logCategories.bot.includes(type)) {
      return <Bot className="h-4 w-4" />;
    }
    // İçerik logları
    if (logCategories.content.includes(type)) {
      return <MessageSquare className="h-4 w-4" />;
    }
    // Etkileşim logları
    if (logCategories.interaction.includes(type)) {
      return <Activity className="h-4 w-4" />;
    }
    // API logları
    if (logCategories.api.includes(type)) {
      return <Zap className="h-4 w-4" />;
    }
    return null;
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
      <div>
        <h1 className="text-3xl font-bold">Platform Logları</h1>
        <p className="text-muted-foreground">
          Tüm platform aktivitelerini ve sistem loglarını görüntüleyin
        </p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam İşlem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Bot İşlemleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {(stats.byType[LogType.BOT_ENABLED] || 0) +
                 (stats.byType[LogType.BOT_DISABLED] || 0) +
                 (stats.byType[LogType.BOT_SETTINGS_UPDATE] || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                İçerik İşlemleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-500">
                {(stats.byType[LogType.TWEET_PUBLISHED] || 0) +
                 (stats.byType[LogType.REPLY_PUBLISHED] || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Son Hata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-red-500">
                {stats.lastError ? (
                  <>
                    <div className="font-medium">{stats.lastError.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {stats.lastError.createdAt ? format(stats.lastError.createdAt, "dd MMM yyyy HH:mm", { locale: tr }) : ''}
                    </div>
                  </>
                ) : (
                  "Hata yok"
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Log Filtreleri</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Log Tipi</FormLabel>
                      <Select
                        value={field.value?.[0]}
                        onValueChange={(value) => field.onChange([value])}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tüm tipler" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px] overflow-y-auto">
                          <SelectItem value={LogType.ALL}>Tüm tipler</SelectItem>
                          <div key="system-header" className="p-2 text-sm font-medium text-muted-foreground">Sistem</div>
                          {logCategories.system.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                          <div key="user-header" className="p-2 text-sm font-medium text-muted-foreground">Kullanıcı</div>
                          {logCategories.user.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                          <div key="profile-header" className="p-2 text-sm font-medium text-muted-foreground">Profil</div>
                          {logCategories.profile.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                          <div key="bot-header" className="p-2 text-sm font-medium text-muted-foreground">Bot</div>
                          {logCategories.bot.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                          <div key="content-header" className="p-2 text-sm font-medium text-muted-foreground">İçerik</div>
                          {logCategories.content.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                          <div key="interaction-header" className="p-2 text-sm font-medium text-muted-foreground">Etkileşim</div>
                          {logCategories.interaction.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                          <div key="api-header" className="p-2 text-sm font-medium text-muted-foreground">API</div>
                          {logCategories.api.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Önem Seviyesi</FormLabel>
                      <Select
                        value={field.value?.[0]}
                        onValueChange={(value) => field.onChange([value])}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Tüm seviyeler" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={LogSeverity.ALL}>Tüm seviyeler</SelectItem>
                          {Object.values(LogSeverity)
                            .filter(severity => severity !== LogSeverity.ALL)
                            .map((severity) => (
                            <SelectItem key={severity} value={severity}>
                              {severity}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Başlangıç Tarihi</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bitiş Tarihi</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit">Filtrele</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Kayıtları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-col space-y-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`p-2 rounded-full bg-background ${getTypeColor(log.type)}`}>
                      {getTypeIcon(log.type)}
                    </span>
                    <div>
                      <span className={`font-medium ${getTypeColor(log.type)}`}>
                        {log.type}
                      </span>
                      <span className={`ml-2 text-xs px-2 py-1 rounded-full ${getSeverityColor(log.severity)} bg-background`}>
                        {log.severity}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-xs text-muted-foreground">
                    <span>{log.createdAt ? format(log.createdAt, "dd MMM yyyy", { locale: tr }) : ''}</span>
                    <span>{log.createdAt ? format(log.createdAt, "HH:mm:ss", { locale: tr }) : ''}</span>
                  </div>
                </div>
                <p className="text-sm mt-2">{log.message}</p>
                {log.metadata && (
                  <div className="mt-3">
                    {log.metadata.details && (
                      <div className="text-xs bg-muted/50 rounded-md overflow-hidden">
                        <div className="px-3 py-2 border-b bg-muted/70 font-medium flex items-center justify-between">
                          <span>Details</span>
                          {log.metadata.profileId && (
                            <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs">
                              Profile ID: {log.metadata.profileId}
                            </span>
                          )}
                        </div>
                        <div className="p-3 space-y-2">
                          {Object.entries(log.metadata.details).map(([key, value]) => (
                            value && (
                              <div key={key} className="grid grid-cols-12 gap-2">
                                <span className="col-span-3 font-medium text-muted-foreground capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                                </span>
                                <span className="col-span-9 font-mono text-xs">
                                  {key === 'scheduledFor' || key === 'twitterConnectedAt' 
                                    ? format(new Date(value as string), "dd MMM yyyy HH:mm:ss", { locale: tr })
                                    : typeof value === 'object' 
                                      ? JSON.stringify(value, null, 2) 
                                      : String(value)
                                  }
                                </span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {logs.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Log kaydı bulunamadı
              </div>
            )}

            {hasMore && !loading && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  className="w-full"
                >
                  Daha Fazla Yükle
                </Button>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 