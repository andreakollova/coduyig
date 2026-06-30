import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import type { RenderResult } from './render';

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = 'ig-media';

export interface UploadedSlide {
  url: string;
  type: 'video' | 'image';
}

export async function uploadSlides(lessonId: number, result: RenderResult, lang: string): Promise<UploadedSlide[]> {
  const uploaded: UploadedSlide[] = [];
  const timestamp = Date.now();

  for (const file of result.files) {
    const ext = file.type === 'video' ? 'mp4' : 'png';
    const remotePath = `carousels/${lessonId}/${timestamp}/${lang}_slide${file.slideIndex}.${ext}`;

    const fileData = fs.readFileSync(file.path);

    // Retry up to 3 times
    let lastError = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await sb.storage
        .from(BUCKET)
        .upload(remotePath, fileData, {
          contentType: file.type === 'video' ? 'video/mp4' : 'image/png',
          upsert: true,
        });

      if (!error) { lastError = ''; break; }
      lastError = error.message;
      console.log(`  ⚠️ Upload attempt ${attempt + 1} failed: ${error.message}, retrying...`);
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }

    if (lastError) {
      console.error(`Upload failed for ${remotePath}: ${lastError}`);
      throw new Error(`Upload failed: ${lastError}`);
    }

    const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(remotePath);
    uploaded.push({ url: urlData.publicUrl, type: file.type });
    console.log(`📤 Uploaded: ${remotePath}`);
  }

  console.log(`✅ Uploaded ${uploaded.length} files for ${lang.toUpperCase()}`);
  return uploaded;
}
