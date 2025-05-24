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
  forestCoverage2017: Record<string, number>;
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
            forestCoverage2017: Record<string, number>;
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

  const coverageSelected = selectedItem?.forestCoverage?.[gridKey] ?? 0;
  const coverage2017 = selectedItem?.forestCoverage2017?.[gridKey] ?? 100;

  const diff = coverage2017 - coverageSelected;
  console.log(diff);
  const showWarning = diff > 1;

  const yearChosen = imageId.slice(0, 4);

  const chartData = [
    { name: "2017", coverage: Number(coverage2017.toFixed(2)) },
    { name: yearChosen, coverage: Number(coverageSelected.toFixed(2)) },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={() => navigate("/")} sx={{ mb: 2 }} variant="outlined">
        ← Back to Map
      </Button>
      <Box>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Tay Son Forest — Row {parseInt(row) + 1}, Column {parseInt(col) + 1}
        </Typography>

        {showWarning && (
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              color: theme.palette.error.main,
              fontWeight: "bold",
            }}
          >
            ⚠️ At risk of deforestation (forest area in 2025 will decrease by
            more than 3% compared to 2017)
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            RGB Image
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
            {selectedItem?.rgb ? (
              <img
                src={selectedItem.rgb}
                alt="RGB"
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
                <Typography>No RGB image available</Typography>
              </Box>
            )}
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Mask Image
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
            {selectedItem?.mask ? (
              <img
                src={selectedItem.mask}
                alt="Mask"
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
                <Typography>No mask image available</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      <Box sx={{ width: "100%", height: 300, mb: 4, mt: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Forest condition comparison chart with 2017
        </Typography>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[90, 100]} unit="%" />
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
