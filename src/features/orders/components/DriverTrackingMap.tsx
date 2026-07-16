import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Icon, type LatLngExpression, type Marker as LeafletMarker } from 'leaflet'
import { useDriverLocation, type DriverLocation } from '@/hooks/useDriverLocation'
import 'leaflet/dist/leaflet.css'

const driverIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
})

function LiveMarker({ location }: { location: DriverLocation }) {
  const markerRef = useRef<LeafletMarker>(null)
  const map = useMap()
  const position: LatLngExpression = [location.latitude, location.longitude]

  useEffect(() => {
    markerRef.current?.setLatLng(position)
    map.panTo(position)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.latitude, location.longitude])

  return (
    <Marker position={position} icon={driverIcon} ref={markerRef}>
      <Popup>
        Speed: {location.speed ? `${location.speed} km/h` : 'N/A'}
        <br />
        Updated: {new Date(location.recordedAt).toLocaleTimeString()}
      </Popup>
    </Marker>
  )
}

interface Props {
  orderId: number
  initialLocation?: DriverLocation | null
}

export default function DriverTrackingMap({ orderId, initialLocation }: Props) {
  const location = useDriverLocation(orderId, initialLocation)

  if (!location) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Awaiting driver location…</p>
      </div>
    )
  }

  return (
    <MapContainer
      center={[location.latitude, location.longitude]}
      zoom={15}
      className="h-64 w-full rounded-lg"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LiveMarker location={location} />
    </MapContainer>
  )
}
