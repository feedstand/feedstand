import React, { FC } from 'react'

export const App: FC = () => {
    return <p>Hello world! Hash: {import.meta.env.VITE_VERSION_TAG}</p>
}
