// Live context helpers — web search, weather, IP geolocation.
// All APIs are free and require no keys.

export interface GeoResult {
  lat: number
  lon: number
  city: string
  region: string
  country: string
}

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'clear sky', 1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
  45: 'foggy', 48: 'icy fog',
  51: 'light drizzle', 53: 'moderate drizzle', 55: 'heavy drizzle',
  61: 'light rain', 63: 'moderate rain', 65: 'heavy rain',
  71: 'light snow', 73: 'moderate snow', 75: 'heavy snow', 77: 'snow grains',
  80: 'rain showers', 81: 'moderate showers', 82: 'violent showers',
  85: 'snow showers', 86: 'heavy snow showers',
  95: 'thunderstorm', 96: 'thunderstorm with hail', 99: 'severe thunderstorm',
}

function wmoDesc(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? 'unknown conditions'
}

// ip-api.com free tier (HTTP is fine from Edge Functions)
export async function geolocateIp(ip: string): Promise<GeoResult | null> {
  if (!ip || ip === '127.0.0.1' || ip.startsWith('::')) return null
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,lat,lon,city,regionName,country`,
      { signal: AbortSignal.timeout(3000) },
    )
    if (!res.ok) return null
    const d = await res.json()
    if (d.status !== 'success') return null
    return {
      lat: Number(d.lat),
      lon: Number(d.lon),
      city: String(d.city ?? ''),
      region: String(d.regionName ?? ''),
      country: String(d.country ?? ''),
    }
  } catch {
    return null
  }
}

// OpenMeteo — completely free, no key
export async function fetchWeather(lat: number, lon: number): Promise<string> {
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', lat.toFixed(4))
    url.searchParams.set('longitude', lon.toFixed(4))
    url.searchParams.set(
      'current',
      'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation',
    )
    url.searchParams.set('timezone', 'auto')
    url.searchParams.set('forecast_days', '1')

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return ''
    const d = await res.json()
    const c = d.current
    const u = d.current_units
    const desc = wmoDesc(Number(c.weather_code))
    return (
      `${desc}, ${c.temperature_2m}${u.temperature_2m} ` +
      `(feels like ${c.apparent_temperature}${u.apparent_temperature}), ` +
      `humidity ${c.relative_humidity_2m}${u.relative_humidity_2m}, ` +
      `wind ${c.wind_speed_10m} ${u.wind_speed_10m}`
    )
  } catch {
    return ''
  }
}

// DuckDuckGo Instant Answer — free, no key, good for factual queries
export async function searchWeb(query: string): Promise<string> {
  try {
    const url =
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&t=pneuma&no_html=1&skip_disambig=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return ''
    const d = await res.json()

    const parts: string[] = []
    if (d.AbstractText) parts.push(d.AbstractText)
    if (d.Answer) parts.push(`Answer: ${d.Answer}`)
    if (d.Definition) parts.push(`Definition: ${d.Definition}`)
    const topics: Array<{ Text?: string }> = d.RelatedTopics ?? []
    for (const t of topics.slice(0, 3)) {
      if (t.Text) parts.push(t.Text)
    }

    return parts.join('\n').slice(0, 800)
  } catch {
    return ''
  }
}

// Detect what live context the user's message might need
export function detectNeeds(message: string): {
  needsWeather: boolean
  needsSearch: boolean
} {
  const lower = message.toLowerCase()
  const needsWeather =
    /\b(weather|temperature|temp|forecast|rain|snow|wind|sunny|cloudy|hot|cold|humidity|storm|degrees)\b/.test(
      lower,
    )
  const needsSearch =
    !needsWeather &&
    /\b(who is|what is|what are|where is|when did|how does|search|look up|look for|find out|news|latest|current events|tell me about)\b/.test(
      lower,
    )
  return { needsWeather, needsSearch }
}

// Build the live context string for injection into the system prompt.
// Runs weather and search concurrently when needed.
export async function buildLiveContext(message: string, ip: string): Promise<string> {
  const { needsWeather, needsSearch } = detectNeeds(message)
  if (!needsWeather && !needsSearch) return ''

  const parts: string[] = []

  // Weather requires geolocation first (sequential), but runs concurrently with search
  const weatherPromise = (async () => {
    if (!needsWeather) return
    const geo = await geolocateIp(ip)
    if (!geo) return
    if (geo.city) parts.push(`User's location: ${geo.city}, ${geo.region}, ${geo.country}`)
    const weather = await fetchWeather(geo.lat, geo.lon)
    if (weather) parts.push(`Current weather: ${weather}`)
  })()

  const searchPromise = (async () => {
    if (!needsSearch) return
    const result = await searchWeb(message)
    if (result) parts.push(`Web search results:\n${result}`)
  })()

  await Promise.all([weatherPromise, searchPromise])
  return parts.join('\n\n')
}
