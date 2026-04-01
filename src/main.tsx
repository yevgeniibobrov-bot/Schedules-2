
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import '@fzwp/ui-kit/styles';
  import "./styles/index.css";
  import { ToastContextProvider } from '@fzwp/ui-kit/toast';

  createRoot(document.getElementById("root")!).render(
    <ToastContextProvider placement="bottom">
      <App />
    </ToastContextProvider>
  );
  