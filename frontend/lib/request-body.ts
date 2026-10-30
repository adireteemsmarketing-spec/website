export class RequestBodyError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

// Enforce the byte limit while reading, including bodies without Content-Length.
export async function readRequestBuffer(request: Request, maxBytes: number): Promise<ArrayBuffer> {
  const length = request.headers.get('content-length')
  if (length && /^\d+$/.test(length) && Number(length) > maxBytes) throw new RequestBodyError('Request body is too large.', 413)
  if (!request.body) return new ArrayBuffer(0)
  const reader = request.body.getReader(), chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) { await reader.cancel(); throw new RequestBodyError('Request body is too large.', 413) }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return bytes.buffer
}

export async function readRequestText(request: Request, maxBytes: number) {
  const bytes = await readRequestBuffer(request, maxBytes)
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes) }
  catch { throw new RequestBodyError('Invalid request encoding.', 400) }
}

export async function readJsonBody(request: Request, maxBytes = 20000) {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new RequestBodyError('Expected JSON.', 415)
  const raw = await readRequestText(request, maxBytes)
  try {
    const body = JSON.parse(raw)
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw Error('Expected an object')
    return body
  } catch { throw new RequestBodyError('Invalid JSON request.', 400) }
}

export async function readFormBody(request: Request, maxBytes: number) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data;')) throw new RequestBodyError('Expected an image upload.', 415)
  const bytes = await readRequestBuffer(request, maxBytes)
  try { return await new Request(request.url, { method: 'POST', headers: request.headers, body: bytes }).formData() }
  catch { throw new RequestBodyError('Invalid upload form.', 400) }
}

export function requestBodyError(error: unknown) {
  return error instanceof RequestBodyError ? Response.json({ error: error.message }, { status: error.status }) : undefined
}
