import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onComplete }) {
  const [logoState, setLogoState] = useState('hidden'); // 'hidden' | 'entered' | 'loading' | 'flickering' | 'flickered'
  const [mottoState, setMottoState] = useState('visible'); // 'visible' | 'fading' | 'hidden'
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 1. Start fading out the motto overlay
    const mottoFadeTimer = setTimeout(() => {
      setMottoState('fading');
    }, 1200);

    // 2. Hide motto completely
    const mottoHideTimer = setTimeout(() => {
      setMottoState('hidden');
    }, 1800);

    // 3. Enter the EverThreads solid logo (starts empty / light grey)
    const logoEnterTimer = setTimeout(() => {
      setLogoState('entered');
    }, 1820);

    // 4. Start filling the loading bar strictly inside the text
    const logoLoadingTimer = setTimeout(() => {
      setLogoState('loading');
    }, 1850);

    // 5. Trigger the cinematic sci-fi neon flicker
    const logoFlickerTimer = setTimeout(() => {
      setLogoState('flickering');
    }, 3850);

    // 6. Complete flicker, solidify states
    const logoFlickeredTimer = setTimeout(() => {
      setLogoState('flickered');
    }, 4850);

    // 7. White screen curtain rises
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 4850);

    // 8. Sequence completes and unmounts
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 5850);

    return () => {
      clearTimeout(mottoFadeTimer);
      clearTimeout(mottoHideTimer);
      clearTimeout(logoEnterTimer);
      clearTimeout(logoLoadingTimer);
      clearTimeout(logoFlickerTimer);
      clearTimeout(logoFlickeredTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${isExiting ? 'exit-active' : ''}`}>
      {mottoState !== 'hidden' && (
        <div className={`splash-motto ${mottoState}`}>
          <span className="motto-line">FOR CREATORS</span>
          <span className="motto-line">BY CREATORS</span>
        </div>
      )}

      {logoState !== 'hidden' && (
        <div className="splash-logo-container">
          <div className={`splash-logo-wrapper ${logoState}`}>
            <div className={`splash-logo-mask-container ${logoState}`}>
              <div className="logo-loading-fill" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

