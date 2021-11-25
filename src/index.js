import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import ClippedDrawer from './components/clippedDrawer';
import reportWebVitals from './reportWebVitals';
import { createTheme, ThemeProvider, StyledEngineProvider, adaptV4Theme } from '@mui/material';

const theme = createTheme(adaptV4Theme({
  palette: {
    mode: 'dark',
    // primary: {
    //   main: '#097D1C'
    // },
    secondary: {
      main: '#c5851199'
    }
  }
}));

ReactDOM.render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <ClippedDrawer />
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();