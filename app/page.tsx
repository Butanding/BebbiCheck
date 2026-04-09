"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"

type MetricData = {
  id: string
  title: string
  subtitle?: string
  value: number
  valueLabel?: string
  unit: string
  lastUpdate: string | null
  details?: {
    maxRainLast72h: number
    maxRainLast48h: number
    globalRadiationLast72h: number
    globalRadiationLast48h: number
    dailyRainThreshold: number
    dailyRadiationThreshold: number
  }
}

type DataPayload = {
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

const initialMetrics: MetricData[] = []

function formatLastUpdate(dateString: string | null): string {
  if (!dateString) return "Aktualisierung unbekannt"

  try {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const updateDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    const isToday = updateDate.getTime() === today.getTime()
    const timeString = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

    return isToday ? `Heute, ${timeString}` : date.toLocaleDateString('de-DE')
  } catch {
    return "Aktualisierung unbekannt"
  }
}

export default function Home() {
  const [metrics, setMetrics] = useState<MetricData[]>(initialMetrics)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/data")
        if (!response.ok) {
          throw new Error("Daten konnten nicht geladen werden")
        }
        const payload: DataPayload = await response.json()

        setMetrics([
          {
            id: "water-quality",
            title: "Wasserqualität",
            subtitle: "Prognose",
            value: payload.quality.quality,
            valueLabel: payload.quality.qualityLabel,
            unit: "",
            lastUpdate: payload.quality.lastUpdate,
            details: payload.quality.details
          },
          {
            id: "air-temp",
            title: "Lufttemperatur",
            value: payload.airTemp.actualValue,
            unit: "°C",
            lastUpdate: payload.airTemp.lastUpdate
          },
          {
            id: "water-temp",
            title: "Wassertemperatur",
            value: payload.waterTemp.actualValue,
            unit: "°C",
            lastUpdate: payload.waterTemp.lastUpdate
          },
          {
            id: "water-level",
            title: "Pegelstand",
            value: payload.waterLevel.actualValue / 100, // Convert cm to meters
            unit: "m",
            lastUpdate: payload.waterLevel.lastUpdate
          }
        ])
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Fehler beim Laden")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 text-slate-950">
      <header className="bg-gradient-to-b from-blue-800 to-blue-900 text-white py-12 text-center shadow-lg">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-red-600 rounded-full mr-3 flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <h1 className="text-4xl font-bold sm:text-5xl">BebbiCheck</h1>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-blue-100 sm:text-base mx-auto font-medium">
            Live-Dashboard basierend auf Opendata von data.bs.ch.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {isLoading ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-slate-600">Daten werden geladen…</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm"
                title={metric.details ? `Regen 72h: ${metric.details.maxRainLast72h.toFixed(1)}mm, Strahlung 72h: ${metric.details.globalRadiationLast72h.toFixed(0)}W/m²` : undefined}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-800">{metric.title}</h2>
                  {metric.subtitle && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                      {metric.subtitle}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-4xl font-bold text-sky-600">
                  {metric.id === "water-quality" ? (
                    <span className={`${
                      metric.value === 3 ? "text-green-600" :
                      metric.value === 2 ? "text-yellow-600" :
                      "text-red-600"
                    }`}>
                      {metric.valueLabel}
                    </span>
                  ) : (
                    <>
                      {metric.value.toFixed(metric.unit === "m" ? 2 : 1)} <span className="text-xl">{metric.unit}</span>
                    </>
                  )}
                </p>
                {metric.id === "water-quality" && metric.details && (
                  <p className="mt-1 text-sm text-slate-600">
                    Regen 72h: {metric.details.maxRainLast72h.toFixed(1)} mm
                  </p>
                )}
                <p className="mt-2 text-sm text-slate-500">
                  {formatLastUpdate(metric.lastUpdate)}
                </p>
                {metric.id === "water-quality" && metric.details && (
                  <p className="mt-2 text-xs text-slate-400">
                    Basierend auf Regen und Sonneneinstrahlung der letzten Tage
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
