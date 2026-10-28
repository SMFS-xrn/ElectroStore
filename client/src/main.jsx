import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { ShopProvider } from './contexts/ShopContext.jsx'
import './styles/global.css'
createRoot(document.getElementById('root')).render(<BrowserRouter><AuthProvider><ShopProvider><App /></ShopProvider></AuthProvider></BrowserRouter>)
