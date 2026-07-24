import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { App as AntApp } from "antd";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App";
import store from "./stores";
import { AppThemeProvider } from "./styles/theme/AppThemeContext";

const Router = window.papertechDesktop ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <AppThemeProvider>
        <Router>
          <AntApp>
            <App />
          </AntApp>
        </Router>
      </AppThemeProvider>
    </Provider>
  </React.StrictMode>,
);
