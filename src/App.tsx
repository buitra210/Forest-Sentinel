import "./App.css";
import MapGrid from "./components/MapGrid";

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Tay Son Forest Monitoring System</h1>
        <p>Satellite Imagery Analysis for Deforestation Prevention</p>
      </header>
      <main>
        <MapGrid />
      </main>
    </div>
  );
}

export default App;
