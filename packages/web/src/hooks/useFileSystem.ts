import { useCallback } from 'react';
import { saveFile, openFile, type SaveFileOptions, type OpenFileOptions } from '../utils/fileSystem';

export function useFileSystem() {
  const save = useCallback(async (content: string | Blob | ArrayBuffer, options?: SaveFileOptions) => {
    await saveFile(content, options);
  }, []);

  const open = useCallback(async (options?: OpenFileOptions) => {
    return await openFile(options);
  }, []);

  const copy = useCallback(async (content: string | Blob, mimeType = 'text/plain') => {
    try {
      if (typeof content === 'string' && mimeType === 'text/plain') {
        await navigator.clipboard.writeText(content);
      } else {
        const blob = typeof content === 'string' 
          ? new Blob([content], { type: mimeType }) 
          : content;
          
        await navigator.clipboard.write([
          new ClipboardItem({ [mimeType]: blob })
        ]);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      throw err;
    }
  }, []);

  return { save, open, copy };
}