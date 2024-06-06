import React from 'react';
import {Box, ThemeProvider} from "@mui/material";
import theme from "./styles/theme";
import TopBar from "./TopBar";
import MainPanel from "./MainPanel";

function App() {
  return (
      <ThemeProvider theme={theme}>
          <Box>
              <TopBar/>
              <Box
                  paddingTop={2}
                  mt={2}
                  paddingLeft={2}
                  paddingRight={2}
                  sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                  }}
              >
                  <MainPanel/>
              </Box>

          </Box>
      </ThemeProvider>
  );
}

export default App;
