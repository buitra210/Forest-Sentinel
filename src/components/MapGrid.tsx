import { useState, useEffect, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Modal,
  Divider,
  Card,
  CardContent,
  IconButton,
  Container,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import MapIcon from "@mui/icons-material/Map";

// Tay Son, Hanoi, Vietnam coordinates
const TAY_SON_COORDINATES = {
  lat: 21.0245,
  lng: 105.8412,
};

const GRID_SIZE = 5;
const ZOOM_LEVEL = 15;
const BASE_CELL_SIZE_DEGREES = 0.003;

const GRID_LABELS = [
  ["A1", "A2", "A3", "A4", "A5"],
  ["B1", "B2", "B3", "B4", "B5"],
  ["C1", "C2", "C3", "C4", "C5"],
  ["D1", "D2", "D3", "D4", "D5"],
  ["E1", "E2", "E3", "E4", "E5"],
];

interface GridCell {
  id: string;
  coordinates: { x: number; y: number };
  center: { lat: number; lng: number };
  bounds: [[number, number], [number, number]];
  label: string;
}

const calculateGridCoordinates = (): GridCell[] => {
  const cellsPerSide = GRID_SIZE;
  const gridCells: GridCell[] = [];

  // Điều chỉnh hệ số cho kinh độ để có grid vuông (dựa vào cosine của vĩ độ)
  // Tại vĩ độ gần xích đạo, 1 độ kinh tuyến ≈ 1 độ vĩ tuyến * cos(vĩ độ)
  const latRadians = TAY_SON_COORDINATES.lat * (Math.PI / 180);
  const lngCorrectionFactor = 1 / Math.cos(latRadians);

  const latStep = BASE_CELL_SIZE_DEGREES;
  const lngStep = BASE_CELL_SIZE_DEGREES * lngCorrectionFactor;

  const startLat = TAY_SON_COORDINATES.lat + (latStep * (cellsPerSide - 1)) / 2;
  const startLng = TAY_SON_COORDINATES.lng - (lngStep * (cellsPerSide - 1)) / 2;

  for (let row = 0; row < cellsPerSide; row++) {
    for (let col = 0; col < cellsPerSide; col++) {
      gridCells.push({
        id: `${row * cellsPerSide + col + 1}`,
        coordinates: {
          x: col,
          y: row,
        },
        center: {
          lat: startLat - row * latStep,
          lng: startLng + col * lngStep,
        },
        bounds: [
          [
            startLat - row * latStep - latStep / 2,
            startLng + col * lngStep - lngStep / 2,
          ],
          [
            startLat - row * latStep + latStep / 2,
            startLng + col * lngStep + lngStep / 2,
          ],
        ],
        label: GRID_LABELS[row][col],
      });
    }
  }

  return gridCells;
};

const gridCells = calculateGridCoordinates();

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "95%", sm: "90%", md: "85%", lg: "80%" },
  maxWidth: 1000,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: "90vh",
  overflow: "auto",
} as const;

