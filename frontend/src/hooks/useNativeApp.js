import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Configures native mobile integrations (StatusBar, SplashScreen, Android hardware back button)
 * when running inside the Capacitor shell. No-ops safely on the web / PWA.
 */
export function useNativeApp() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initNativeUI = async () => {
      try {
        await StatusBar.setBackgroundColor({ color: '#12b76a' });
        await StatusBar.setStyle({ style: Style.Light });
      } catch {
        // Ignore on platforms where StatusBar API is unavailable
      }
      try {
        await SplashScreen.hide();
      } catch {
        // Ignore if splash is already hidden
      }
    };

    initNativeUI();
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle;
    const registerBackButton = async () => {
      listenerHandle = await CapApp.addListener('backButton', ({ canGoBack }) => {
        if (location.pathname !== '/' && canGoBack) {
          navigate(-1);
        } else if (location.pathname !== '/') {
          navigate('/');
        } else {
          CapApp.exitApp();
        }
      });
    };

    registerBackButton();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [location.pathname, navigate]);
}
