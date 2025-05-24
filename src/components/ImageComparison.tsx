import { useEffect, useState } from "react";
import {
  Box,
  MenuItem,
  Select,
  Typography,
  Button,
  Tooltip,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import axios from "axios";
import Resemble from "resemblejs";

const ImageComparison = () => {
  const [imageUrls, setImageUrls] = useState<
    Record<string, { rgb?: string; mask?: string }>
  >({});
  const [selectedDate1, setSelectedDate1] = useState("");
  const [selectedDate2, setSelectedDate2] = useState("");
  const [comparisonResult, setComparisonResult] = useState();
  const [isComparing, setIsComparing] = useState(false);

  const fetchImagesFromBackend = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/api/cloudinary/images"
      );
      const results = response.data;
      setImageUrls(results);
      if (Object.keys(results).length > 0) {
        const dates = Object.keys(results).sort();
        setSelectedDate1(dates[0]);
        setSelectedDate2(dates[1] || dates[0]);
      }
    } catch (error) {
      console.error("Lỗi khi lấy ảnh từ backend:", error);
    }
  };

  useEffect(() => {
    fetchImagesFromBackend();
  }, []);

  const compareImages = async () => {
    if (
      !selectedDate1 ||
      !selectedDate2 ||
      !imageUrls[selectedDate1] ||
      !imageUrls[selectedDate2]
    ) {
      return;
    }

    setIsComparing(true);
    try {
      const image1 = imageUrls[selectedDate1].mask;
      const image2 = imageUrls[selectedDate2].mask;

      const result: any = await new Promise((resolve) => {
        Resemble(image1)
          .compareTo(image2)
          .ignoreColors()
          .onComplete((data: any) => {
            resolve(data);
          });
      });
      setComparisonResult({
        ...result,
        imageUrl: (result as any).getImageDataUrl(),
      });
    } catch (error) {
      console.error("Lỗi khi so sánh ảnh:", error);
    } finally {
      setIsComparing(false);
    }
  };

  if (
    !selectedDate1 ||
    !selectedDate2 ||
    !imageUrls[selectedDate1] ||
    !imageUrls[selectedDate2]
  ) {
    return <Typography>Đang tải ảnh từ backend...</Typography>;
  }

  console.log(comparisonResult);

  return (
    <Box p={2}>
      <Box display="flex" gap={2} mb={2}>
        <Box>
          <Typography variant="h6">Ngày ảnh 1:</Typography>
          <Select
            value={selectedDate1}
            onChange={(e) => setSelectedDate1(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {Object.keys(imageUrls)
              .sort()
              .map((date) => (
                <MenuItem key={date} value={date}>
                  {date}
                </MenuItem>
              ))}
          </Select>
        </Box>

        <Box>
          <Typography variant="h6">Ngày ảnh 2:</Typography>
          <Select
            value={selectedDate2}
            onChange={(e) => setSelectedDate2(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {Object.keys(imageUrls)
              .sort()
              .map((date) => (
                <MenuItem key={date} value={date}>
                  {date}
                </MenuItem>
              ))}
          </Select>
        </Box>
      </Box>

      <Button
        variant="contained"
        onClick={compareImages}
        disabled={isComparing || selectedDate1 === selectedDate2}
        sx={{ mb: 2 }}
      >
        {isComparing ? "Đang so sánh..." : "So sánh ảnh"}
      </Button>

      {comparisonResult && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Kết quả so sánh:
          </Typography>
          <Typography>
            Tỷ lệ thay đổi diện tích rừng giữa hai thời điểm là{" "}
            {comparisonResult.misMatchPercentage}%.
            {parseFloat(comparisonResult.misMatchPercentage) > 0 ? (
              <Typography component="span" color="error">
                {" "}
                Có sự thay đổi về diện tích rừng.
              </Typography>
            ) : (
              <Typography component="span" color="success.main">
                {" "}
                Không có sự thay đổi về diện tích rừng.
              </Typography>
            )}
          </Typography>
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
        {comparisonResult ? (
          <>
            <img
              src={comparisonResult.imageUrl}
              alt="Kết quả so sánh"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
            <Tooltip
              title="Vùng màu đỏ: Khu vực có sự thay đổi về diện tích rừng"
              placement="left"
            >
              <InfoIcon
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  color: "info.main",
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                  borderRadius: "50%",
                  padding: 0.5,
                  cursor: "help",
                }}
              />
            </Tooltip>
          </>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography>Chọn 2 ngày khác nhau và nhấn "So sánh ảnh"</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ImageComparison;
