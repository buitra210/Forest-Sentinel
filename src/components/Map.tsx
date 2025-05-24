import { useEffect, useState, type MouseEvent } from "react";
import {
  Box,
  MenuItem,
  Typography,
  Slider,
  IconButton,
  Menu,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const gridRows = 8;
const gridCols = 6;

interface CombinedDataItem {
  rgb: string;
  mask: string;
  forestCoverage: Record<string, number>;
}

interface SelectedGrid {
  row: number;
  col: number;
  coverage: number;
  imageId: string;
}

const Map = () => {
  const navigate = useNavigate();

  const [combinedData, setCombinedData] = useState<
    Record<string, CombinedDataItem>
  >({});

  const [allYears, setAllYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");

  const [selectedGrid, setSelectedGrid] = useState<SelectedGrid | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);

  const [viewMode, setViewMode] = useState<"rgb" | "mask" | "overlay">("rgb");
  const [opacity, setOpacity] = useState<number>(50);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  const handleSelectViewMode = (mode: "rgb" | "mask" | "overlay") => {
    setViewMode(mode);
    setAnchorEl(null);
  };

  const fetchCombinedData = async () => {
    try {
      const response = await axios.get<
        Record<
          string,
          { mask: string; rgb: string; forestCoverage: Record<string, number> }
        >
      >("http://localhost:3000/api/cloudinary/images");
      const results = response.data;
      setCombinedData(results);

      const allDates = Object.keys(results).sort().reverse();
      const years = Array.from(
        new Set(allDates.map((d) => d.slice(0, 4)))
      ).sort((a, b) => Number(b) - Number(a));
      setAllYears(years);

      if (years.length > 0) {
        setSelectedYear(years[0]);
      }
    } catch (error) {
      console.error("Error fetching combined data:", error);
    }
  };

  const handleGridClick = (row: number, col: number, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const datesOfYear = Object.keys(combinedData)
      .filter((d) => d.startsWith(selectedYear))
      .sort()
      .reverse();
    const latestDate = datesOfYear.length > 0 ? datesOfYear[0] : "";
    if (!latestDate) return;

    const coverageMap = combinedData[latestDate]?.forestCoverage || {};
    const gridKey = `${col},${row}`; // Lưu ý: col,x trước, row,y sau
    const coverage = coverageMap[gridKey] ?? 0;

    setSelectedGrid({
      row,
      col,
      coverage,
      imageId: latestDate,
    });
    setPopupOpen(true);
  };

  const handleSeeDetails = () => {
    if (selectedGrid) {
      navigate(
        `/grid-detail/${selectedGrid.imageId}/${selectedGrid.col}/${selectedGrid.row}`
      );
    }
    setPopupOpen(false);
  };

  const handleCompare = () => {
    navigate("/compare");
    setPopupOpen(false);
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
    setSelectedGrid(null);
  };

  useEffect(() => {
    fetchCombinedData();
  }, []);

  if (allYears.length === 0 || !selectedYear) {
    return <Typography>Loading images...</Typography>;
  }

  const datesOfYear = Object.keys(combinedData)
    .filter((d) => d.startsWith(selectedYear))
    .sort()
    .reverse();
  const latestDate = datesOfYear.length > 0 ? datesOfYear[0] : "";
  const selectedItem: CombinedDataItem | null = latestDate
    ? combinedData[latestDate] || null
    : null;

  const yearIndex = allYears.indexOf(selectedYear);
  const goPrevYear = () => {
    if (yearIndex < allYears.length - 1) {
      setSelectedYear(allYears[yearIndex + 1]);
    }
  };
  const goNextYear = () => {
    if (yearIndex > 0) {
      setSelectedYear(allYears[yearIndex - 1]);
    }
  };
  const handleYearDropdownChange = (year: string) => {
    setSelectedYear(year);
  };
  const viewModeLabel = () => {
    if (viewMode === "rgb") return "RGB";
    if (viewMode === "mask") return "Mask";
    return "Overlay";
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton
          onClick={goPrevYear}
          disabled={yearIndex >= allYears.length - 1}
        >
          <ArrowBackIosNewIcon />
        </IconButton>

        <Typography variant="h6" sx={{ minWidth: 80, textAlign: "center" }}>
          {selectedYear}
        </Typography>

        <IconButton onClick={goNextYear} disabled={yearIndex <= 0}>
          <ArrowForwardIosIcon />
        </IconButton>

        <FormControl size="small" sx={{ minWidth: 100, ml: 2 }}>
          <InputLabel id="year-select-label">Year</InputLabel>
          <Select
            labelId="year-select-label"
            value={selectedYear}
            label="Year"
            onChange={(e) => handleYearDropdownChange(e.target.value as string)}
          >
            {allYears.map((yr) => (
              <MenuItem key={yr} value={yr}>
                {yr}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box
          sx={{
            marginLeft: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <VisibilityIcon />
            <Typography sx={{ ml: 1 }}>{viewModeLabel()}</Typography>
            <IconButton onClick={handleOpenMenu}>
              <ArrowDropDownIcon />
            </IconButton>
          </Box>
          <Box>
            {viewMode === "overlay" && (
              <Box width={250} mb={2}>
                <Typography gutterBottom>Opacity: {opacity}%</Typography>
                <Slider
                  value={opacity}
                  onChange={(e, val) => setOpacity(val as number)}
                  min={0}
                  max={100}
                />
              </Box>
            )}
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={handleCloseMenu}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <MenuItem
              selected={viewMode === "rgb"}
              onClick={() => handleSelectViewMode("rgb")}
            >
              RGB
            </MenuItem>
            <MenuItem
              selected={viewMode === "mask"}
              onClick={() => handleSelectViewMode("mask")}
            >
              Mask
            </MenuItem>
            <MenuItem
              selected={viewMode === "overlay"}
              onClick={() => handleSelectViewMode("overlay")}
            >
              Overlay (Mask + RGB)
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mt: 2,
          justifyContent: "space-between",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "600px",
            aspectRatio: "1372 / 1655",
            position: "relative",
            border: "1px solid #ccc",
            overflow: "hidden",
            mx: "auto",
          }}
        >
          {/* Nếu không có ảnh nào trong năm đó */}
          {!latestDate && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(0,0,0,0.1)",
              }}
            >
              <Typography>No images in {selectedYear}</Typography>
            </Box>
          )}

          {viewMode !== "overlay" && latestDate && selectedItem && (
            <img
              src={viewMode === "rgb" ? selectedItem.rgb : selectedItem.mask}
              alt={`${viewMode === "rgb" ? "RGB" : "Mask"}  ${selectedYear}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />
          )}

          {viewMode === "overlay" && latestDate && selectedItem && (
            <>
              <img
                src={selectedItem.rgb}
                alt={`RGB ${selectedYear}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              />
              <img
                src={selectedItem.mask}
                alt={`Mask ${selectedYear}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  opacity: opacity / 100,
                }}
              />
            </>
          )}

          {[...Array(gridRows)].map((_, row) =>
            [...Array(gridCols)].map((_, col) => (
              <Box
                key={`${row}-${col}`}
                sx={{
                  position: "absolute",
                  top: `${(row * 100) / gridRows}%`,
                  left: `${(col * 100) / gridCols}%`,
                  width: `${100 / gridCols}%`,
                  height: `${100 / gridRows}%`,
                  border: "1px solid rgba(255,255,255,0.4)",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.3)",
                    border: "2px solid rgba(255,255,255,0.8)",
                    zIndex: 10,
                  },
                  "&:active": {
                    backgroundColor: "rgba(255,255,255,0.5)",
                  },
                }}
                onClick={(event) => handleGridClick(row, col, event)}
              />
            ))
          )}
        </Box>
      </Box>

      <Dialog open={popupOpen} onClose={handleClosePopup}>
        <DialogTitle>
          Grid: Row{" "}
          {selectedGrid?.row !== undefined ? selectedGrid.row + 1 : ""}, Column{" "}
          {selectedGrid?.col !== undefined ? selectedGrid.col + 1 : ""}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Forest Coverage: {selectedGrid?.coverage.toFixed(2)}%
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePopup}>Cancel</Button>
          <Button onClick={handleCompare} variant="outlined">
            Compare
          </Button>
          <Button onClick={handleSeeDetails} variant="contained">
            See Details
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Map;
