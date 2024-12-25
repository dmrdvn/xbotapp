"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

function ErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "Bir hata oluştu";

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">Hata</CardTitle>
        <CardDescription>
          {message}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button asChild>
          <Link href="/profiles">Profillere Dön</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <Suspense fallback={<div>Yükleniyor...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  );
} 