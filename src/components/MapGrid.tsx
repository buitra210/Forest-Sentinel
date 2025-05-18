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

const REGION_BOUNDS = {
  west: 105.43,
  south: 21.06,
  east: 105.53,
  north: 21.16,
};

const CENTER_COORDINATES = {
  lat: (REGION_BOUNDS.north + REGION_BOUNDS.south) / 2,
  lng: (REGION_BOUNDS.east + REGION_BOUNDS.west) / 2,
};

const GRID_SIZE = 5;
const ZOOM_LEVEL = 14; // Điều chỉnh zoom level phù hợp với khu vực Sơn Tây
const BASE_CELL_SIZE_DEGREES = 0.015; // Điều chỉnh kích thước ô cho phù hợp với khu vực

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

  const latRadians = CENTER_COORDINATES.lat * (Math.PI / 180);
  const lngCorrectionFactor = 1 / Math.cos(latRadians);

  // Kích thước ô theo vĩ độ và kinh độ
  const latStep = BASE_CELL_SIZE_DEGREES;
  const lngStep = BASE_CELL_SIZE_DEGREES * lngCorrectionFactor;

  const startLat = CENTER_COORDINATES.lat + (latStep * (cellsPerSide - 1)) / 2;
  const startLng = CENTER_COORDINATES.lng - (lngStep * (cellsPerSide - 1)) / 2;

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

  const selectedCellData = gridCells.find((cell) => cell.id === selectedCell);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const map = L.map(mapRef.current, {
        center: CENTER_COORDINATES,
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Sơn Tây Forest Monitoring
        </Typography>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Khu vực giám sát: {REGION_BOUNDS.west.toFixed(4)}°E đến{" "}
            {REGION_BOUNDS.east.toFixed(4)}°E, {REGION_BOUNDS.south.toFixed(4)}
            °N đến {REGION_BOUNDS.north.toFixed(4)}°N
          </Typography>
        </Alert>
      </Paper>

      <Paper
        elevation={3}
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "1/1", // Đảm bảo container là hình vuông
          maxHeight: "800px",
          overflow: "hidden",
          borderRadius: 2,
          margin: "0 auto",
          "@media (min-width: 600px)": {
            width: "90%", // Thu nhỏ kích thước trên màn hình lớn để dễ nhìn
          },
          "@media (min-width: 960px)": {
            width: "80%",
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
              display: "grid",
              gridTemplateRows: "repeat(5, 1fr)",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 0,
            }}
          >
            {gridCells.map((cell) => (
              <Box
                key={cell.id}
                sx={{
                  position: "relative",
                  border: "2px solid rgba(255, 255, 255, 0.7)",
                  cursor: "pointer",
                  width: "100%",
                  height: "100%",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    transform: "scale(0.97)",
                    zIndex: 10,
                  },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gridRow: Math.floor((parseInt(cell.id) - 1) / GRID_SIZE) + 1,
                  gridColumn: ((parseInt(cell.id) - 1) % GRID_SIZE) + 1,
                  overflow: "hidden",
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
              </Box>
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
            <MapIcon sx={{ mr: 1, verticalAlign: "middle" }} />Ô phân tích{" "}
            {selectedCellData?.label}
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Ảnh vệ tinh
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
                    Kết quả phân tích
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
                Phân tích nguy cơ phá rừng
              </Typography>
              <Typography variant="body1" paragraph>
                Khu vực này có mức độ rủi ro{" "}
                {riskLevel === "high" ? "cao" : "thấp"} về phá rừng dựa trên mô
                hình dự đoán của chúng tôi.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Cập nhật lần cuối: {new Date().toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Vị trí: {selectedCellData?.center.lat.toFixed(4)}°B,{" "}
                    {selectedCellData?.center.lng.toFixed(4)}°Đ
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
