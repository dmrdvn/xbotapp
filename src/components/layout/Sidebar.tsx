"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Profile } from "@/types/profile";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BsRobot, BsGear, BsClockHistory, BsFileText } from "react-icons/bs";

interface SidebarProps {
  profiles: Profile[];
  className?: string;
}

export function Sidebar({ profiles, className }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      href: "/dashboard",
      icon: BsRobot,
      label: "Genel Bakış"
    },
    {
      href: "/content",
      icon: BsFileText,
      label: "İçerik"
    },
    {
      href: "/settings",
      icon: BsGear,
      label: "Ayarlar"
    },
    {
      href: "/logs",
      icon: BsClockHistory,
      label: "Aktivite Logları"
    }
  ];

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Dashboard</h2>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Profiller</h2>
          <ScrollArea className="h-[300px] px-1">
            <div className="space-y-1">
              {profiles?.map((profile) => (
                <Button
                  key={profile.id}
                  variant={pathname === `/profiles/${profile.id}` ? "secondary" : "ghost"}
                  className="w-full justify-start font-normal"
                  asChild
                >
                  <Link href={`/profiles/${profile.id}`}>
                    <span className="truncate">{profile.name} {profile.surname}</span>
                  </Link>
                </Button>
              ))}
              <Button
                key="new-profile"
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/profiles/new">
                  <span>+ Yeni Profil Ekle</span>
                </Link>
              </Button>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
} 