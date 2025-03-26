import React, { useState, useEffect, useRef } from "react";
import { Navbar, Modal, Nav, Button, Form, Row, Col , Dropdown} from "react-bootstrap";
import {
  FaBars,
  FaTimes,
  FaPlus,
  FaTrash,
  FaPaperPlane,
  FaHome,
  FaAngleDown,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import "./MainPage.css";

function ChatPage() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [loadingDots, setLoadingDots] = useState(".");
  const [titleToEdit, setTitleToEdit] = useState("");
  const [idToEdit, setIdToEdit] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const chatBoxRef = useRef(null);
  const inputRefs = useRef({});
  // Tải danh sách chat khi component mount

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
      fetchChatList();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      setIsEditing(false);
    }
  };
  useEffect(() => {
    if (token) {
      fetchChatList();
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
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [selectedChat, isFetching]);

  // Hàm biến đổi dữ liệu từ API sang định dạng phù hợp với UI
  const transformChatData = (apiData) => {
    // Trích xuất tin nhắn thành cấu trúc phẳng
    const flatMessages = [];
    
    if (apiData && apiData.chat_turns) {
      apiData.chat_turns.forEach(turn => {
        if (turn.chatbot_messages && turn.chatbot_messages.length > 0) {
          turn.chatbot_messages.forEach(message => {
            flatMessages.push({
              id: message.id,
              turnId: turn.id,
              turnNumber: turn.turn_number,
              sender: message.sender,
              text: message.message_text,
              createdAt: message.created_at,
              images: turn.images.filter(img => img.sender === message.sender)
            });
          });
        }
      });
    }
    
    // Sắp xếp tin nhắn theo thời gian tạo
    flatMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    return {
      id: apiData.id,
      title: apiData.title,
      messages: flatMessages
    };
  };

  // Fetch danh sách chat từ API
  const fetchChatList = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/chats/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chat list");
      }

      const data = await response.json();
      // Chuyển đổi dữ liệu từ API thành định dạng chatHistory
      const transformedChats = data.map(chat => ({
        id: chat.id,
        title: chat.title,
        // Mặc định messages sẽ là mảng rỗng vì chưa tải chi tiết chat
        messages: []
      }));
      
      setChatHistory(transformedChats);
      
      // Nếu có ít nhất một chat, chọn chat đầu tiên
      if (transformedChats.length > 0) {
        fetchChatDetail(transformedChats[0].id);
      }
    } catch (error) {
      console.error("Error fetching chat list:", error);
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
          chat.id === chatId ? {...chat, messages: transformedChat.messages} : chat
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

  // Tạo chat mới
  const createNewChat = async () => {
    try {
      setIsFetching(true);
      const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/chats/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: `New Chat ${new Date().toLocaleTimeString()}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create new chat");
      }

      const data = await response.json();
      // Lấy chat đã tạo từ response
      const newChat = {
        id: data.chat.id,
        title: data.chat.title,
        messages: []
      };
      
      setChatHistory(prev => [...prev, newChat]);
      setSelectedChat(newChat);
      setIsFetching(false);
      setShowSidebar(false);
    } catch (error) {
      console.error("Error creating new chat:", error);
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

  // Gửi tin nhắn
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
  
    // Tắt input để ngăn người dùng gửi nhiều lần
    setIsFetching(true);
    
    if (!newMessage.trim() || !selectedChat) return;

    const updatedMessages = [
      ...selectedChat.messages,
      { sender: "user", text: newMessage },
    ];
    setSelectedChat({ ...selectedChat, messages: updatedMessages });
    setNewMessage("");
    setIsFetching(true);
    let botReply ;
    try {
      const response = await fetch("https://api.cohere.ai/v1/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer GXjz9EqxvQuK0iuqM0MQoVoWpUgaKof8o002VAlL`,
        },
        body: JSON.stringify({
          model: "command",
          prompt: newMessage,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
       botReply = data.generations[0].text;
      setIsFetching(false);

      const updatedChat = {
        ...selectedChat,
        messages: [...updatedMessages, { sender: "bot", text: botReply }],
      };

      setChatHistory(
        chatHistory.map((chat) =>
          chat.id === selectedChat.id ? updatedChat : chat
        )
      );
      setSelectedChat(updatedChat);
    } catch (error) {
      console.error("Error fetching response from Cohere API:", error);
      setIsFetching(false);
    }
    try {
      // Thêm chat turn mới với tin nhắn từ người dùng
      const addTurnResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/chats/add-turn/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chat_id: selectedChat.id,
          message_text: newMessage
        }),
      });
  
      if (!addTurnResponse.ok) {
        throw new Error("Failed to add chat turn");
      }
  
      const turnData = await addTurnResponse.json();
      const chatTurnId = turnData.chat_turn.id;
      
      // Hiển thị tin nhắn của người dùng ngay lập tức
      const updatedMessages = [
        ...selectedChat.messages,
        { 
          id: Date.now(), // Temporary ID
          sender: "user", 
          text: botReply,
          createdAt: new Date().toISOString()
        }
      ];
      setSelectedChat({ ...selectedChat, messages: updatedMessages });
      setNewMessage("");
  
      // Gọi Claude API để lấy phản hồi
      try {
        // Lấy lịch sử tin nhắn để cung cấp context (tùy chọn)
        const messageHistory = selectedChat.messages.map(msg => ({
          role: msg.sender === "user" ? "human" : "assistant",
          content: msg.text
        }));
  
    
  
        // Thêm phản hồi từ server với nội dung từ Claude
        const serverResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/chats/add-server-response/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            chat_turn_id: chatTurnId,
            message_text: botReply
          }),
        });
  
        if (!serverResponse.ok) {
          throw new Error("Failed to add server response");
        }
  
        // Tải lại chi tiết chat để cập nhật đầy đủ tin nhắn
        fetchChatDetail(selectedChat.id);
      } catch (aiError) {
        console.error("Error with AI response:", aiError);
        
        // Nếu có lỗi với AI, vẫn gửi một phản hồi để người dùng biết
        const serverResponse = await fetch(`${process.env.REACT_APP_SERVER_URL}/api/chats/add-server-response/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            chat_turn_id: chatTurnId,
            message_text: "Sorry, I'm having trouble processing your request right now. Please try again later."
          }),
        });
        
        fetchChatDetail(selectedChat.id);
        setIsFetching(false);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsFetching(false);
    }
  };

  const handleChatSelect = (chat) => {
    if (!selectedChat || selectedChat.id !== chat.id) {
      fetchChatDetail(chat.id);
    }
    setShowSidebar(false);
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
          onClick={() => setShowSidebar(!showSidebar)}
        >
          {showSidebar ? <FaTimes /> : <FaBars />}{" "}
          {showSidebar ? "Close" : "Menu"}
        </Button>
        <Button href="/" className="ms-auto" variant="light">
          <FaHome />
        </Button>
      </Navbar>

      <Modal show={showSidebar} onHide={() => setShowSidebar(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Chat bot</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Button variant="dark" className="mb-2 w-100" onClick={createNewChat}>
            <FaPlus /> New Chat
          </Button>
          <Nav className="flex-column">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className="d-flex justify-content-between align-items-center border border-dark-subtle py-1"
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
            <h1 className="mb-4">What can I help with?</h1>
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
              <div
                key={index}
                style={{
                  textAlign: msg.sender === "user" ? "right" : "left",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    backgroundColor:
                      msg.sender === "user" ? "#007bff" : "#6c757d",
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
              sendMessage();
            }}
          >
            <Row className="justify-content-center">
              <Col md={10}>
                <Form.Control
                  type="text"
                  placeholder="Enter your request..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
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
  export default ChatPage;  