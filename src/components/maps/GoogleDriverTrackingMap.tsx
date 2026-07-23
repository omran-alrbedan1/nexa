import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GoogleMap, Marker, InfoWindow, useJsApiLoader, type Libraries } from '@react-google-maps/api'
import { useDriverLocation, type DriverLocation } from '@/hooks/useDriverLocation'
import { env } from '@/config/env'
import { Navigation } from 'lucide-react'

const libraries: Libraries = ['places']

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem',
}

const defaultCenter = { lat: 24.713552, lng: 46.675297 }

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
    if (mapRef.current) {
      if (follow) {
        mapRef.current.panTo(position)
      }
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
      />
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
      {showInfo && (
        <InfoWindow
          position={position}
          onCloseClick={() => setShowInfo(false)}
        >
          <div className="text-xs">
            <p>{t('orders.tracking.speed')}: {location.speed ? `${location.speed} ${t('orders.tracking.kmh')}` : t('orders.tracking.notAvailable')}</p>
            <p className="text-text-secondary mt-1">
              {new Date(location.recordedAt).toLocaleTimeString()}
            </p>
          </div>
        </InfoWindow>
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

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: env.GOOGLE_MAPS_API_KEY,
    libraries,
  })

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
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
        onLoad={(map) => {
          const mapRef = map
          setTimeout(() => mapRef.setCenter(center), 0)
        }}
      >
        <MapContent location={location} destination={destination} follow={follow} />
      </GoogleMap>
    </div>
  )
}
