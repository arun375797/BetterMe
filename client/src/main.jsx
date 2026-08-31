import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import SmoothScroll from "./components/SmoothScroll.jsx";
import { MusicPlayerProvider } from "./context/MusicPlayerContext.jsx";
import "./index.css";
import "lenis/dist/lenis.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <MusicPlayerProvider>
        <SmoothScroll>
          <App />
        </SmoothScroll>
      </MusicPlayerProvider>
    </BrowserRouter>
  </StrictMode>
);
