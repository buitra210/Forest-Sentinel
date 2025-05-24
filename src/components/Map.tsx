import { useEffect, useState } from "react";
import { Box, MenuItem, Select, Typography, Slider } from "@mui/material";
import axios from "axios";

const gridRows = 8;
const gridCols = 6;

const Map = () => {
  const [imageUrls, setImageUrls] = useState<Record<string, { rgb?: string; mask?: string }>>({});
  const [selectedDate, setSelectedDate] = useState("");
  const [viewMode, setViewMode] = useState<"rgb" | "mask" | "overlay">("rgb");
  const [opacity, setOpacity] = useState<number>(50);

  const fetchImagesFromBackend = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/cloudinary/images");
      const results = response.data;
      setImageUrls(results);
      if (Object.keys(results).length > 0) {
        setSelectedDate(Object.keys(results)[0]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy ảnh từ backend:", error);
    }
  };

  useEffect(() => {
    fetchImagesFromBackend();
  }, []);

  if (!selectedDate || !imageUrls[selectedDate]) {
    return <Typography>Đang tải ảnh từ backend...</Typography>;
  }

  const selectedImages = imageUrls[selectedDate];

  return (
    <Box p={2}>
      <Typography variant="h6">Ngày ảnh:</Typography>
      <Select
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        sx={{ mb: 2, ml: 2 }}
      >
        {Object.keys(imageUrls)
          .sort()
          .reverse()
          .map((date) => (
            <MenuItem key={date} value={date}>
              {date}
            </MenuItem>
          ))}
      </Select>

      <Typography variant="h6">Chế độ hiển thị:</Typography>
      <Select
        value={viewMode}
        onChange={(e) => setViewMode(e.target.value as "rgb" | "mask" | "overlay")}
        sx={{ mb: 2, ml: 2 }}
      >
        <MenuItem value="rgb">Chỉ RGB</MenuItem>
        <MenuItem value="mask">Chỉ Mask</MenuItem>
        <MenuItem value="overlay">Overlay (Mask + RGB)</MenuItem>
      </Select>

      {viewMode === "overlay" && (
        <Box width={200} ml={2} mb={2}>
          <Typography gutterBottom>Độ trong suốt mask: {opacity}%</Typography>
          <Slider
            value={opacity}
            onChange={(e, val) => setOpacity(val as number)}
            min={0}
            max={100}
          />
        </Box>
      )}

      <Box
        sx={{
          width: "100%",
          maxWidth: "500px",
          aspectRatio: "1372 / 1655",
          position: "relative",
          border: "1px solid #ccc",
          overflow: "hidden",
          mx: "auto",
        }}
      >
        {viewMode !== "overlay" && (
          <img
            src={viewMode === "rgb" ? selectedImages.rgb : selectedImages.mask}
            alt={`Ảnh ngày ${selectedDate}`}
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

        {viewMode === "overlay" && (
          <>
            <img
              src={selectedImages.rgb}
              alt={`RGB ngày ${selectedDate}`}
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
              src={selectedImages.mask}
              alt={`Mask ngày ${selectedDate}`}
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
                pointerEvents: "none",
              }}
            />
          ))
        )}
      </Box>
    </Box>
  );
};

export default Map;
