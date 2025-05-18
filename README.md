# Forest - Satellite Image Analysis for Deforestation Prevention

This project is a React TypeScript application designed to analyze satellite imagery for predicting deforestation in the Tay Son area of Hanoi, Vietnam. The application displays a grid-based map interface where users can view both real-time ESRI satellite imagery and AI-processed analysis results.

## Features

- Grid-based satellite map view of Tay Son area, Hanoi
- Real-time ESRI World Imagery satellite view
- Non-zoomable grid cells to maintain image integrity
- Popup detail view showing:
  - Original satellite imagery
  - AI-processed analysis results with deforestation highlighting
  - Deforestation risk assessment

## Technology Stack

- React 19
- TypeScript
- Leaflet for interactive maps
- ESRI Leaflet for satellite imagery
- CSS for styling

## Project Structure

```
src/
├── components/         # React components
│   └── MapGrid.tsx     # Main grid-based map component
├── styles/             # CSS styles
│   └── MapGrid.css     # Styles for map grid component
├── App.tsx             # Main application component
├── main.tsx            # Entry point of the application
└── assets/             # Static assets (images, etc.)
```

## Getting Started

To run this project locally:

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn
   ```
3. Start the development server:
   ```
   npm run dev
   ```
   or
   ```
   yarn dev
   ```
4. Open your browser and navigate to: http://localhost:5173/

## Implementation Details

The application displays the Tay Son area in Hanoi, Vietnam using ESRI World Imagery. The map is divided into a 3x3 grid where:

- Each grid cell shows a portion of the satellite map
- Cells are labeled with coordinates (A1, A2, etc.)
- Clicking on a grid cell opens a detailed view

The detailed view displays:

- A zoomed-in satellite image of the selected area
- A processed version of the same area with deforestation risk overlay
- Risk assessment data and location information

## Map Implementation

The application uses:

- Leaflet.js for the interactive maps
- ESRI Leaflet to access ESRI World Imagery satellite layers
- CSS grid overlay to create the cell-based interface
- Fixed map position and disabled zoom to maintain the grid integrity

## Future Enhancements

- Integration with real-time deforestation prediction API
- Historical satellite imagery comparison
- More detailed analysis metrics
- User authentication for protected areas
- Custom analysis tools for specific deforestation patterns

## License

This project is MIT licensed.
