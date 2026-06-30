import type { UploadedSlide } from './upload';

const API = 'https://graph.facebook.com/v25.0';

interface IGResponse {
  id?: string;
  error?: { message: string; type: string; code: number };
}

interface StatusResponse {
  status_code?: string;
  id?: string;
  error?: { message: string };
}

async function igPost(url: string, params: Record<string, string>): Promise<IGResponse> {
  const body = new URLSearchParams(params);
  const res = await fetch(url, { method: 'POST', body });
  const data: IGResponse = await res.json();
  if (data.error) throw new Error(`IG API: ${data.error.message}`);
  return data;
}

async function igGet(url: string): Promise<StatusResponse> {
  const res = await fetch(url);
  return res.json();
}

async function waitForContainer(containerId: string, token: string, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await igGet(`${API}/${containerId}?fields=status_code&access_token=${token}`);
    if (status.status_code === 'FINISHED') return;
    if (status.status_code === 'EXPIRED' || status.status_code === 'ERROR') {
      throw new Error(`Container ${containerId} status: ${status.status_code}`);
    }
    console.log(`  ⏳ Container ${containerId}: ${status.status_code || 'processing'} (attempt ${i + 1})`);
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error(`Container ${containerId} timed out after ${maxAttempts} attempts`);
}

export async function publishCarousel(
  slides: UploadedSlide[],
  caption: string,
  igUserId: string,
  token: string,
  dryRun = false
): Promise<string> {
  console.log(`\n📱 Publishing carousel to IG user ${igUserId} (${slides.length} slides)...`);

  // Check rate limit
  const limitRes = await igGet(`${API}/${igUserId}/content_publishing_limit?fields=quota_usage,config&access_token=${token}`);
  console.log(`  Rate limit:`, JSON.stringify(limitRes));

  // Step 1: Create child containers
  const childIds: string[] = [];
  for (const slide of slides) {
    const params: Record<string, string> = {
      is_carousel_item: 'true',
      access_token: token,
    };

    if (slide.type === 'video') {
      params.video_url = slide.url;
      params.media_type = 'VIDEO';
    } else {
      params.image_url = slide.url;
    }

    const child = await igPost(`${API}/${igUserId}/media`, params);
    if (!child.id) throw new Error('No container ID returned for child');
    childIds.push(child.id);
    console.log(`  📎 Child container: ${child.id} (${slide.type})`);
  }

  // Step 2: Wait for video children
  for (let i = 0; i < slides.length; i++) {
    if (slides[i].type === 'video') {
      console.log(`  ⏳ Waiting for video container ${childIds[i]}...`);
      await waitForContainer(childIds[i], token);
      console.log(`  ✅ Video container ready`);
    }
  }

  // Step 3: Create parent carousel container
  const parentRes = await igPost(`${API}/${igUserId}/media`, {
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption,
    access_token: token,
  });
  if (!parentRes.id) throw new Error('No parent container ID returned');
  console.log(`  📦 Parent container: ${parentRes.id}`);

  // Wait for parent
  await waitForContainer(parentRes.id, token);

  if (dryRun) {
    console.log(`  🏁 DRY RUN — skipping media_publish. Parent ID: ${parentRes.id}`);
    return `dry-run-${parentRes.id}`;
  }

  // Step 4: Publish
  const publishRes = await igPost(`${API}/${igUserId}/media_publish`, {
    creation_id: parentRes.id,
    access_token: token,
  });
  if (!publishRes.id) throw new Error('No published media ID returned');
  console.log(`  🎉 Published! Media ID: ${publishRes.id}`);
  return publishRes.id;
}
