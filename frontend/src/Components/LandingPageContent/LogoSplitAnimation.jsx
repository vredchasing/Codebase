import React from 'react';

export default function CodeSplitAnimation({ codeRef, baseRef, centerRef }) {
  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
        backgroundColor: 'transparent',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: '4rem',
          fontWeight: 'bold',
        }}
      >
        <div ref={codeRef} style={{ color: 'black', fontSize: '150px' }}>CODE</div>
        <div ref={baseRef} style={{ color: 'black', fontSize: '150px' }}>BASE</div>
      </div>
    </div>
  );
}
