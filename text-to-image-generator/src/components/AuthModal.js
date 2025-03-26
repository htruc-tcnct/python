import React, { useState, useEffect } from "react";
import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import "./AuthModal.css"; 
import axios from 'axios';
import { href } from "react-router-dom";
function AuthModal({ show, onClose, currentIs }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isCurrent, setIsCurrent] = useState("login"); 
  const [email, setEmail] = useState('');
  const [emailSignup, setEmailSignup] = useState('');
  const [emailRequest, setEmailRequest] = useState('');
  const [passwordSignup, setPasswordSignup] = useState('');
  const [password, setPassword] = useState('');
  const [firstname, setFirstName] = useState('');
  const [lastname, setLastName] = useState('');
  const handleSignUp = (e) => {
    e.preventDefault();
    // Call API to sign up
    axios.post(`${process.env.REACT_APP_SERVER_URL}/api/register/`, {
      email: emailSignup,
      password_hash: passwordSignup,
      name: firstname + " " + lastname
    }).then(res => {
      console.log(res.data);
      setIsCurrent("login");
      alert("Sign up successfully!");
    }).catch(err => {
      console.log(err);
      
      if (err.response && err.response.data) {
        // Xử lý các định dạng lỗi khác nhau từ server
        if (typeof err.response.data === 'string') {
          // Nếu response là string
          alert(`Sign up failed: ${err.response.data}`);
        } else if (err.response.data.email && Array.isArray(err.response.data.email)) {
          // Nếu lỗi liên quan đến email
          alert(`Sign up failed: ${err.response.data.email[0]}`);
        } else if (err.response.data.detail) {
          // Nếu có trường detail
          alert(`Sign up failed: ${err.response.data.detail}`);
        } else if (err.response.data.error) {
          // Nếu có trường error
          alert(`Sign up failed: ${err.response.data.error}`);
        } else {
          // Trường hợp khác - hiển thị toàn bộ lỗi
          const errorMessage = JSON.stringify(err.response.data);
          alert(`Sign up failed: ${errorMessage}`);
        }
      } else {
        // Không có response.data
        alert(`Sign up failed: ${err.message || "An unknown error occurred"}`);
      }
    });
  };
const handleRequestCode = (e) => {
    e.preventDefault();
    // Call API to request code
    axios.post(`${process.env.REACT_APP_SERVER_URL}/api/reset-password/`, {
      email: emailRequest
    }).then(res => {
      alert("New password has been sent to your email!");

      console.log(res.data);
    }).catch(err => {
      console.log(err);
    });
  };
  
  useEffect(() => {
    if (show) {
      if (currentIs) {
        setIsCurrent(currentIs); 
      }
    } else {
      setIsCurrent("login"); 
    }
  }, [show, currentIs]);
  const handleLogin = (e) => {
    e.preventDefault(); 
    
    // Call API to login using environment variable
    axios.post(`${process.env.REACT_APP_SERVER_URL}/api/login/`, {
      email: email,
      password_hash: password
    }).then(res => {
      console.log(res.data); 
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user_info));
      window.location.reload();
    }).catch(err => {
      console.log(err);
    });
};
  return (
    <Modal show={show} onHide={onClose} centered size="lg" className="rounded">
      <Modal.Body className="p-0 d-flex">
        {/* Ảnh bên trái */}
        <div className="auth-image d-none d-md-block rounded-start">
          <img
            src={isCurrent === "signup" ? "/sign-up.png" : "/login-img.png"}
            alt="Authentication"
          />
        </div>

        {/* Form bên phải */}
        <div className="auth-form p-4 w-100 position-relative">
          <button
            className="btn-close position-absolute top-0 end-0 m-3"
            onClick={onClose}
          ></button>

          {/* LOGIN FORM */}
          {isCurrent === "login" && (
            <div className="form-content">
              <h2 className="fw-bold">Hi there!</h2>
              <p className="text-muted">
                Welcome back! Please login to continue.
              </p>

              <p className="mb-3">
                Not a member?{" "}
                <a
                  href="#"
                  className="text-primary fw-bold"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsCurrent("signup");
                  }}
                >
                  Sign Up!
                </a>
              </p>

              <Form onSubmit={handleLogin}>
                {/* Email Input */}
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Email address"
                    required
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>

                {/* Password Input */}
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      required
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      👁
                    </Button>
                  </InputGroup>
                </Form.Group>

                {/* Remember Me */}
                {/* <Form.Group className="mb-3 d-flex align-items-center">
                  <Form.Check type="checkbox" id="remember" />
                  <Form.Label htmlFor="remember" className="ms-2 mb-0">
                    Remember me
                  </Form.Label>
                </Form.Group> */}

                {/* Login Button */}
                <Button variant="dark" className="w-100 mb-3" type="submit">
                  Login
                </Button>

                {/* Forgot Password */}
                <p className="text-center">
                  <a
                    href="#"
                    className="text-primary fw-bold"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsCurrent("forgot");
                    }}
                  >
                    Forgot Password?
                  </a>
                </p>
              </Form>
            </div>
          )}

          {/* SIGNUP FORM */}
          {isCurrent === "signup" && (
            <div className="form-content">
              <h2 className="fw-bold">Create an Account</h2>
              <p className="text-muted">Sign up to start your journey!</p>

              <p className="mb-3">
                Already have an account?{" "}
                <a
                  href="#"
                  className="text-primary fw-bold"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsCurrent("login");
                  }}
                >
                  Login here!
                </a>
              </p>

              <Form>
                {/* First Name */}
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your first name"
                    required
                    value={firstname}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </Form.Group>

                {/* Last Name */}
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your last name"
                    required
                    value={lastname}
                    onChange={(e) => setLastName(e.target.value)}

                  />
                </Form.Group>

                {/* Email */}
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Email address"
                    required
                    value={emailSignup}
                    onChange={(e) => setEmailSignup(e.target.value)}
                  />
                </Form.Group>

                {/* Password */}
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                    value={passwordSignup}
                    onChange={(e) => setPasswordSignup(e.target.value)}
                      type="password"
                      placeholder="Enter password"
                      required
                    />
                  </InputGroup>
                </Form.Group>

                {/* Subscribe */}
                <Form.Group className="mb-3 d-flex align-items-center">
                  <Form.Check type="checkbox" id="subscribe" />
                  <Form.Label htmlFor="subscribe" className="ms-2 mb-0">
                    Subscribe to our newsletter
                  </Form.Label>
                </Form.Group>

                {/* Sign Up Button */}
                <Button onClick={handleSignUp} variant="dark" className="w-100 mb-3">
                  Sign Up
                </Button>
              </Form>
            </div>
          )}

          {/* FORGOT PASSWORD FORM */}
          {isCurrent === "forgot" && (
            <div className="form-content">
              <h2 className="fw-bold">Hi there!</h2>
              <p className="text-muted">
                Welcome to Text-To-Image, so happy to see you!
              </p>

              <h4 className="mt-4">Forgot Password?</h4>

              <Form>
                {/* Email Input */}
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={emailRequest}
                    onChange={(e) => setEmailRequest(e.target.value)}
                    placeholder="Email address"
                    required
                  />
                </Form.Group>

                {/* Request Code Button */}
                <Button variant="dark" className="w-100 mb-3" onClick={handleRequestCode}>
                  Request Code
                </Button>

                {/* Back to Login */}
                <p className="text-center">
                  <a
                    href="#"
                    className="text-primary fw-bold"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsCurrent("login");
                    }}
                  >
                    Back to Login
                  </a>
                </p>
              </Form>
            </div>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default AuthModal;
