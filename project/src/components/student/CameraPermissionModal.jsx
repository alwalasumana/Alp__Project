import React from 'react';

const CameraPermissionModal = ({ onAllow, onDeny }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }}>
    <div style={{
      background: 'white',
      borderRadius: '1.2rem',
      padding: '2rem',
      maxWidth: 350,
      width: '90%',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
    }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>Camera Permission</h2>
      <p style={{ marginBottom: '1.5rem', color: '#444' }}>
        This game requires access to your camera. Do you want to allow camera access?
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
        <button onClick={onDeny} style={{ padding: '0.6rem 1.2rem', borderRadius: '0.7rem', border: 'none', background: '#e5e7eb', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Deny</button>
        <button onClick={onAllow} style={{ padding: '0.6rem 1.2rem', borderRadius: '0.7rem', border: 'none', background: '#6366f1', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Allow</button>
      </div>
    </div>
  </div>
);

export default CameraPermissionModal; 