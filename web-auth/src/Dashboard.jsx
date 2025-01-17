import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Spin } from 'antd';
import 'antd/dist/reset.css';

const Dashboard = () => {
  const location = useLocation();
  const { username } = location.state || { username: 'Utilisateur' };
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Spin tip="Veuillez patienter, chargement des données..." size="large" />
        <h2 style={{ marginTop: '20px' }}>Veuillez patienter, chargement des données...</h2>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <Card title="Bienvenue sur le Dashboard" style={{ width: 300 }}>
        <h2>Utilisateur : {username}</h2>
      </Card>
    </div>
  );
};

export default Dashboard; 