import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Доступна новая версия приложения. Обновить?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Приложение готово к работе офлайн');
  },
});

createRoot(document.getElementById("root")!).render(<App />);
