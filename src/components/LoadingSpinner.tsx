import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Carregando...',
  size = 'medium',
  fullScreen = false
}) => {
  const getSizeValues = () => {
    switch (size) {
      case 'small':
        return { spinner: 20, fontSize: '14px' };
      case 'large':
        return { spinner: 48, fontSize: '18px' };
      case 'medium':
      default:
        return { spinner: 32, fontSize: '16px' };
    }
  };

  const { spinner, fontSize } = getSizeValues();

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: fullScreen ? '0' : '20px'
      }}
    >
      <div
        style={{
          width: `${spinner}px`,
          height: `${spinner}px`,
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      />
      {message && (
        <div
          style={{
            fontSize,
            color: '#6b7280',
            fontWeight: '500',
            textAlign: 'center',
            lineHeight: '1.5',
            maxWidth: '300px'
          }}
        >
          {message}
        </div>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
