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

    const handleTicketUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] })
    }

    channel.listen('.support.message.created', handleMessageCreated)
    channel.listen('.support.ticket.updated', handleTicketUpdated)

    return () => {
      channel.stopListening('.support.message.created')
      channel.stopListening('.support.ticket.updated')
      echo.leave(`customer.support-ticket.${ticketId}`)
    }
  }, [ticketId, queryClient])
}
