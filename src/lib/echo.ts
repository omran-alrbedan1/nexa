import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { apiClient } from './axios'
import { env } from '@/config/env'

window.Pusher = Pusher

const echo = new Echo({
  broadcaster: 'reverb',
  key: env.REVERB_KEY,
  authorizer: (channel: { name: string }) => ({
    authorize: (socketId: string, callback: (error: boolean, data: unknown) => void) => {
      apiClient
        .post('/api/broadcasting/auth', {
          socket_id: socketId,
          channel_name: channel.name,
        })
        .then((response) => callback(false, response.data))
        .catch((error) => callback(true, error))
    },
  }),
  wsHost: env.REVERB_HOST,
  wsPort: env.REVERB_PORT,
  wssPort: env.REVERB_PORT,
  forceTLS: env.REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
})

export default echo
