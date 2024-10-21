import { createLazyElement } from './utils'
import { createBrowserRouter, RouteObject, RouterProvider } from 'react-router-dom'

const routes: RouteObject[] = [
  {
    path: '/',
    element: createLazyElement(() => import('@/pages/home'))
  }
]

const Router = () => {
  return (
    <RouterProvider router={createBrowserRouter(routes)} />
  )
}

export default Router
