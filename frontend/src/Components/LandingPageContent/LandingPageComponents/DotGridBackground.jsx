import React, { useEffect, useState } from 'react';
import './DotGridBackground.css';

export default function AnimationLPA() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []); // runs once on mount

  return (
    <div className="animation-lpa-background">
      <div className={`animation-lpa-container ${loaded ? 'loaded' : ''}`}>
      </div>
    </div>
  );
}
