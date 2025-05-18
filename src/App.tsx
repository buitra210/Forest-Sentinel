import MapGrid from "./components/MapGrid";
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
} from "@mui/material";
import { green } from "@mui/material/colors";
import ForestIcon from "@mui/icons-material/Forest";

// Create a custom theme with forest-related colors
const theme = createTheme({
  palette: {
    primary: {
      main: "#2c6e49",
      light: "#4c956c",
      dark: "#1e4b33",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#d68c45",
      light: "#e2a972",
      dark: "#b06e31",
      contrastText: "#ffffff",
    },
    error: {
      main: "#d32f2f",
    },
    warning: {
      main: "#FFA000",
    },
    info: {
      main: "#0288d1",
    },
    success: {
      main: green[600],
    },
    background: {
      default: "#f8f9fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#555555",
    },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <AppBar position="static">
          <Toolbar>
            <ForestIcon sx={{ mr: 2 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" component="h1">
                Tay Son Forest Monitoring System
              </Typography>
              <Typography
                variant="subtitle2"
                component="p"
                sx={{ opacity: 0.8 }}
              >
                Satellite Imagery Analysis for Deforestation Prevention
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
        <Container component="main" sx={{ flexGrow: 1, mt: 2 }}>
          <MapGrid />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
