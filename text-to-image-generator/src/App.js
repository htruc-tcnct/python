import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate
} from "react-router-dom";
import { Container } from "react-bootstrap";
import { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import GeneratePage from "./pages/GeneratePage.js";

// Component ProtectedRoute để bảo vệ các route cần đăng nhập
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("token");
  const location = useLocation();

  if (!isAuthenticated) {
    // Chuyển hướng về trang chính nếu chưa đăng nhập
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}

function Layout() {
  const location = useLocation();

  // Chỉ hiển thị Header ở các route cụ thể
  const showHeaderRoutes = ["/"];
  const showHeader = showHeaderRoutes.includes(location.pathname);

  return (
    <>
      {showHeader && <Header />} {/* Chỉ hiển thị Header ở các route cụ thể */}
      {/* Nếu có Header, Container sẽ là fluid */}
      <Container fluid={!showHeader} className={showHeader ? "mt-5" : ""}>
        <Routes>
          {/* Route không cần đăng nhập */}
          <Route path="/" element={<Home />} />
          
          {/* Các route cần đăng nhập */}
          <Route path="/chatbot" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          
          <Route path="/generator" element={
            <ProtectedRoute>
              <GeneratePage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route
            path="*"
            element={
              <h1 className="text-danger text-center mt-5">
                404 - Page Not Found
              </h1>
            }
          />
        </Routes>
      </Container>
      {showHeader && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;