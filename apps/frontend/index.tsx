import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import type { FC } from 'react'
import { createRoot } from 'react-dom/client'
import { loadChannel } from './apis/channels'
import { client } from './instances/query'

const Page: FC = () => {
  const { data: channel } = useQuery({
    queryKey: ['swagger'],
    queryFn: async () => await loadChannel(1),
  })

  return (
    <>
      <p>Hello world!</p>
      {channel && (
        <dl>
          <dt>Title</dt>
          <dd>{channel?.title}</dd>
          <dt>Description</dt>
          <dd>{channel?.description}</dd>
        </dl>
      )}
    </>
  )
}

const App: FC = () => {
  return (
    <QueryClientProvider client={client}>
      <Page />
    </QueryClientProvider>
  )
}

const root = document.getElementById('⚛')
root && createRoot(root).render(<App />)
