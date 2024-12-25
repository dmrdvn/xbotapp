import { Content, ContentType, ContentStatus } from "@/types/Content";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface ActivityFeedProps {
  actions: Content[];
  className?: string;
}

export function ActivityFeed({ actions, className }: ActivityFeedProps) {
  const getStatusColor = (status: ContentStatus) => {
    switch (status) {
      case "published":
        return "bg-green-500/10 text-green-500";
      case "failed":
        return "bg-red-500/10 text-red-500";
      case "queued":
        return "bg-blue-500/10 text-blue-500";
      case "draft":
        return "bg-gray-500/10 text-gray-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getActionIcon = (type: ContentType | undefined) => {
    if (!type) return "📝";
    
    switch (type) {
      case ContentType.TWEET:
        return "🐦";
      case ContentType.REPLY:
        return "💬";
      case ContentType.RETWEET:
        return "🔄";
      case ContentType.QUOTE:
        return "💭";
      default:
        return "📝";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Son Aktiviteler</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {actions.map((action) => (
              <div
                key={action.id}
                className="flex items-start space-x-4 rounded-lg border p-4"
              >
                <div className="text-2xl">
                  {getActionIcon(action.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {action.type ? action.type.charAt(0) + action.type.slice(1).toLowerCase() : "Tweet"}
                    </p>
                    <Badge
                      variant="secondary"
                      className={getStatusColor(action.status)}
                    >
                      {action.status.charAt(0) + action.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                  {action.content && (
                    <p className="text-sm text-muted-foreground">
                      {action.content}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {action.publishedAt
                      ? formatDistanceToNow(action.publishedAt, {
                          addSuffix: true,
                          locale: tr
                        })
                      : action.scheduledFor
                      ? `${formatDistanceToNow(action.scheduledFor, {
                          addSuffix: true,
                          locale: tr
                        })} planlandı`
                      : "İşleniyor"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 