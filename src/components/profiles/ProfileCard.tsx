import { Profile } from '@/types/profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Twitter } from 'lucide-react';

interface ProfileCardProps {
  profile: Profile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile.avatar} alt={profile.name} />
          <AvatarFallback>{profile.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <CardTitle className="text-2xl">{profile.name}</CardTitle>
          <CardDescription>{profile.email}</CardDescription>
          {profile.twitterConnected && (
            <div className="mt-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Twitter className="h-3 w-3" />
                <span>Bağlı</span>
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      {profile.bio && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{profile.bio}</p>
        </CardContent>
      )}
    </Card>
  );
} 