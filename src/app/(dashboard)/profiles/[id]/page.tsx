import { ProfileEditor } from '@/components/profiles/ProfileEditor';
import { Suspense } from 'react';

interface EditProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProfilePage({ params }: EditProfilePageProps) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto py-10">
      <Suspense fallback={<div>Yükleniyor...</div>}>
        <ProfileEditor profileId={id} />
      </Suspense>
    </div>
  );
}
