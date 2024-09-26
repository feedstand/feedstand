import React, { FC } from 'react'
import { createRoot } from 'react-dom/client'

const App: FC = () => {
    return <div>Hello world!</div>
}

const root = document.getElementById('⚛')
root && createRoot(root).render(<App />)
