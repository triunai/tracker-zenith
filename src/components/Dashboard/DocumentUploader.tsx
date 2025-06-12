import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/lib/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase/supabase';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { FilePlus2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DocumentUploader = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user) {
        toast.error('You must be logged in to upload documents.');
        return;
      }
      if (acceptedFiles.length === 0) {
        return;
      }

      const file = acceptedFiles[0];
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${user.id}/${fileName}`;

      setUploading(true);

      const { error } = await supabase.storage
        .from('document-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      setUploading(false);

      if (error) {
        toast.error('Error uploading file.', { description: error.message });
      } else {
        toast.success('File uploaded successfully!', {
          description: 'We are now processing your document.',
        });
      }
    },
    [user]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative group w-48 h-48 rounded-2xl flex flex-col items-center justify-center',
        'border-2 border-dashed border-border',
        'bg-card/50 dark:bg-slate-800/20 backdrop-blur-sm',
        'cursor-pointer transition-all duration-300 ease-in-out',
        'hover:border-primary',
        isDragActive && 'border-primary'
      )}
    >
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-75 transition-opacity duration-300 blur"></div>
      <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-4">
        <input {...getInputProps()} />
        {uploading ? (
          <>
            <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
            <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <FilePlus2 className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors" />
            <p className="mt-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Drop Document
            </p>
            <p className="text-xs text-muted-foreground/80">(or click)</p>
          </>
        )}
      </div>
    </div>
  );
}; 