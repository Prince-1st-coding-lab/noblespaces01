import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteLayout } from "./components/SiteLayout";
import { CartProvider } from "./context/CartContext";
import { CartSheet } from "./components/shop/CartSheet";
import Home from "./pages/Home";
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/AboutPage";
import GalleryPage from "./pages/GalleryPage";
import ContactPage from "./pages/ContactPage";
import ServiceDetail from "./pages/ServiceDetail.tsx";
import ShopPage from "./pages/ShopPage";
import CategoryPage from "./pages/CategoryPage";
import ProductDetail from "./pages/ProductDetail";

import CheckoutPage from "./pages/CheckoutPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminServices from "./pages/admin/AdminServices";
import AdminBookingsPage from "./pages/admin/AdminBookingsPage";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminQuotes from "./pages/admin/AdminQuotes";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminPhotos from "./pages/admin/AdminPhotos";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminSettings from "./pages/admin/AdminSettings";
import BookNow from "./pages/BookNow.tsx";
import HomeServicesPage from "./pages/HomeServicesPage";

import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import NotFound from "./pages/NotFound.tsx";
import { WhatsAppFab } from "./components/WhatsAppFab";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:slug" element={<ServiceDetail />} />
              <Route path="/home-services" element={<HomeServicesPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/shop/category/:slug" element={<CategoryPage />} />
              <Route path="/shop/:slug" element={<ProductDetail />} />

              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/book" element={<BookNow />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancelled" element={<PaymentCancelled />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="quotes" element={<AdminQuotes />} />
              <Route path="messages" element={<AdminMessages />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="photos" element={<AdminPhotos />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="settings" element={<AdminSettings />} />

              <Route path="testimonials" element={<AdminTestimonials />} />
            </Route>
          </Routes>
          <CartSheet />
          <WhatsAppFab />
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
