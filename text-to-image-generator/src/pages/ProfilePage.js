import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Nav } from "react-bootstrap";
import { FaUser, FaKey } from "react-icons/fa";
import "./ProfileModal.css";
import axios from "axios";

function ProfileModal({ show, onClose }) {
  const [activeTab, setActiveTab] = useState("info");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
  });

  // Cập nhật mật khẩu: 
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  useEffect(() => {
    if (localStorage.getItem("token")) {
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        if (userData) {
          setFormData({
            fullName: userData.name || "",
            email: userData.email || ""
          });
          console.log("Loaded user data:", userData);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/api/change-name/`, 
        {
          name: formData.fullName,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      console.log("Updated Profile:", result.data);
      const updatedUser = result.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      alert("Profile updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile!");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra mật khẩu mới và xác nhận mật khẩu có khớp nhau không
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      alert("New password and confirmation do not match!");
      return;
    }
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_SERVER_URL}/api/change-password/`, 
        {
          old_password: passwordData.currentPassword,  // Đổi từ old_password thành current_password để khớp với API backend
          new_password: passwordData.newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      
      console.log("Password update response:", response.data);
      
      if (response.data.message) {
        // Hiển thị thông báo thành công
        alert(response.data.message || "Password updated successfully!");
        
        // Reset form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
        
        // Đóng modal nếu cần
        onClose();
      }
    } catch (error) {
      console.error("Error updating password:", error);
      
      // Hiển thị lỗi từ server nếu có
      if (error.response && error.response.data && error.response.data.detail) {
        alert(error.response.data.detail);
      } else if (error.response && error.response.data) {
        alert( JSON.stringify(error.response.data.error));
      } else {
        alert("Error updating password. Please try again.");
      }
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered className="profile-modal">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <FaUser className="me-2" /> Edit Profile
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Nav
          variant="tabs"
          activeKey={activeTab}
          onSelect={(selectedKey) => setActiveTab(selectedKey)}
          className="mb-3 modal-tabs"
        >
          <Nav.Item>
            <Nav.Link eventKey="info" className="d-flex align-items-center">
              <FaUser className="me-2" /> Info
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="password" className="d-flex align-items-center">
              <FaKey className="me-2" /> Password
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {activeTab === "info" && (
          <Form onSubmit={handleProfileSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleProfileChange}
                placeholder="Enter your full name"
                className="modal-input text-light"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleProfileChange}
                readOnly
                placeholder="Enter your email"
                className="modal-input text-light"
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 mb-2">
              Save Changes
            </Button>
          </Form>
        )}

        {activeTab === "password" && (
          <Form onSubmit={handlePasswordSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
                className="modal-input text-light"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                className="modal-input text-light"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmNewPassword"
                value={passwordData.confirmNewPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                className="modal-input text-light"
                required
              />
            </Form.Group>

            <Button variant="danger" type="submit" className="w-100">
              Update Password
            </Button>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default ProfileModal;