import { NextResponse } from "next/server"

interface DataPayload {
  waterTemp: {
    actualValue: number
    lastUpdate: string | null
  }
  airTemp: {
    actualValue: number
    lastUpdate: string | null
  }
  waterLevel: {
    actualValue: number
    lastUpdate: string | null
  }
  quality: {
    quality: number
    qualityLabel: string
    lastUpdate: string | null
    details: {
      maxRainLast72h: number
      maxRainLast48h: number
      globalRadiationLast72h: number
      globalRadiationLast48h: number
      dailyRainThreshold: number
      dailyRadiationThreshold: number
    }
  }
}

const CACHE_TTL_SECONDS = 300
let cachedData: DataPayload | null = null
let cacheExpiresAt = 0

async function fetchJson(url: string, timeout = 10000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }
    return response.json()
  } finally {
    clearTimeout(id)
  }
}

async function fetchSafe(url: string) {
  try {
    return await fetchJson(url)
  } catch (error) {
    console.error("API fetch failed", url, error)
    return null
  }
}

function getSafeValue(record: any, fieldName: string) {
  const value = record?.record?.fields?.[fieldName]
  return value === undefined || value === null ? null : value
}

function chooseLatestValue(records: any[], fieldName: string, updateField = "startzeitpunkt") {
  for (const item of records ?? []) {
    const value = getSafeValue(item, fieldName)
    if (value !== null) {
      return {
        actualValue: value,
        lastUpdate: item?.record?.fields?.[updateField] ?? null
      }
    }
  }
  return { actualValue: 0, lastUpdate: null }
}

export async function GET() {
  if (Date.now() < cacheExpiresAt && cachedData) {
    return NextResponse.json(cachedData)
  }

  const urls = {
    waterActual:
      "https://data.bs.ch/api/v2/catalog/datasets/100046/records?order_by=startzeitpunkt%20DESC&limit=2&pretty=false&timezone=UTC",
    airActual:
      "https://data.bs.ch/api/v2/catalog/datasets/100009/records?select=dates_max_date%20as%20date%2C%20meta_airtemp%20as%20temp&where=name_original=%22034003A7%22&limit=2&pretty=false&timezone=UTC&order_by=dates_max_date%20DESC",
    levelActual:
      "https://data.bs.ch/api/v2/catalog/datasets/100089/records?select=pegel&limit=1&pretty=false&timezone=UTC&order_by=timestamp%20DESC",
    radiationWeek:
      "https://data.bs.ch/api/v2/catalog/datasets/100254/records?select=gre000d0%20as%20globalRadiation&limit=7&pretty=false&timezone=UTC&order_by=date%20DESC",
    rainWeek:
      "https://data.bs.ch/api/v2/catalog/datasets/100009/records?select=max(meta_rain24h_sum)%20as%20rain&where=name_original=%22034001AF%22&limit=7&pretty=false&timezone=UTC&order_by=date%20DESC&group_by=date_format(dates_max_date,%20'yyyyMMdd')%20as%20date"
  }

  const responses = await Promise.all(
    Object.entries(urls).map(async ([key, url]) => ({
      key,
      data: await fetchSafe(url)
    }))
  )

  const results = Object.fromEntries(responses.map((item) => [item.key, item.data])) as Record<string, any>
  const allFailed = Object.values(results).every((value) => value === null)

  if (allFailed) {
    return NextResponse.json({ error: "Unable to fetch data from remote APIs" }, { status: 500 })
  }

  const waterTemp = chooseLatestValue(results.waterActual?.records ?? [], "rus_w_o_s3_te", "startzeitpunkt")
  const airTemp = chooseLatestValue(results.airActual?.records ?? [], "temp", "date")
  const waterLevel = chooseLatestValue(results.levelActual?.records ?? [], "pegel", "timestamp")

  // Calculate quality from radiation and rain data
  const radiationSeries = (results.radiationWeek?.records ?? []).map((item: any) => getSafeValue(item, "globalRadiation")).filter((v: any) => v !== null)
  const rainSeries = (results.rainWeek?.records ?? []).map((item: any) => getSafeValue(item, "rain")).filter((v: any) => v !== null)

  const maxRainLast72h = Math.max(...rainSeries.slice(0, 3), 0)
  const maxRainLast48h = Math.max(...rainSeries.slice(0, 2), 0)
  const globalRadiationLast72h = radiationSeries.slice(0, 3).reduce((sum: number, value: number) => sum + value, 0)
  const globalRadiationLast48h = radiationSeries.slice(0, 2).reduce((sum: number, value: number) => sum + value, 0)

  const dailyRainThreshold = 2 // mm
  const dailyRadiationThreshold = 170 // W/m2

  let qualityValue = 1
  let qualityLabel = "Schlecht"

  if (maxRainLast72h < dailyRainThreshold && globalRadiationLast72h > (dailyRadiationThreshold * 3)) {
    qualityValue = 3
    qualityLabel = "Perfekt"
  } else if (maxRainLast48h < dailyRainThreshold && globalRadiationLast48h > (dailyRadiationThreshold * 2)) {
    qualityValue = 2
    qualityLabel = "Gut"
  }

  const quality = {
    quality: qualityValue,
    qualityLabel,
    lastUpdate: results.radiationWeek?.records?.[0]?.record?.timestamp ?? null,
    details: {
      maxRainLast72h,
      maxRainLast48h,
      globalRadiationLast72h,
      globalRadiationLast48h,
      dailyRainThreshold,
      dailyRadiationThreshold
    }
  }

  const payload: DataPayload = {
    waterTemp,
    airTemp,
    waterLevel,
    quality
  }

  cachedData = payload
  cacheExpiresAt = Date.now() + CACHE_TTL_SECONDS * 1000

  return NextResponse.json(payload)
}
