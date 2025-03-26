import { Link } from "react-router-dom";
import { Container, Nav, Navbar } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSignOut, faUserAlt } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import AuthModal from "./AuthModal";
import "./header.css";
import ProfilePage from "../pages/ProfilePage";
function Header() {
  const [showModal, setShowModal] = useState(false);
  const [showButton, setShowButton] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("token")) {
      setShowButton(false);
      console.log("Logged in");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowButton(true);
    console.log("Logged out");
  };

  return (
    <>
      {/* Navbar cho người dùng chưa đăng nhập */}
      {showButton && (
        <Navbar expand="lg" className="navbar-custom fixed-top">
          <Container>
            <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
            LOGO

            </Navbar.Brand>
            <Navbar.Toggle
              aria-controls="basic-navbar-nav"
              className="custom-toggler"
            />

            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto">
                <Nav.Link
                  className="icon-user d-flex align-items-center fw-bold"
                  onClick={() => setShowModal(true)}
                >
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  Sign up / Log in
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
      )}

      {/* Modal xác thực */}
      <AuthModal show={showModal} onClose={() => setShowModal(false)} />

      {/* Navbar cho người dùng đã đăng nhập */}
      {!showButton && (
        <Navbar expand="lg" className="navbar-custom fixed-top">
          <Container>
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
           LOGO
            </Navbar.Brand>
            <Navbar.Toggle 
              aria-controls="logged-in-navbar-nav" 
              className="custom-toggler" 
            />
  
            <Navbar.Collapse id="logged-in-navbar-nav">
              <Nav className="ms-auto">
                <Nav.Link
                  as={Link}
                
                  onClick={() => setShowProfile(true)}
                  className="icon-user d-flex align-items-center fw-bold me-3"
                >
                  <FontAwesomeIcon icon={faUserAlt} className="me-2" />
                  Profile
                </Nav.Link>
                <Nav.Link
                  onClick={handleLogout}
                  className="icon-user d-flex align-items-center fw-bold"
                >
                  <FontAwesomeIcon icon={faSignOut} className="me-2" />
                  Log out
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Container>
          
          {/* Trang Profile */}

        </Navbar>

      )}
        <ProfilePage show={showProfile} onClose={() => setShowProfile(false)} />

    </>
  );
}

export default Header;