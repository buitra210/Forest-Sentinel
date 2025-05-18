import { useState, useEffect, useRef } from "react";
import "../styles/MapGrid.css";

// Tay Son, Hanoi, Vietnam coordinates
const TAY_SON_COORDINATES = {
  lat: 21.0245,
  lng: 105.8412,
};

const GRID_SIZE = 3; // 3x3 grid
const ZOOM_LEVEL = 15; // Default zoom level

// Map grid cell identifiers
const GRID_LABELS = [
  ["A1", "A2", "A3"],
  ["B1", "B2", "B3"],
  ["C1", "C2", "C3"],
];

// Define the grid cell interface
interface GridCell {
  id: string;
  coordinates: { x: number; y: number };
  center: { lat: number; lng: number };
  bounds: [[number, number], [number, number]];
  label: string;
}

// Calculate grid coordinates based on center point
const calculateGridCoordinates = (): GridCell[] => {
  const cellsPerSide = GRID_SIZE;
  const gridCells: GridCell[] = [];

  // Approximately 0.005 degrees covers a good area at zoom level 15
  const latStep = 0.005;
  const lngStep = 0.005;

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

const MapGrid = () => {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const detailMapRef = useRef<HTMLDivElement>(null);
  const detailMapInstanceRef = useRef<L.Map | null>(null);
  const analysisMapRef = useRef<HTMLDivElement>(null);
  const analysisMapInstanceRef = useRef<L.Map | null>(null);

  // Get the cell data for the selected cell
  const selectedCellData = gridCells.find((cell) => cell.id === selectedCell);

  // Initialize the main map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create the map instance
    const map = L.map(mapRef.current, {
      center: TAY_SON_COORDINATES,
      zoom: ZOOM_LEVEL,
      zoomControl: false, // Disable zoom to prevent changing the grid
      dragging: false, // Disable dragging to keep the map in place
      touchZoom: false, // Disable touch zoom
      scrollWheelZoom: false, // Disable scroll wheel zoom
      doubleClickZoom: false, // Disable double click zoom
      boxZoom: false, // Disable box zoom
      keyboard: false, // Disable keyboard navigation
    });

    // Add ESRI World Imagery basemap
    L.esri.basemapLayer("Imagery").addTo(map);

    mapInstanceRef.current = map;
    setMapLoaded(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle cell click
  const handleCellClick = (id: string) => {
    setSelectedCell(id);
  };

  // Handle close popup
  const handleClosePopup = () => {
    setSelectedCell(null);
  };

  // Initialize detail maps when a cell is selected
  useEffect(() => {
    if (!selectedCell || !detailMapRef.current || !analysisMapRef.current)
      return;

    const cellData = gridCells.find((cell) => cell.id === selectedCell);
    if (!cellData) return;

    // Create detail map (real satellite image)
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

    // Add ESRI World Imagery basemap
    L.esri.basemapLayer("Imagery").addTo(detailMap);
    detailMapInstanceRef.current = detailMap;

    // Create analysis map (processed image simulation)
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

    // Simulate a processed image by adding a colored overlay
    const deforestationRisk = Math.random();
    const riskColor =
      deforestationRisk > 0.5 ? "rgba(255, 0, 0, 0.3)" : "rgba(0, 255, 0, 0.3)";

    // Add a rectangle overlay to simulate processing
    L.rectangle(cellData.bounds, {
      color: deforestationRisk > 0.5 ? "#ff0000" : "#00ff00",
      weight: 2,
      fillColor: riskColor,
      fillOpacity: 0.4,
    }).addTo(analysisMap);

    analysisMapInstanceRef.current = analysisMap;

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
  }, [selectedCell]);

  // Group cells by row for display
  const rows = gridCells.reduce((acc, cell) => {
    const { y } = cell.coordinates;
    if (!acc[y]) acc[y] = [];
    acc[y].push(cell);
    return acc;
  }, {} as Record<number, typeof gridCells>);

  return (
    <div className="map-container">
      <div className="map-info">
        <h2>Tay Son Area, Hanoi - Satellite Imagery</h2>
        <p>
          Click on any grid cell to view detailed satellite imagery and
          analysis.
        </p>
      </div>

      <div className="grid-container">
        <div id="main-map" ref={mapRef} className="main-map"></div>

        {mapLoaded && (
          <div className="grid-overlay">
            {Object.entries(rows).map(([rowIndex, cells]) => (
              <div key={rowIndex} className="grid-row">
                {cells.map((cell) => (
                  <div
                    key={cell.id}
                    className="grid-cell"
                    onClick={() => handleCellClick(cell.id)}
                  >
                    <div className="cell-label">{cell.label}</div>
                    <div className="cell-overlay"></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCell && (
        <div className="detail-popup">
          <div className="popup-content">
            <button className="close-button" onClick={handleClosePopup}>
              ×
            </button>
            <h3>Grid Cell {selectedCellData?.label}</h3>

            <div className="image-comparison">
              <div className="image-container">
                <h4>Satellite Image</h4>
                <div
                  id="detail-map"
                  ref={detailMapRef}
                  className="detail-map"
                ></div>
              </div>

              <div className="image-container">
                <h4>Analysis Result</h4>
                <div
                  id="analysis-map"
                  ref={analysisMapRef}
                  className="analysis-map"
                ></div>
              </div>
            </div>

            <div className="analysis-data">
              <h4>Deforestation Risk Analysis</h4>
              <p>
                This area shows {Math.random() > 0.5 ? "high" : "low"} risk of
                deforestation based on our predictive model.
              </p>
              <p>Last updated: {new Date().toLocaleDateString()}</p>
              <p>
                Location: {selectedCellData?.center.lat.toFixed(4)}°N,{" "}
                {selectedCellData?.center.lng.toFixed(4)}°E
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapGrid;
