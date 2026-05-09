import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { App as AntApp } from "antd";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App";
import store from "./store";

if (localStorage.getItem("papertech_darkMode") === "true") {
  document.documentElement.classList.add("dark");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AntApp>
          <App />
        </AntApp>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
