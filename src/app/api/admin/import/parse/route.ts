import { parseSmartImport, SmartImportError } from "@/lib/import/ai-parse";
import { loadImportCatalog } from "@/lib/import/catalog";
import { normalizeImportDraft } from "@/lib/import/normalize";
import { validateImportDraft } from "@/lib/import/validate";

export const runtime = "nodejs";
const MAX_REQUEST_BYTES = 64 * 1024;
const headers = { "Cache-Control": "no-store" };

async function readLimitedJson(request: Request): Promise<unknown> {
  const announced = Number(request.headers.get("content-length"));
  if (announced > MAX_REQUEST_BYTES)
    throw new SmartImportError("input-too-large", "Request body is too large.", 413);
  if (!request.body) throw new SmartImportError("invalid-request", "Request body is required.", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_REQUEST_BYTES) {
      await reader.cancel();
      throw new SmartImportError("input-too-large", "Request body is too large.", 413);
    }
    chunks.push(value);
  }
  const buffer = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(buffer)); }
  catch { throw new SmartImportError("invalid-request", "Request body must be valid JSON.", 400); }
}

export async function POST(request: Request) {
  try {
    const body = await readLimitedJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new SmartImportError("invalid-request", "Invalid Smart Import request.", 400);
    const { rawText, universeId, continuityId } = body as Record<string, unknown>;
    if (typeof rawText !== "string" || typeof universeId !== "string" || typeof continuityId !== "string")
      throw new SmartImportError("invalid-request", "Text, universe, and continuity are required.", 400);
    const catalog = await loadImportCatalog();
    const parsed = await parseSmartImport({ rawText, universeId, continuityId, catalog });
    const draft = validateImportDraft(normalizeImportDraft(parsed, catalog), catalog);
    return Response.json({ draft }, { headers });
  } catch (error) {
    const known = error instanceof SmartImportError ? error
      : new SmartImportError("import-error", "Smart Import could not complete the preview.", 500);
    return Response.json({ error: { code: known.code, message: known.message } },
      { status: known.status, headers });
  }
}
