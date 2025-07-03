import React, { useState, useEffect } from 'react';
import './CameraPermissionModal.css';

const CameraPermissionModal = ({ onAllow, onDeny }) => (
  <div className="camera-permission-modal">
    <div className="camera-permission-content">
      <h2 className="camera-permission-title">Camera Permission</h2>
      <p className="camera-permission-text">
        This game requires access to your camera. Do you want to allow camera access?
      </p>
      <div className="camera-permission-buttons">
        <button onClick={onDeny} className="camera-permission-deny-btn">Deny</button>
        <button onClick={onAllow} className="camera-permission-allow-btn">Allow</button>
      </div>
    </div>
  </div>
);

const ParentComponent = () => {
  const [showCameraModal, setShowCameraModal] = useState(false);

  useEffect(() => {
    // Try to access the camera on mount
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        // Camera is available and permission granted
        setShowCameraModal(false);
        // You may want to stop the stream if you only want to check permission
        stream.getTracks().forEach(track => track.stop());
      })
      .catch((err) => {
        // Permission denied or camera not available
        setShowCameraModal(true);
      });
  }, []);

  const handleAllow = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        setShowCameraModal(false);
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(() => {
        setShowCameraModal(true);
      });
  };

  const handleDeny = () => {
    setShowCameraModal(false);
    // Optionally, handle denial (e.g., show a message or redirect)
  };

  return (
    <div>
      {/* Your main content here */}
      {showCameraModal && (
        <CameraPermissionModal onAllow={handleAllow} onDeny={handleDeny} />
      )}
    </div>
  );
};

export default ParentComponent; 