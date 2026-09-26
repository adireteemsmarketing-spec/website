export function mediaUrl(path:string) {
  if(!path || path.startsWith('/') || /^https:\/\//.test(path)) return path
  return '/api/media?path='+encodeURIComponent(path.includes('/')?path:'product-images/'+path)
}
export function storagePath(value:string) {
  if(value.startsWith('/api/media?')) {
    const path=new URL(value,'http://localhost').searchParams.get('path')
    if(!path || !/^(draft-media|product-images|journal-images)\/[a-zA-Z0-9/_.-]+$/.test(path) || path.includes('..'))throw new Error('Invalid image path.')
    return path
  }
  return value
}

