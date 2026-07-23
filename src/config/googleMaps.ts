import { type Libraries } from '@react-google-maps/api'
import { env } from '@/config/env'

// Single source of truth for the Google Maps JS API loader.
// Every component MUST use these exact values.
export const GOOGLE_MAPS_LIBRARIES: Libraries = ['places', 'maps']

export const GOOGLE_MAPS_LOADER_OPTIONS = {
    id: 'google-map-script',
    googleMapsApiKey: env.GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: 'en',
    region: 'US',
} as const

export const DEFAULT_MAP_CENTER = { lat: 24.713552, lng: 46.675297 }

export const MAP_CONTAINER_STYLE: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '0.75rem',
}

export const DEFAULT_MAP_OPTIONS: google.maps.MapOptions = {
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
}