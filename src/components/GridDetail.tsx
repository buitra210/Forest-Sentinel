import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  useTheme,
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
  const theme = useTheme();

  const [combinedData, setCombinedData] = useState<
    Record<string, CombinedDataItem>
  >({});
  const [loading, setLoading] = useState(true);

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
      >("http://localhost:3000/api/cloudinary/images");
      setCombinedData(response.data);
    } catch (error) {
      console.error("Error fetching combined data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const selectedItem: CombinedDataItem | undefined = combinedData[imageId];
  const gridKey = `${col},${row}`;
  const maskKey = `${col}_${row}`;

  const coverageSelected = selectedItem?.forestCoverage?.[gridKey] ?? 0;
  const year2019Keys = Object.keys(combinedData).filter((key) =>
    key.startsWith("2019")
  );
  const latest2019Key =
    year2019Keys.length > 0 ? year2019Keys.sort().reverse()[0] : null;
  const coverage2019 = latest2019Key
    ? combinedData[latest2019Key]?.forestCoverage?.[gridKey] ?? 100
    : 100;

  const diff = (coverage2019 - coverageSelected).toFixed(3);
  console.log(diff);

  const yearChosen = imageId.slice(0, 4);

  const chartData = [
    { name: "2019", coverage: Number(coverage2019.toFixed(2)) },
    { name: yearChosen, coverage: Number(coverageSelected.toFixed(2)) },
  ];
  console.log(chartData);
  const gridMask = selectedItem?.masks?.[maskKey];
  const gridMask2019 = latest2019Key
    ? combinedData[latest2019Key]?.masks?.[maskKey]
    : null;
  console.log(gridMask);

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => navigate("/")} sx={{ mb: 2 }} variant="outlined">
        ← Back to Map
      </Button>
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Forest — Row {parseInt(row) + 1}, Column {parseInt(col) + 1}
        </Typography>
        <Typography variant="h6" sx={{ mb: 1, color: "error.main" }}>
          The {yearChosen} coverage was {coverageSelected}%, which is a {diff}%
          decrease compared to 2019.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ flex: 1, maxWidth: 360 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Mask Image (2019)
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
            {gridMask2019 ? (
              <img
                src={gridMask2019}
                alt={`Grid Mask 2019 Row ${parseInt(row) + 1}, Column ${
                  parseInt(col) + 1
                }`}
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
                <Typography>No 2019 grid mask available</Typography>
              </Box>
            )}
          </Box>
        </Box>
        <Box sx={{ flex: 1, maxWidth: 360 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Mask Image ({yearChosen})
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
            {gridMask ? (
              <img
                src={gridMask}
                alt={`Grid Mask Row ${parseInt(row) + 1}, Column ${
                  parseInt(col) + 1
                }`}
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
      <Box sx={{ width: "100%", height: 300, mb: 4, mt: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Forest condition comparison chart with 2019
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[80, 100]} unit="%" />
            <Tooltip formatter={(value: unknown) => `${value}%`} />
            <Bar
              dataKey="coverage"
              fill={theme.palette.primary.main}
              barSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default GridDetail;
