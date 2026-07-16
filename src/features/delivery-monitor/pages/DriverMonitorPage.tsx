import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { deliveryMonitorApi } from '../api/deliveryMonitorApi'
import TripSimulatorCard from '../components/TripSimulatorCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function DriverMonitorPage() {
  const { t } = useTranslation()
  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips', 'simulator', 'active'],
    queryFn: () => deliveryMonitorApi.getActiveTrips(),
    refetchInterval: 15_000,
  })

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-brand-primary/10 via-brand-primary-light to-transparent">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-display">
            {t('nav.driverMonitor')}
          </h1>
          <p className="text-sm text-text-secondary font-body mt-1">
            Simulate driver actions for testing and operations
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary font-body">
            No active trips right now.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {trips.map((trip) => (
            <TripSimulatorCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  )
}
