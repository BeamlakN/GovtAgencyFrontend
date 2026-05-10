import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "@fontsource/noto-sans-ethiopic/400.css";
import "./i18n/config";
import "./index.css";
import App from "./App.jsx";
import I18nHtmlAttributes from "./components/I18nHtmlAttributes.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <I18nHtmlAttributes />
      <App />
    </BrowserRouter>
  </StrictMode>
);