import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

import { apiClient } from './axios'
import { env } from '@/config/env'

let echoInstance: Echo<'reverb'> | null = null

export function getEcho(): Echo<'reverb'> | null {
  if (echoInstance) return echoInstance

  if (!env.REVERB_KEY) {
    return null
  }

  ;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

  echoInstance = new Echo<'reverb'>({
    broadcaster: 'reverb',
    key: env.REVERB_KEY,
    authorizer: (channel: any) => ({
      authorize: (socketId: string, callback: (error: any, data: any) => void) => {
        apiClient
          .post('/api/broadcasting/auth', {
            socket_id: socketId,
            channel_name: channel.name,
          })
          .then((response) => callback(null, response.data))
          .catch((error) => callback(error, null))
      },
    }),
    wsHost: env.REVERB_HOST,
    wsPort: env.REVERB_PORT,
    wssPort: env.REVERB_PORT,
    forceTLS: env.REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
  })

  return echoInstance
}

export default getEcho
