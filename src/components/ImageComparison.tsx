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

interface ComparisonResult {
  imageUrl: string;
  forestLoss: number;
  forestGain: number;
  totalPixels: number;
}

const AREAS = [
  "Ba Vì",
  "Sóc Sơn",
  "Mỹ Đức",
  "Chương Mĩ",
  "Quốc Oai",
  "Thạch Thất",
  "Sơn Tây",
];

const AREA_API_MAP: Record<string, string> = {
  "Ba Vì": "BaVi",
  "Sóc Sơn": "SocSon",
  "Mỹ Đức": "MyDuc",
  "Chương Mĩ": "ChuongMy",
  "Quốc Oai": "QuocOai",
  "Thạch Thất": "ThachThat",
  "Sơn Tây": "SonTay",
};

const ImageComparison = () => {
  const [imageUrls, setImageUrls] = useState<
    Record<string, { rgb?: string; mask?: string }>
  >({});
  const [selectedDate1, setSelectedDate1] = useState("");
  const [selectedDate2, setSelectedDate2] = useState("");
  const [selectedArea, setSelectedArea] = useState(AREAS[0]);
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const fetchImagesFromBackend = async () => {
    try {
      const apiArea = AREA_API_MAP[selectedArea];
      const response = await axios.get(
        `http://localhost:3000/api/cloudinary/images/?region=${apiArea}`
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
  }, [selectedArea]);

  const loadImageToCanvas = (src: string): Promise<ImageData> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, img.width, img.height));
      };
    });
  };

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

      if (!image1 || !image2) throw new Error("Missing image data");

      const [data1, data2] = await Promise.all([
        loadImageToCanvas(image1),
        loadImageToCanvas(image2),
      ]);

      const width = data1.width;
      const height = data1.height;
      const diffCanvas = document.createElement("canvas");
      diffCanvas.width = width;
      diffCanvas.height = height;
      const diffCtx = diffCanvas.getContext("2d");
      if (!diffCtx) throw new Error("Could not get diff canvas context");

      const diffData = diffCtx.createImageData(width, height);
      let forestLoss = 0;
      let forestGain = 0;
      const totalPixels = width * height;

      // Compare pixels
      for (let i = 0; i < data1.data.length; i += 4) {
        // Check if pixel is green (forest) in either image
        const isForest1 =
          data1.data[i + 1] > 200 &&
          data1.data[i] < 100 &&
          data1.data[i + 2] < 100;
        const isForest2 =
          data2.data[i + 1] > 200 &&
          data2.data[i] < 100 &&
          data2.data[i + 2] < 100;

        if (isForest1 && !isForest2) {
          // Forest loss - red
          diffData.data[i] = 255; // R
          diffData.data[i + 1] = 0; // G
          diffData.data[i + 2] = 0; // B
          diffData.data[i + 3] = 150; // A
          forestLoss++;
        } else if (!isForest1 && isForest2) {
          // Forest gain - green
          diffData.data[i] = 0; // R
          diffData.data[i + 1] = 255; // G
          diffData.data[i + 2] = 0; // B
          diffData.data[i + 3] = 150; // A
          forestGain++;
        } else if (isForest1) {
          // Original forest - gray
          diffData.data[i] = 128; // R
          diffData.data[i + 1] = 128; // G
          diffData.data[i + 2] = 128; // B
          diffData.data[i + 3] = 255; // A
        } else {
          // Non-forest - black
          diffData.data[i] = 0; // R
          diffData.data[i + 1] = 0; // G
          diffData.data[i + 2] = 0; // B
          diffData.data[i + 3] = 255; // A
        }
      }

      diffCtx.putImageData(diffData, 0, 0);
      const imageUrl = diffCanvas.toDataURL("image/png");

      setComparisonResult({
        imageUrl,
        forestLoss,
        forestGain,
        totalPixels,
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

  return (
    <Box p={2}>
      <Box display="flex" gap={2} mb={2}>
        <Box>
          <Typography variant="h6">Khu vực:</Typography>
          <Select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {AREAS.map((area) => (
              <MenuItem key={area} value={area}>
                {area}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Box>
          <Typography variant="h6">Thời gian 1:</Typography>
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
          <Typography variant="h6">Thời gian 2:</Typography>
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
            Diện tích rừng mất đi:{" "}
            {(
              (comparisonResult.forestLoss / comparisonResult.totalPixels) *
              100
            ).toFixed(2)}
            %
          </Typography>
          <Typography>
            Diện tích rừng tăng thêm:{" "}
            {(
              (comparisonResult.forestGain / comparisonResult.totalPixels) *
              100
            ).toFixed(2)}
            %
          </Typography>
          <Typography>
            {comparisonResult.forestLoss > comparisonResult.forestGain ? (
              <Typography component="span" color="error">
                Có sự suy giảm về diện tích rừng.
              </Typography>
            ) : comparisonResult.forestLoss < comparisonResult.forestGain ? (
              <Typography component="span" color="success.main">
                Có sự gia tăng về diện tích rừng.
              </Typography>
            ) : (
              <Typography component="span" color="info.main">
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
              title="Vùng màu xám: Rừng ban đầu, Vùng màu đỏ: Khu vực mất rừng, Vùng màu xanh: Khu vực tăng rừng"
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
