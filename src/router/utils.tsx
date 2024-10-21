import { FunctionComponent, Suspense, createElement, lazy } from 'react'

export const createLazyElement = (load: () => Promise<{
  default: React.ComponentType<FunctionComponent>;
}>) => {
  return <Suspense>
    {createElement(lazy(load))}
  </Suspense>
}