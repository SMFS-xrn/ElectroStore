import { Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header.jsx'
import AdSlot from './components/banners/AdSlot.jsx'
import Footer from './components/layout/Footer.jsx'
import Home from './pages/Home.jsx'
import Smartphones from './pages/Smartphones.jsx'
import Laptops from './pages/Laptops.jsx'
import Computers from './pages/Computers.jsx'
import Tablets from './pages/Tablets.jsx'
import Monitors from './pages/Monitors.jsx'
import Accessories from './pages/Accessories.jsx'
import Gaming from './pages/Gaming.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Search from './pages/Search.jsx'
import Cart from './pages/Cart.jsx'
import Favorites from './pages/Favorites.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'
import Orders from './pages/Orders.jsx'
import AdminLayout from './admin/AdminLayout.jsx'
import Dashboard from './admin/Dashboard.jsx'
import AdminProducts from './admin/Products.jsx'
import AdminCategories from './admin/Categories.jsx'
import AdminOrders from './admin/Orders.jsx'
import AdminUsers from './admin/Users.jsx'
import AdminAds from './admin/Advertisements.jsx'
import Stub from './pages/Stub.jsx'

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/smartphones" element={<Smartphones />} />
          <Route path="/laptops" element={<Laptops />} />
          <Route path="/computers" element={<Computers />} />
          <Route path="/tablets" element={<Tablets />} />
          <Route path="/monitors" element={<Monitors />} />
          <Route path="/accessories" element={<Accessories />} />
          <Route path="/gaming" element={<Gaming />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="advertisements" element={<AdminAds />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
          {[].map(p =>
            <Route key={p} path={`/${p}`} element={<Stub />} />)}
          <Route path="*" element={<Stub notFound />} />
        </Routes>
      </main>
      <div className="container footer-ad"><AdSlot placement="FOOTER" limit={1} /></div>
      <Footer />
    </>
  )
}
