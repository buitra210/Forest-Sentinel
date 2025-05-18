/// <reference types="vite/client" />

// Leaflet declarations
declare namespace L {
  function map(id: string | HTMLElement, options?: MapOptions): Map;
  function tileLayer(
    urlTemplate: string,
    options?: TileLayerOptions
  ): TileLayer;
  function rectangle(
    bounds: LatLngBoundsExpression,
    options?: PathOptions
  ): Rectangle;

  interface MapOptions {
    center?: LatLngExpression;
    zoom?: number;
    maxZoom?: number;
    minZoom?: number;
    zoomControl?: boolean;
    dragging?: boolean;
    touchZoom?: boolean;
    scrollWheelZoom?: boolean;
    doubleClickZoom?: boolean;
    boxZoom?: boolean;
    keyboard?: boolean;
    [key: string]: any;
  }

  interface TileLayerOptions {
    attribution?: string;
    maxZoom?: number;
    minZoom?: number;
    [key: string]: any;
  }

  interface PathOptions {
    stroke?: boolean;
    color?: string;
    weight?: number;
    opacity?: number;
    fill?: boolean;
    fillColor?: string;
    fillOpacity?: number;
    [key: string]: any;
  }

  interface Map {
    setView(center: LatLngExpression, zoom: number): this;
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer): this;
    invalidateSize(options?: { animate?: boolean }): this;
    remove(): void;
  }

  interface Layer {
    addTo(map: Map): this;
  }

  interface TileLayer extends Layer {}
  interface Rectangle extends Layer {}

  type LatLngExpression =
    | LatLng
    | [number, number]
    | { lat: number; lng: number };
  type LatLngBoundsExpression =
    | LatLngBounds
    | [LatLngExpression, LatLngExpression]
    | [number, number, number, number];

  interface LatLng {
    lat: number;
    lng: number;
  }

  interface LatLngBounds {
    getSouthWest(): LatLng;
    getNorthEast(): LatLng;
    extend(latlng: LatLngExpression): this;
  }
}

// ESRI Leaflet declarations
declare namespace L.esri {
  function basemapLayer(key: string, options?: any): L.TileLayer;
  function tiledMapLayer(options?: any): L.TileLayer;
  function imageMapLayer(options?: any): L.Layer;
}
