import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { Input, Button, Card } from 'antd';
import 'antd/dist/reset.css';
import { QRCodeCanvas } from "qrcode.react";
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [QRCode, setQRCode] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const socket = io("http://localhost:5000");
    
    const loadQRCode = async () => {
      try {
        const { QRCodeCanvas } = await import("qrcode.react");
        setQRCode(() => QRCodeCanvas);
        const sessionId = Date.now();
        setQrCode(`exp://192.168.1.186:8081/--/auth?sessionId=${sessionId}`);
      } catch (error) {
        console.error("Error loading QR Code:", error);
      }
    };

    loadQRCode();

    socket.on("authenticated", (data) => {
      navigate('/dashboard', { state: { username: data.username } });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:4000/login", {
        username,
        password,
      });
      navigate('/dashboard', { state: { username } });
    } catch (error) {
      alert("Login Failed!");
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      width: '100%',
      flexDirection: 'row'
    }}>
      <Card style={{ width: 400, height: 405, padding: 20, marginRight: 20 }}>
        <h1 style={{ textAlign: 'center' }}>Login</h1>
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <Input.Password
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: 10 }}
        />
        <Button type="primary" onClick={handleLogin} style={{ width: '100%', marginBottom: 10 }}>
          Login
        </Button>
      </Card>
      <div style={{ 
        width: 400,
        height: '48%',
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        border: '2px dashed #007bff',
        borderRadius: '5px',
        padding: '10px',
      }}>
        <h2 style={{ 
          textAlign: 'center',
          marginBottom: '15px',
          color: '#007bff'
        }}>
          Scanner pour vous connecter
        </h2>
        {qrCode && <QRCodeCanvas 
          value={qrCode} 
          size={300}
          level="H"
        />}
      </div>
    </div>
  );
};

export default Home; 