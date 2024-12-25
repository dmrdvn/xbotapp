import { db } from "./config";
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp, QueryConstraint } from "firebase/firestore";
import { Log, LogType, LogSeverity } from "@/types/log";

// Log oluştur
export async function createLog(log: Omit<Log, "id" | "createdAt" | "updatedAt">) {
  try {
    const logsRef = collection(db, "logs");
    const now = Timestamp.now();
    
    const docRef = await addDoc(logsRef, {
      ...log,
      createdAt: now,
      updatedAt: now
    });

    return {
      success: true,
      data: {
        id: docRef.id,
        ...log,
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      }
    };
  } catch (error) {
    console.error("Log oluşturulurken hata:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    };
  }
}

export interface GetUserLogsOptions {
  type?: LogType[];
  severity?: LogSeverity[];
  startDate?: Date;
  endDate?: Date;
  maxResults?: number;
  page?: number;
}

// Kullanıcının loglarını getir
export async function getUserLogs(userId: string, options: GetUserLogsOptions = {}) {
  try {
    const logsRef = collection(db, "logs");
    const constraints: QueryConstraint[] = [
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    ];

    if (options.type?.length) {
      constraints.push(where("type", "in", options.type));
    }

    if (options.severity?.length) {
      constraints.push(where("severity", "in", options.severity));
    }

    if (options.startDate) {
      constraints.push(where("createdAt", ">=", Timestamp.fromDate(options.startDate)));
    }

    if (options.endDate) {
      constraints.push(where("createdAt", "<=", Timestamp.fromDate(options.endDate)));
    }

    if (options.maxResults) {
      constraints.push(limit(options.maxResults));
    }

    const q = query(logsRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const logs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as Log;
    });

    return {
      success: true,
      data: logs,
    };
  } catch (error) {
    console.error('Logları getirme hatası:', error);
    return {
      success: false,
      error: 'Loglar getirilirken bir hata oluştu',
    };
  }
}

// Log istatistiklerini getir
export async function getLogStats(userId: string, options?: {
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const logs = await getUserLogs(userId, {
      startDate: options?.startDate,
      endDate: options?.endDate
    });

    // Varsayılan boş istatistikler
    const defaultStats = {
      totalLogs: 0,
      byType: Object.values(LogType).reduce((acc, type) => ({ ...acc, [type]: 0 }), {} as Record<LogType, number>),
      bySeverity: Object.values(LogSeverity).reduce((acc, severity) => ({ ...acc, [severity]: 0 }), {} as Record<LogSeverity, number>)
    };

    if (!logs.success || !logs.data) {
      return {
        success: true,
        data: defaultStats
      };
    }

    const stats = {
      totalLogs: logs.data.length,
      byType: { ...defaultStats.byType },
      bySeverity: { ...defaultStats.bySeverity },
      lastError: undefined as { message: string; createdAt: Date; } | undefined
    };

    // İstatistikleri hesapla
    logs.data.forEach((log) => {
      // Tipe göre sayı
      if (!stats.byType[log.type]) {
        stats.byType[log.type] = 0;
      }
      stats.byType[log.type]++;

      // Önem derecesine göre sayı
      if (!stats.bySeverity[log.severity]) {
        stats.bySeverity[log.severity] = 0;
      }
      stats.bySeverity[log.severity]++;

      // Son hatayı bul
      if (log.type === LogType.ERROR && log.createdAt && (!stats.lastError || log.createdAt > stats.lastError.createdAt)) {
        stats.lastError = {
          message: log.message,
          createdAt: log.createdAt
        };
      }
    });

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error("Log istatistikleri hesaplanırken hata:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    };
  }
} 