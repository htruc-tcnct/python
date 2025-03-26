import React, { useState, useEffect, useRef } from "react";
import { Navbar, Button, Dropdown, Modal, Nav, Form, Row, Col } from "react-bootstrap";
import {
  FaBars,
  FaTimes,
  FaPlus,
  FaTrash,
  FaPaperPlane,
  FaHome,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "./MainPage.css";

function GeneratePage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newPrompt, setNewPrompt] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [loadingDots, setLoadingDots] = useState(".");
  const [chatHistory, setChatHistory] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const chatBoxRef = useRef(null);
  const [titleToEdit, setTitleToEdit] = useState("");
  const [idToEdit, setIdToEdit] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const inputRefs = useRef({});

  useEffect(() => {
    if (isEditing && idToEdit && inputRefs.current[idToEdit]) {
      inputRefs.current[idToEdit].focus(); // Focus vào input của chat đang được chỉnh sửa
    }
  }, [isEditing, idToEdit]);

  // Handle blur (clicking outside) or pressing Enter to stop editing
  const handleBlur = async() => {
    setIsEditing(false);
    console.log(titleToEdit);
    const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/chats/update/${idToEdit}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: titleToEdit,
      }),
    });
    if(response.ok){
      fetchImageChatList();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      setIsEditing(false);
    }
  };
  // Tải danh sách chat khi component mount
  useEffect(() => {
    if (token) {
      fetchImageChatList();
    }
  }, [token]);

  // Effect cho loading dots animation
  useEffect(() => {
    if (isFetching) {
      const interval = setInterval(() => {
        setLoadingDots((prev) => (prev === "..." ? "." : prev + "."));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isFetching]);

  // Auto-scroll chat box khi có tin nhắn mới
  useEffect(() => {
    if (chatBoxRef && chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [selectedChat, isFetching]);

  // Hàm biến đổi dữ liệu từ API sang định dạng phù hợp với UI
  const transformChatData = (apiData) => {
    const messages = [];
    const images = [];
    
    if (apiData && apiData.chat_turns) {
      apiData.chat_turns.forEach(turn => {
        // Lấy tin nhắn của người dùng
        const userMessage = turn.chatbot_messages.find(msg => msg.sender === 'user');
        if (userMessage) {
          messages.push({
            id: userMessage.id,
            text: userMessage.message_text,
            sender: 'user',
            turnId: turn.id,
            createdAt: userMessage.created_at
          });
        }
        
        // Lấy hình ảnh nếu có
        if (turn.images && turn.images.length > 0) {
          turn.images.forEach(img => {
            images.push({
              id: img.id,
              url: img.image_url,
              sender: img.sender,
              turnId: turn.id,
              promptText: img.prompt_text
            });
          });
        }
        
        // Lấy tin nhắn từ server
        const serverMessage = turn.chatbot_messages.find(msg => msg.sender === 'server');
        if (serverMessage) {
          messages.push({
            id: serverMessage.id,
            text: serverMessage.message_text,
            sender: 'server',
            turnId: turn.id,
            createdAt: serverMessage.created_at,
            // Tìm hình ảnh tương ứng với tin nhắn này
            image: turn.images.find(img => img.sender === 'server')?.image_url || null
          });
        }
      });
    }
    
    // Sắp xếp tin nhắn theo thời gian tạo
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    return {
      id: apiData.id,
      title: apiData.title,
      messages: messages,
      images: images
    };
  };

  // Fetch danh sách chat hình ảnh từ API
  const fetchImageChatList = async () => {
    try {
      setIsFetching(true);
      // Sử dụng API mới dành cho chat hình ảnh
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/image-chats/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch image chat list");
      }

      const data = await response.json();
      
      const transformedChats = data.map(chat => ({
        id: chat.id,
        title: chat.title,
        messages: [],
        images: []
      }));
      
      setChatHistory(transformedChats);
      
      // Nếu có ít nhất một chat, chọn chat đầu tiên
      if (transformedChats.length > 0) {
        fetchChatDetail(transformedChats[0].id);
      }
      setIsFetching(false);
    } catch (error) {
      console.error("Error fetching image chat list:", error);
      setIsFetching(false);
    }
  };

  // Fetch chi tiết của một chat từ API
  const fetchChatDetail = async (chatId) => {
    try {
      setIsFetching(true);
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/chats/${chatId}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chat detail");
      }

      const data = await response.json();
      const transformedChat = transformChatData(data);
      
      // Cập nhật chatHistory với dữ liệu chi tiết của chat này
      setChatHistory(prevHistory => 
        prevHistory.map(chat => 
          chat.id === chatId ? {
            ...chat,
            messages: transformedChat.messages,
            images: transformedChat.images
          } : chat
        )
      );
      
      // Đặt chat này làm selectedChat
      setSelectedChat(transformedChat);
      setIsFetching(false);
    } catch (error) {
      console.error("Error fetching chat detail:", error);
      setIsFetching(false);
    }
  };

  // Tạo chat hình ảnh mới
  const createNewImageChat = async () => {
    try {
      setIsFetching(true);
      // Sử dụng API mới để tạo chat hình ảnh
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/image-chats/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `Image Request ${new Date().toLocaleTimeString()}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create new image chat");
      }

      const data = await response.json();
      
      // Lấy chat đã tạo từ response
      const newChat = {
        id: data.chat.id,
        title: data.chat.title,
        messages: [],
        images: []
      };
      
      setChatHistory(prev => [...prev, newChat]);
      setSelectedChat(newChat);
      setShowModal(false);
      setIsFetching(false);
    } catch (error) {
      console.error("Error creating new image chat:", error);
      setIsFetching(false);
    }
  };

  // Xóa chat
  const deleteChat = async (chatId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/chats/delete/${chatId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      // Cập nhật danh sách chat sau khi xóa
      setChatHistory(chatHistory.filter((chat) => chat.id !== chatId));
      
      // Nếu chat hiện tại đang được chọn, chọn chat khác hoặc đặt là null
      if (selectedChat && selectedChat.id === chatId) {
        if (chatHistory.length > 1) {
          const nextChat = chatHistory.find(chat => chat.id !== chatId);
          if (nextChat) {
            fetchChatDetail(nextChat.id);
          } else {
            setSelectedChat(null);
          }
        } else {
          setSelectedChat(null);
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  // Hàm chính để sinh hình ảnh sử dụng API mới
  const generateImage = async () => {
    if (!newPrompt.trim() || !selectedChat) return;

    // Tắt input để ngăn người dùng gửi nhiều lần
    setIsFetching(true);
    
    // Cập nhật UI ngay lập tức để hiển thị tin nhắn người dùng
    const tempMessageId = Date.now();
    const updatedChat = {
      ...selectedChat,
      messages: [
        ...selectedChat.messages,
        { id: tempMessageId, text: newPrompt, sender: 'user' }
      ]
    };
    setSelectedChat(updatedChat);
    setNewPrompt("");
    
    try {
      // Gọi Unsplash API để lấy hình ảnh
      const unsplashResponse = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(newPrompt)}&client_id=bgNBDLXINYSvIVfDQEyMPEVw5HMzT9VrTMulikNkBlQ`
      );
      
      if (!unsplashResponse.ok) {
        throw new Error("Failed to fetch image from Unsplash");
      }
      
      const unsplashData = await unsplashResponse.json();
      
      if (unsplashData.results && unsplashData.results.length > 0) {
        // Lấy một hình ảnh ngẫu nhiên từ kết quả
        const randomIndex = Math.floor(
          Math.random() * Math.min(10, unsplashData.results.length)
        );
        const imageUrl = unsplashData.results[randomIndex].urls.full;
        
        // Sử dụng API mới để tạo hình ảnh và thêm vào chat turn
        const generateResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/image-chats/generate/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            chat_id: selectedChat.id,
            prompt_text: newPrompt,
            image_url: imageUrl
          }),
        });
        
        if (!generateResponse.ok) {
          throw new Error("Failed to save generated image");
        }
        
        // Tải lại chi tiết chat để hiển thị đầy đủ
        await fetchChatDetail(selectedChat.id);
      } else {
        throw new Error("No images found from Unsplash API");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      // Cập nhật UI để hiển thị lỗi
      const errorChat = {
        ...selectedChat,
        messages: [
          ...selectedChat.messages,
          { 
            id: Date.now(), 
            text: "Sorry, I couldn't generate an image. Please try again.", 
            sender: 'server' 
          }
        ]
      };
      setSelectedChat(errorChat);
    } finally {
      setIsFetching(false);
    }
  };

  const handleChatSelect = (chat) => {
    if (!selectedChat || selectedChat.id !== chat.id) {
      fetchChatDetail(chat.id);
    }
    setShowModal(false);
  };

  return (
    <div
      className="d-flex vh-100 flex-column"
      style={{ backgroundColor: "#292c31", color: "#f8f9fa" }}
    >
      <Navbar
        style={{ backgroundColor: "#383a3e" }}
        variant="dark"
        expand="lg"
        className="px-3"
      >
        <Button
          variant="dark"
          className="me-3"
          onClick={() => setShowModal(true)}
        >
          <FaBars /> Menu
        </Button>
        <Button href="/" className="ms-auto" variant="light">
          <FaHome />
        </Button>
      </Navbar>
      
      {/* Modal thay thế sidebar */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Image Requests</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Button variant="dark" className="mb-2 w-100" onClick={createNewImageChat}>
            <FaPlus /> New Image Request
          </Button>
          <Nav className="flex-column">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className="d-flex justify-content-between align-items-center"
              >
               <input
                   ref={(el) => (inputRefs.current[chat.id] = el)}
                   type="text"
                   value= {(chat.id === idToEdit) ? titleToEdit: chat.title} 
                   className="border-0 ms-1"
                   onChange={(e) => setTitleToEdit(e.target.value)}
                   onBlur={handleBlur}
                   onKeyDown={handleKeyDown}
                   onClick={() => handleChatSelect(chat)}
                    style={{ backgroundColor: "transparent", cursor: "pointer"}}
                />
                <Dropdown>
                  <Dropdown.Toggle variant="Warning" id="dropdown-basic">
                    Option
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => {setIsEditing(true);
                      setTitleToEdit(chat.title);
                      setIdToEdit(chat.id);
                      console.log(chat.id);
                    }}>
                      Edit name
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => deleteChat(chat.id)}>
                      Delete chat
                    </Dropdown.Item>
                    <Dropdown.Item>Publish</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            ))}
          </Nav>
        </Modal.Body>
      </Modal>

      <div className="flex-grow-1 d-flex flex-column justify-content-between px-5">
        {!selectedChat && (
          <div className="text-center mt-5">
            <h1 className="mb-4">Enter a prompt to generate an image</h1>
          </div>
        )}

        <div
          ref={chatBoxRef}
          className="chat-box"
          style={{
            backgroundColor: "#383a3e",
            padding: "20px",
            borderRadius: "10px",
            flexGrow: 1,
            overflowY: "auto",
            maxHeight: "80vh",
          }}
        >
          {selectedChat &&
            selectedChat.messages.map((msg, index) => (
              <div key={index} style={{ marginBottom: "15px" }}>
                {/* Hiển thị tin nhắn */}
                <div style={{ textAlign: msg.sender === "user" ? "right" : "left" }}>
                  <span
                    style={{
                      backgroundColor: msg.sender === "user" ? "#007bff" : "#6c757d",
                      color: "#fff",
                      padding: "10px 15px",
                      borderRadius: "15px",
                      display: "inline-block",
                      maxWidth: "70%",
                    }}
                  >
                    {msg.text}
                  </span>
                </div>

                {/* Hiển thị ảnh ngay sau tin nhắn nếu có */}
                {msg.image && (
                  <div className="mt-2" style={{ textAlign: "left" }}>
                    <img
                      src={msg.image}
                      alt="Generated"
                      style={{
                        width: "100%",
                        maxWidth: "300px",
                        borderRadius: "10px",
                        display: "block",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}

          {isFetching && (
            <div style={{ textAlign: "left", marginBottom: "10px" }}>
              <span
                style={{
                  backgroundColor: "#6c757d",
                  color: "#fff",
                  padding: "10px 15px",
                  borderRadius: "15px",
                  display: "inline-block",
                  maxWidth: "70%",
                }}
              >
                {loadingDots}
              </span>
            </div>
          )}
        </div>

        <div className="pb-3">
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              generateImage();
            }}
          >
            <Row className="justify-content-center">
              <Col md={10}>
                <Form.Control
                  type="text"
                  placeholder="Enter image description..."
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  disabled={isFetching}
                />
              </Col>
              <Col md={1}>
                <Button className="m-0" variant="light" type="submit" disabled={isFetching}>
                  <FaPaperPlane />
                </Button>
              </Col>
            </Row>
          </Form>
        </div>
      </div>
    </div>
  );
}

export default GeneratePage;