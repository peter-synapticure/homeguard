import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import ProcessingPage from './pages/Processing'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AuthGuard />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/home/:homeId" element={<App />} />
        <Route path="/home/:homeId/upload" element={<Upload />} />
        <Route path="/home/:homeId/report/:reportId" element={<ProcessingPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
)