const MapGrid = () => {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const detailMapRef = useRef<HTMLDivElement>(null);
  const detailMapInstanceRef = useRef<L.Map | null>(null);
  const analysisMapRef = useRef<HTMLDivElement>(null);
  const analysisMapInstanceRef = useRef<L.Map | null>(null);
  const [riskLevel, setRiskLevel] = useState<"high" | "low">("low");

  // Get the cell data for the selected cell
  const selectedCellData = gridCells.find((cell) => cell.id === selectedCell);

  // Initialize the main map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const map = L.map(mapRef.current, {
        center: TAY_SON_COORDINATES,
        zoom: ZOOM_LEVEL,
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      L.esri.basemapLayer("Imagery").addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleCellClick = (id: string) => {
    setSelectedCell(id);
    const hash = id.charCodeAt(0);
    setRiskLevel(hash % 2 === 0 ? "high" : "low");
  };

  const handleClosePopup = () => {
    setSelectedCell(null);
  };

  useEffect(() => {
    if (!selectedCell || !detailMapRef.current || !analysisMapRef.current)
      return;

    try {
      const cellData = gridCells.find((cell) => cell.id === selectedCell);
      if (!cellData) return;

      if (detailMapInstanceRef.current) {
        detailMapInstanceRef.current.remove();
      }

      const detailMap = L.map(detailMapRef.current, {
        center: cellData.center,
        zoom: ZOOM_LEVEL + 1,
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      L.esri.basemapLayer("Imagery").addTo(detailMap);
      detailMapInstanceRef.current = detailMap;

      if (analysisMapInstanceRef.current) {
        analysisMapInstanceRef.current.remove();
      }

      const analysisMap = L.map(analysisMapRef.current, {
        center: cellData.center,
        zoom: ZOOM_LEVEL + 1,
        zoomControl: false,
        dragging: false,
        touchZoom: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      // Add a modified version of the ESRI imagery for demo purposes
      // In a real application, this would be your processed/analyzed image
      const analysisLayer = L.esri.basemapLayer("Imagery");
      analysisLayer.addTo(analysisMap);

      const deforestationRisk = riskLevel === "high";
      const riskColor = deforestationRisk
        ? "rgba(255, 0, 0, 0.3)"
        : "rgba(0, 255, 0, 0.3)";

      L.rectangle(cellData.bounds, {
        color: deforestationRisk ? "#ff0000" : "#00ff00",
        weight: 2,
        fillColor: riskColor,
        fillOpacity: 0.4,
      }).addTo(analysisMap);

      analysisMapInstanceRef.current = analysisMap;
    } catch (error) {
      console.error("Error initializing detail maps:", error);
    }

    return () => {
      if (detailMapInstanceRef.current) {
        detailMapInstanceRef.current.remove();
        detailMapInstanceRef.current = null;
      }
      if (analysisMapInstanceRef.current) {
        analysisMapInstanceRef.current.remove();
        analysisMapInstanceRef.current = null;
      }
    };
  }, [selectedCell, riskLevel]);

  // Group cells by row for display
  const rows = gridCells.reduce((acc, cell) => {
    const { y } = cell.coordinates;
    if (!acc[y]) acc[y] = [];
    acc[y].push(cell);
    return acc;
  }, {} as Record<number, typeof gridCells>);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Tay Son Area, Hanoi - Satellite Imagery
        </Typography>
        <Typography variant="body1" paragraph align="center">
          Interactive 5x5 grid map of Tay Son region. Click on any cell to view
          detailed analysis.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Displaying real-time ESRI World Imagery with 25 analysis cells for
            precise deforestation monitoring.
          </Typography>
        </Alert>
      </Paper>

      <Paper
        elevation={3}
        sx={{
          position: "relative",
          width: "100%",
          height: 0,
          paddingBottom: "100%",
          overflow: "hidden",
          borderRadius: 2,
          "@media (min-width: 600px)": {
            paddingBottom: "85%",
          },
          "@media (min-width: 960px)": {
            paddingBottom: "75%",
          },
        }}
      >
        <Box
          ref={mapRef}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
          }}
        />

        {mapLoaded && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {Object.entries(rows).map(([rowIndex, cells]) => (
              <Grid container key={rowIndex} sx={{ flex: 1 }} spacing={0}>
                {cells.map((cell) => (
                  <Grid
                    item
                    xs={12 / GRID_SIZE}
                    key={cell.id}
                    sx={{
                      position: "relative",
                      border: "2px solid rgba(255, 255, 255, 0.7)",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.3)",
                      },
                      height: "100%",
                      display: "flex",
                      alignItems: "stretch",
                    }}
                    onClick={() => handleCellClick(cell.id)}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: 2,
                        left: 2,
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        color: "white",
                        padding: { xs: "2px 4px", sm: "3px 6px" },
                        borderRadius: 1,
                        fontWeight: "bold",
                        zIndex: 2,
                        fontSize: { xs: "10px", sm: "12px", md: "14px" },
                      }}
                    >
                      {cell.label}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ))}
          </Box>
        )}
      </Paper>

      <Modal
        open={selectedCell !== null}
        onClose={handleClosePopup}
        aria-labelledby="detail-modal-title"
      >
        <Box sx={modalStyle}>
          <IconButton
            aria-label="close"
            onClick={handleClosePopup}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "grey.500",
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography
            id="detail-modal-title"
            variant="h5"
            component="h2"
            gutterBottom
          >
            <MapIcon sx={{ mr: 1, verticalAlign: "middle" }} />
            Grid Cell {selectedCellData?.label}
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Satellite Image
                  </Typography>
                  <Box
                    ref={detailMapRef}
                    sx={{
                      width: "100%",
                      aspectRatio: "1/1",
                      borderRadius: 1,
                      overflow: "hidden",
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Analysis Result
                  </Typography>
                  <Box
                    ref={analysisMapRef}
                    sx={{
                      width: "100%",
                      aspectRatio: "1/1",
                      borderRadius: 1,
                      overflow: "hidden",
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mt: 3, bgcolor: "background.default" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <InfoIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                Deforestation Risk Analysis
              </Typography>
              <Typography variant="body1" paragraph>
                This area shows {riskLevel} risk of deforestation based on our
                predictive model.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Last updated: {new Date().toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Location: {selectedCellData?.center.lat.toFixed(4)}°N,{" "}
                    {selectedCellData?.center.lng.toFixed(4)}°E
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Modal>
    </Container>
  );
};

export default MapGrid;
