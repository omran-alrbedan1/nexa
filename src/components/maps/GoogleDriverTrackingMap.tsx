import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api'
import { useDriverLocation, type DriverLocation } from '@/hooks/useDriverLocation'
import {
  GOOGLE_MAPS_LOADER_OPTIONS,
  MAP_CONTAINER_STYLE,
  DEFAULT_MAP_OPTIONS,
} from '@/config/googleMaps'
import { Navigation } from 'lucide-react'

interface GoogleDriverTrackingMapProps {
  orderId: number
  initialLocation?: DriverLocation | null
  destination?: { lat: number; lng: number } | null
  height?: string
  follow?: boolean
}

function MapContent({ location, destination, follow }: {
  location: DriverLocation
  destination?: { lat: number; lng: number } | null
  follow?: boolean
}) {
  const { t } = useTranslation()
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const [showInfo, setShowInfo] = useState(false)

  const position = { lat: location.latitude, lng: location.longitude }

  useEffect(() => {
    if (mapRef.current && follow) {
      mapRef.current.panTo(position)
    }
  }, [position.lat, position.lng, follow])

  return (
    <>
      <Marker
        position={position}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#2563EB',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        }}
        onLoad={(marker) => { markerRef.current = marker }}
        onClick={() => setShowInfo(true)}
      >
        {showInfo && (
          <InfoWindow onCloseClick={() => setShowInfo(false)}>
            <div className="text-xs">
              <p>{t('orders.tracking.speed')}: {location.speed ? `${location.speed} ${t('orders.tracking.kmh')}` : t('orders.tracking.notAvailable')}</p>
              <p className="text-text-secondary mt-1">
                {new Date(location.recordedAt).toLocaleTimeString()}
              </p>
            </div>
          </InfoWindow>
        )}
      </Marker>
      {destination && (
        <Marker
          position={destination}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#DC2626',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          }}
        />
      )}
    </>
  )
}

export default function GoogleDriverTrackingMap({
  orderId,
  initialLocation,
  destination,
  height = '256px',
  follow = true,
}: GoogleDriverTrackingMapProps) {
  const { t } = useTranslation()

  // Uses the shared loader options -- identical across the entire app
  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_LOADER_OPTIONS)

  const location = useDriverLocation(orderId, initialLocation)

  if (loadError) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-red-500">{t('orders.tracking.mapLoadError')}</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="flex items-center gap-2 text-text-tertiary">
          <Navigation size={16} className="animate-pulse" />
          <span className="text-sm">{t('orders.tracking.loadingMap')}</span>
        </div>
      </div>
    )
  }

  if (!location) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-xl" style={{ height }}>
        <p className="text-sm text-text-secondary">{t('orders.tracking.awaitingLocation')}</p>
      </div>
    )
  }

  const center = { lat: location.latitude, lng: location.longitude }

  return (
    <div style={{ height }}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={15}
        options={DEFAULT_MAP_OPTIONS}
        onLoad={(map) => {
          setTimeout(() => map.setCenter(center), 0)
        }}
      >
        <MapContent location={location} destination={destination} follow={follow} />
      </GoogleMap>
    </div>
  )
}