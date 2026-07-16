import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getEcho } from '@/lib/echo'

export function useSupportRealtime(ticketId: number) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!ticketId) return

    const echo = getEcho()
    if (!echo) return

    const channel = echo.private(`customer.support-ticket.${ticketId}`)

    const handleMessageCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] })
    }

    channel.listen('.support.message.created', handleMessageCreated)

    return () => {
      channel.stopListening('.support.message.created')
      echo.leave(`customer.support-ticket.${ticketId}`)
    }
  }, [ticketId, queryClient])
}
