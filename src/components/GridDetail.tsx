import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CombinedDataItem {
  rgb: string;
  mask: string;
  masks: Record<string, string>;
  forestCoverage: Record<string, number>;
}

const GridDetail = () => {
  const { imageId, col, row } = useParams<{
    imageId: string;
    col: string;
    row: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const region = searchParams.get("region") || "SonTay";
  const theme = useTheme();

  const [combinedData, setCombinedData] = useState<
    Record<string, CombinedDataItem>
  >({});
  const [loading, setLoading] = useState(true);

  // State for date comparison
  const [selectedDate1, setSelectedDate1] = useState<string>(imageId || "");
  const [selectedDate2, setSelectedDate2] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get<
        Record<
          string,
          {
            rgb: string;
            mask: string;
            masks: Record<string, string>;
            forestCoverage: Record<string, number>;
          }
        >
      >(
        `http://localhost:3000/api/cloudinary/images?region=${encodeURIComponent(
          region
        )}`
      );
      const data = response.data;
      setCombinedData(data);

      // Set available dates
      const dates = Object.keys(data).sort();
      setAvailableDates(dates);

      // Set default dates if not already set
      if (imageId && !selectedDate1) {
        setSelectedDate1(imageId);
      }
      if (!selectedDate2 && dates.length > 1) {
        // Default to earliest available date as comparison
        setSelectedDate2(dates[0]);
      }
    } catch (error) {
      console.error("Error fetching combined data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [region]);

  // Update selectedDate1 when imageId changes
  useEffect(() => {
    if (imageId) {
      setSelectedDate1(imageId);
    }
  }, [imageId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!imageId || col == null || row == null) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Invalid grid parameters
        </Typography>
        <Button onClick={() => navigate("/")} sx={{ mt: 2 }} variant="outlined">
          ← Back to Map
        </Button>
      </Box>
    );
  }

  // Get data for selected dates
  const selectedItem1 = combinedData[selectedDate1];
  const selectedItem2 = combinedData[selectedDate2];

  const gridKey = `${col},${row}`; // For forestCoverage: "col,row" format
  const maskKey = `${col}_${row}`; // For masks: "col_row" format

  const coverage1 = selectedItem1?.forestCoverage?.[gridKey] ?? 0;
  const coverage2 = selectedItem2?.forestCoverage?.[gridKey] ?? 0;

  const diff = (coverage1 - coverage2).toFixed(3);

  const chartData = [
    { name: selectedDate2 || "Date 2", coverage: Number(coverage2.toFixed(2)) },
    { name: selectedDate1 || "Date 1", coverage: Number(coverage1.toFixed(2)) },
  ];

  const gridMask1 = selectedItem1?.masks?.[maskKey];
  const gridMask2 = selectedItem2?.masks?.[maskKey];

  const canCompare =
    selectedDate1 && selectedDate2 && selectedDate1 !== selectedDate2;

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => navigate("/")} sx={{ mb: 2 }} variant="outlined">
        ← Back to Map
      </Button>

      <Box>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Forest — {region}
        </Typography>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Column {parseInt(col) + 1}, Row {parseInt(row) + 1}
        </Typography>
      </Box>

      {/* Date Selection */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="date1-select-label">Ngày 1</InputLabel>
          <Select
            labelId="date1-select-label"
            value={selectedDate1}
            label="Ngày 1"
            onChange={(e) => setSelectedDate1(e.target.value)}
          >
            {availableDates.map((date) => (
              <MenuItem key={date} value={date}>
                {date}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="date2-select-label">Ngày 2</InputLabel>
          <Select
            labelId="date2-select-label"
            value={selectedDate2}
            label="Ngày 2"
            onChange={(e) => setSelectedDate2(e.target.value)}
          >
            <MenuItem value="">
              <em>Chọn ngày để so sánh</em>
            </MenuItem>
            {availableDates.map((date) => (
              <MenuItem key={date} value={date}>
                {date}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Comparison Results */}
      {canCompare && (
        <Typography
          variant="h6"
          sx={{
            mb: 1,
            color: coverage1 > coverage2 ? "success.main" : "error.main",
          }}
        >
          So sánh: {selectedDate1} có {coverage1.toFixed(2)}% so với{" "}
          {selectedDate2} có {coverage2.toFixed(2)}%
          {coverage1 !== coverage2 && (
            <>
              {" - "}
              {coverage1 > coverage2 ? "Tăng" : "Giảm"}{" "}
              {Math.abs(parseFloat(diff))}%
            </>
          )}
        </Typography>
      )}

      {!canCompare && (
        <Typography variant="h6" sx={{ mb: 1, color: "warning.main" }}>
          Vui lòng chọn 2 ngày khác nhau để so sánh
        </Typography>
      )}

      {/* Mask Images */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexWrap: "wrap",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box sx={{ flex: 1, maxWidth: 360 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Mask Image - {selectedDate2 || "Ngày 2"}
          </Typography>
          <Box
            sx={{
              width: "100%",
              aspectRatio: "1",
              border: "1px solid #ccc",
              overflow: "hidden",
              borderRadius: 1,
            }}
          >
            {gridMask2 && selectedDate2 ? (
              <img
                src={gridMask2}
                alt={`Grid Mask ${selectedDate2} Column ${
                  parseInt(col) + 1
                }, Row ${parseInt(row) + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.1)",
                }}
              >
                <Typography>Chọn ngày 2 để hiển thị ảnh</Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ flex: 1, maxWidth: 360 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Mask Image - {selectedDate1}
          </Typography>
          <Box
            sx={{
              width: "100%",
              aspectRatio: "1",
              border: "1px solid #ccc",
              overflow: "hidden",
              borderRadius: 1,
            }}
          >
            {gridMask1 ? (
              <img
                src={gridMask1}
                alt={`Grid Mask ${selectedDate1} Column ${
                  parseInt(col) + 1
                }, Row ${parseInt(row) + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.1)",
                }}
              >
                <Typography>No grid mask available</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Chart */}
      {canCompare && (
        <Box sx={{ width: "100%", height: 300, mb: 4, mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            So sánh độ che phủ rừng
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[40, 100]} unit="%" />
              <Tooltip formatter={(value: unknown) => `${value}%`} />
              <Bar
                dataKey="coverage"
                fill={theme.palette.primary.main}
                barSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
};

export default GridDetail;
