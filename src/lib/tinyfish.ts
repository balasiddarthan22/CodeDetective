const SEARCH_URL = "https://api.search.tinyfish.ai";
const FETCH_URL = "https://api.fetch.tinyfish.ai";
const MAX_SEARCH_CONTEXT = 1500;
const MAX_FETCH_CONTEXT = 5000;

function headers() {
  return { "X-API-Key": process.env.TINYFISH_API_KEY ?? "" };
}

export interface SearchResult {
  position: number;
  site_name: string;
  title: string;
  snippet: string;
  url: string;
}

export interface FetchedPage {
  url: string;
  content: string;
}

export async function tinyfishSearch(query: string): Promise<SearchResult[]> {
  const url = `${SEARCH_URL}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`TinyFish search failed: ${res.status}`);
  const data = await res.json();
  const results: SearchResult[] = data.results ?? [];
  return results.map((r) => ({
    ...r,
    snippet: r.snippet.slice(0, MAX_SEARCH_CONTEXT),
  }));
}

export async function tinyfishFetch(urls: string[]): Promise<FetchedPage[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(FETCH_URL, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ urls, format: "markdown", ttl: 0 }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`TinyFish fetch failed: ${res.status}`);
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pages: any[] = Array.isArray(data) ? data : data.results ?? [];
    return pages.map((p) => ({
      url: (p.url ?? p.final_url ?? "") as string,
      content: ((p.text ?? p.content ?? "") as string).slice(0, MAX_FETCH_CONTEXT),
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`tinyfishFetch error: ${msg}`);
    return urls.map((u) => ({ url: u, content: "" }));
  } finally {
    clearTimeout(timeout);
  }
}

export function formatSearchResults(results: SearchResult[]): string {
  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`
    )
    .join("\n\n");
}
