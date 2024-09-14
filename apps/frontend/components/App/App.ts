import { createElement, FC } from 'react'

export const App: FC = () => {
    return createElement('p', undefined, `Hello world! Hash: ${import.meta.env.VITE_VERSION_TAG}`)
}
