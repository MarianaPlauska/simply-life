/** Converte url do payload web (`/kanban?foco=1`) em rota Expo Router. */
export function mapPushUrlToRoute(url: string): string | null
{
  try
  {
    const raw = url.trim()
    if (!raw) return null
    const path = raw.startsWith('http')
      ? `${new URL(raw).pathname}${new URL(raw).search}`
      : raw.startsWith('/')
        ? raw
        : `/${raw}`
    const pathname = path.split('?')[0] || '/'

    if (pathname.startsWith('/kanban') || pathname.startsWith('/axel'))
    {
      return '/(tabs)/kanban'
    }
    if (pathname.startsWith('/saude') || pathname.startsWith('/health'))
    {
      return '/(tabs)/saude'
    }
    if (pathname.startsWith('/financeiro') || pathname.startsWith('/finance'))
    {
      return '/(tabs)/financeiro'
    }
    if (pathname.startsWith('/task/'))
    {
      const id = pathname.split('/task/')[1]
      return id ? `/task/${id}` : null
    }
    if (pathname === '/' || pathname.startsWith('/dashboard'))
    {
      return '/(tabs)'
    }
    return '/(tabs)'
  }
  catch
  {
    return null
  }
}
