import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Home from './pages/Home'
import Layout from './components/common/layout'

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 루트 경로 */}
        <Route
          path="/"
          element={<Layout />}>
          <Route
            index
            element={<Home />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default Router
