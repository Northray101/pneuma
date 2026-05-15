export interface PneumaClientOptions {
  baseUrl: string
  getToken: () => Promise<string>
}

export class PneumaClient {
  private baseUrl: string
  private getToken: () => Promise<string>

  constructor(options: PneumaClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.getToken = options.getToken
  }

  async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    const token = await this.getToken()
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    })
    if (!res.ok && !init.method?.includes('stream')) {
      const body = await res.text()
      throw new Error(`Pneuma API error ${res.status}: ${body}`)
    }
    return res
  }
}
