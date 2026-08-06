import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { BookInfoExperience } from "./components/BookInfoExperience";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BookInfoExperience />
  </StrictMode>,
);
