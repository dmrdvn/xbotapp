"use client";

import { useState, useEffect } from "react";
import { Content, ContentStatus } from "@/types/Content";
import { Log, LogSeverity } from "@/types/log";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Clock,
  Loader2,
  User2,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { db, auth } from "@/services/firebase/config";
import { collection, query, getDocs, orderBy, limit, where } from "firebase/firestore";
import { toast } from "@/components/ui/use-toast";

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

function formatDate(date: Date | FirestoreTimestamp | null | undefined) {
  if (!date) return "-";
  
  try {
    // Firestore Timestamp kontrolü
    if (typeof date === 'object' && 'seconds' in date) {
      return format(new Date((date as FirestoreTimestamp).seconds * 1000), "dd MMM yyyy HH:mm", { locale: tr });
    }
    
    // Normal Date objesi
    return format(new Date(date), "dd MMM yyyy HH:mm", { locale: tr });
  } catch {
    return "-";
  }
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [recentContents, setRecentContents] = useState<Content[]>([]);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState({
    totalQueued: 0,
    totalPublished: 0,
    totalFailed: 0,
    recentErrors: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
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

      // Fetch recent contents
      const contentsRef = collection(db, "contents");
      const contentsQuery = query(
        contentsRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const contentsSnapshot = await getDocs(contentsQuery);
      const contents = contentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Content[];
      setRecentContents(contents);

      // Fetch recent logs
      const logsRef = collection(db, "logs");
      const logsQuery = query(
        logsRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const logsSnapshot = await getDocs(logsQuery);
      const logs = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Log[];
      setRecentLogs(logs);

      // Calculate stats for user's contents only
      const allContentsQuery = query(
        contentsRef,
        where("userId", "==", user.uid)
      );
      const allContentsSnapshot = await getDocs(allContentsQuery);
      const allContents = allContentsSnapshot.docs.map(doc => doc.data() as Content);

      setStats({
        totalQueued: allContents.filter(c => c.status === "queued").length,
        totalPublished: allContents.filter(c => c.status === "published").length,
        totalFailed: allContents.filter(c => c.status === "failed").length,
        recentErrors: logs.filter(l => l.severity === LogSeverity.HIGH).length
      });

    } catch (error) {
      console.error("Dashboard veri yükleme hatası:", error);
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ContentStatus) => {
    switch (status) {
      case "queued":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Kuyrukta
          </Badge>
        );
      case "published":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Yayınlandı
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Başarısız
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {status}
          </Badge>
        );
    }
  };

  const getLogSeverityIcon = (severity: LogSeverity) => {
    switch (severity) {
      case LogSeverity.HIGH:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case LogSeverity.MEDIUM:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case LogSeverity.LOW:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Platform istatistiklerini ve son aktiviteleri görüntüleyin
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kuyrukta</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQueued}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yayınlanan</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPublished}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Başarısız</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFailed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Son Hatalar</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentErrors}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Tabs defaultValue="contents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contents">Son İçerikler</TabsTrigger>
          <TabsTrigger value="logs">Son Aktiviteler</TabsTrigger>
        </TabsList>
        <TabsContent value="contents" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profil</TableHead>
                  <TableHead>İçerik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentContents.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            <User2 className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">{content.profileId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate">
                        {content.content}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(content.status)}</TableCell>
                    <TableCell>
                      {content.createdAt && formatDate(content.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="logs" className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seviye</TableHead>
                  <TableHead>Mesaj</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Tarih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getLogSeverityIcon(log.severity)}
                        <span className="text-sm">{log.severity}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate">
                        {log.message}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(log.createdAt, "dd MMM yyyy HH:mm", { locale: tr })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 