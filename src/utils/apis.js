// import mapInterface from './mapInterface';

const apiCalls = {
  async airportsGeoJson() {
    const response = await fetch(
      'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson'
    );
    const json = await response.json();
    return json;
  },
};

export default apiCalls;
