import { FileManager } from '@/components/custom/file-manager';
import { constructMetadata } from '@/lib/utils';

export const metadata = constructMetadata({
  title: 'your files',
  description: 'access your files uploaded to Arenas here.',
  canonical: '/files',
});


export default function FilesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Your Files</h1>
      <FileManager />
    </div>
  );
} 