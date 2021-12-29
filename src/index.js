import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import ClippedDrawer from './components/ClippedDrawer';
import reportWebVitals from './reportWebVitals';
import { createTheme, ThemeProvider, StyledEngineProvider } from '@mui/material';

import Login from './components/Login';

const theme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#740f87'
        },
        secondary: {
            main: '#2421b7'
        }
    }
});

ReactDOM.render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        {/* <ClippedDrawer /> */}
        <Login />
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
