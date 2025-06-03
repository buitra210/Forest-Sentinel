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

const gridRows = 11;
const gridCols = 13;

const REGIONS = [
  "BaVi",
  "SocSon",
  "MyDuc",
  "ChuongMy",
  "QuocOai",
  "ThachThat",
  "SonTay",
];

// Month names in Vietnamese
const MONTHS = [
  { value: "01", label: "Tháng 1" },
  { value: "02", label: "Tháng 2" },
  { value: "03", label: "Tháng 3" },
  { value: "04", label: "Tháng 4" },
  { value: "05", label: "Tháng 5" },
  { value: "06", label: "Tháng 6" },
  { value: "07", label: "Tháng 7" },
  { value: "08", label: "Tháng 8" },
  { value: "09", label: "Tháng 9" },
  { value: "10", label: "Tháng 10" },
  { value: "11", label: "Tháng 11" },
  { value: "12", label: "Tháng 12" },
];

interface CombinedDataItem {
  rgb: string;
  mask: string;
  masks: Record<string, string>;
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
  const [allMonths, setAllMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("SonTay");

  const [selectedGrid, setSelectedGrid] = useState<SelectedGrid | null>(null);
  console.log(selectedGrid);
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
          {
            mask: string;
            rgb: string;
            masks: Record<string, string>;
            forestCoverage: Record<string, number>;
          }
        >
      >(
        `http://localhost:3000/api/cloudinary/images?region=${encodeURIComponent(
          selectedRegion
        )}`
      );
      const results = response.data;
      setCombinedData(results);

      const allDates = Object.keys(results).sort().reverse();
      const years = Array.from(
        new Set(allDates.map((d) => d.slice(0, 4)))
      ).sort((a, b) => Number(b) - Number(a));
      setAllYears(years);

      // Extract months from available dates for the selected year
      const monthsSet = new Set<string>();
      allDates.forEach((date) => {
        if (date.length >= 7) {
          // Format: YYYY-MM-DD or YYYY-MM
          const month = date.slice(5, 7);
          monthsSet.add(month);
        }
      });
      const monthsList = Array.from(monthsSet).sort();
      setAllMonths(monthsList);

      if (years.length > 0 && !selectedYear) {
        setSelectedYear(years[0]);
      }
      if (monthsList.length > 0 && !selectedMonth) {
        setSelectedMonth(monthsList[monthsList.length - 1]); // Default to latest month
      }
    } catch (error) {
      console.error("Error fetching combined data:", error);
    }
  };

  const handleGridClick = (row: number, col: number, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const datesOfYearMonth = Object.keys(combinedData)
      .filter(
        (d) => d.startsWith(selectedYear) && d.slice(5, 7) === selectedMonth
      )
      .sort()
      .reverse();
    const latestDate = datesOfYearMonth.length > 0 ? datesOfYearMonth[0] : "";
    if (!latestDate) return;

    const coverageMap = combinedData[latestDate]?.forestCoverage || {};
    const gridKey = `${col},${row}`; // API format: col,row
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
        `/grid-detail/${selectedGrid.imageId}/${selectedGrid.col}/${
          selectedGrid.row
        }?region=${encodeURIComponent(selectedRegion)}`
      );
    }
    setPopupOpen(false);
  };

  const handleCompare = () => {
    navigate(`/compare?region=${encodeURIComponent(selectedRegion)}`);
    setPopupOpen(false);
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
    setSelectedGrid(null);
  };

  useEffect(() => {
    fetchCombinedData();
  }, [selectedRegion]);

  if (allYears.length === 0 || !selectedYear) {
    return <Typography>Loading images...</Typography>;
  }

  const datesOfYearMonth = Object.keys(combinedData)
    .filter(
      (d) => d.startsWith(selectedYear) && d.slice(5, 7) === selectedMonth
    )
    .sort()
    .reverse();
  const latestDate = datesOfYearMonth.length > 0 ? datesOfYearMonth[0] : "";
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

  const handleMonthDropdownChange = (month: string) => {
    setSelectedMonth(month);
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
  };

  const viewModeLabel = () => {
    if (viewMode === "rgb") return "RGB";
    if (viewMode === "mask") return "Mask";
    return "Overlay";
  };

  return (
    <Box>
      {/* Region Selection */}
      <Box sx={{ mb: 2 }}>
        <FormControl size="medium" sx={{ minWidth: 200 }}>
          <InputLabel id="region-select-label">Khu vực</InputLabel>
          <Select
            labelId="region-select-label"
            value={selectedRegion}
            label="Khu vực"
            onChange={(e) => handleRegionChange(e.target.value as string)}
          >
            {REGIONS.map((region) => (
              <MenuItem key={region} value={region}>
                {region}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Time Controls */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel id="year-select-label">Năm</InputLabel>
            <Select
              labelId="year-select-label"
              value={selectedYear}
              label="Năm"
              onChange={(e) =>
                handleYearDropdownChange(e.target.value as string)
              }
            >
              {allYears.map((yr) => (
                <MenuItem key={yr} value={yr}>
                  {yr}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="month-select-label">Tháng</InputLabel>
            <Select
              labelId="month-select-label"
              value={selectedMonth}
              label="Tháng"
              onChange={(e) =>
                handleMonthDropdownChange(e.target.value as string)
              }
            >
              {allMonths.map((month) => {
                const monthObj = MONTHS.find((m) => m.value === month);
                return (
                  <MenuItem key={month} value={month}>
                    {monthObj ? monthObj.label : `Tháng ${parseInt(month)}`}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>

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
            aspectRatio: "13 / 11",
            position: "relative",
            border: "1px solid #ccc",
            overflow: "hidden",
            mx: "auto",
          }}
        >
          {/* Nếu không có ảnh nào trong tháng đó */}
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
              <Typography>
                Không có ảnh cho {selectedRegion} -{" "}
                {MONTHS.find((m) => m.value === selectedMonth)?.label}{" "}
                {selectedYear}
              </Typography>
            </Box>
          )}

          {viewMode !== "overlay" && latestDate && selectedItem && (
            <img
              src={viewMode === "rgb" ? selectedItem.rgb : selectedItem.mask}
              alt={`${
                viewMode === "rgb" ? "RGB" : "Mask"
              } ${selectedRegion} ${selectedYear} ${
                MONTHS.find((m) => m.value === selectedMonth)?.label
              }`}
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
                alt={`RGB ${selectedRegion} ${selectedYear}`}
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
                alt={`Mask ${selectedRegion} ${selectedYear}`}
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

          {/* Grid overlay - 11 hàng, 13 cột */}
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
          Grid: Column{" "}
          {selectedGrid?.col !== undefined ? selectedGrid.col + 1 : ""}, Row{" "}
          {selectedGrid?.row !== undefined ? selectedGrid.row + 1 : ""}
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
