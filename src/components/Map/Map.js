import React, { Component } from 'react';
import mapInterface from '../../utils/mapInterface';
import './Map.scss';

class Map extends Component {
  componentDidMount() {
    mapInterface.mapInit(this.mapContainer);
  }

  render() {
    return <section id="map" ref={el => (this.mapContainer = el)} />;
  }
}

export default Map;
