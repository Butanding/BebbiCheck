# BebbiCheck

Ein Next.js + Tailwind CSS Dashboard für Rhein-Daten in Basel.

Mehr als nur nass: Dein Dashboard für Temperatur, Pegelstand und Wasserqualität im Basler Stadtstrom.

## Features

- **Live-Daten**: Aktuelle Wassertemperatur, Lufttemperatur und Pegelstand
- **Intelligente Wasserqualitätsbewertung**: Berechnung der Schwimmwasserqualität basierend auf Regen und Sonneneinstrahlung der letzten Tage
  - **Perfekt**: Wenig Regen (< 2mm) und viel Sonne (> 510 W/m²) in den letzten 72 Stunden
  - **Gut**: Wenig Regen (< 2mm) und moderate Sonne (> 340 W/m²) in den letzten 48 Stunden
  - **Schlecht**: Bei stärkerem Regen oder geringerer Sonneneinstrahlung

## Datenquellen

- Wassertemperatur: [Dataset 100046](https://data.bs.ch/api/v2/catalog/datasets/100046)
- Lufttemperatur: [Dataset 100009](https://data.bs.ch/api/v2/catalog/datasets/100009)
- Pegelstand: [Dataset 100089](https://data.bs.ch/api/v2/catalog/datasets/100089)
- Globale Strahlung: [Dataset 100254](https://data.bs.ch/api/v2/catalog/datasets/100254)
- Regen: [Dataset 100009](https://data.bs.ch/api/v2/catalog/datasets/100009)

## Technologie

- **Framework**: Next.js 16
- **Styling**: Tailwind CSS
- **Caching**: 5-Minuten In-Memory Cache für API-Requests
