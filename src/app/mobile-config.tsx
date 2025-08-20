"use client";

import { useEffect } from "react";
// PluginListenerHandle foi movido para a importação do @capacitor/core
import { Capacitor, PluginListenerHandle } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
// Para resolver o erro "Cannot find module '@capacitor/keyboard'",
// você precisa instalar o plugin: npm install @capacitor/keyboard
import { Keyboard } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";

export function useMobileConfig() {
  useEffect(() => {
    // Verifica se o código está rodando em um ambiente Capacitor nativo
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const platform = Capacitor.getPlatform();

    // Função assíncrona para registrar o listener do botão de voltar
    const setupBackButtonHandler = async () => {
      const backButtonHandler: PluginListenerHandle = await App.addListener(
        "backButton",
        ({ canGoBack }) => {
          if (!canGoBack) {
            App.exitApp();
          } else {
            window.history.back();
          }
        }
      );
      return backButtonHandler;
    };

    if (platform === "android" || platform === "ios") {
      // Configurar a StatusBar
      StatusBar.setStyle({ style: Style.Default }); // Usar Default para melhor compatibilidade
      if (platform === "android") {
        StatusBar.setBackgroundColor({ color: "#ffffff" });
      }

      // Ocultar a Splash Screen
      SplashScreen.hide();

      // Configurar o teclado
      Keyboard.setAccessoryBarVisible({ isVisible: false });

      // Registra o listener e guarda a referência para remoção
      const handlerPromise = setupBackButtonHandler();

      // Função de limpeza para remover o listener quando o componente for desmontado
      return () => {
        handlerPromise.then((handler) => handler.remove());
      };
    }
  }, []);
}
