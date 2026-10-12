import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';

export interface ExtractResult {
  title: string;
  text: string;
  excerpt?: string;
}

export async function fetchAndExtract(url: string): Promise<ExtractResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('That does not look like a valid URL.');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only http(s) URLs are supported.');
  }

  let response: Response;
  try {
    response = await fetch(parsedUrl.toString(), {
      redirect: 'follow',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent':
          'DailyLearnerExtension/1.0 (+https://cursor.com; educational)',
      },
    });
  } catch {
    throw new Error(
      'Could not fetch that page. Check the URL or your network connection.',
    );
  }

  if (!response.ok) {
    throw new Error(
      `Page returned ${response.status}. It may be blocked or unavailable.`,
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (
    contentType &&
    !contentType.includes('html') &&
    !contentType.includes('text/plain') &&
    !contentType.includes('xml')
  ) {
    throw new Error('URL did not return an HTML page we can read.');
  }

  const html = await response.text();
  if (!html.trim()) {
    throw new Error('Page was empty.');
  }

  const { document } = parseHTML(html);
  // linkedom documents work with Readability when given a URL for absolute links
  try {
    Object.defineProperty(document, 'documentURI', {
      value: parsedUrl.toString(),
      configurable: true,
    });
  } catch {
    // ignore
  }

  const reader = new Readability(document as unknown as Document, {
    charThreshold: 200,
  });
  const article = reader.parse();

  const text = (article?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const title = (article?.title ?? document.title ?? '').trim();

  if (!text || text.length < 200) {
    throw new Error(
      'Could not extract readable article text. The page may be paywalled, heavily scripted, or not an article.',
    );
  }

  return {
    title,
    text,
    excerpt: article?.excerpt ?? undefined,
  };
}
