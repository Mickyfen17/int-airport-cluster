import mapboxgl from 'mapbox-gl';
import apiCalls from './apis';

const mapInterface = {
  renderedMap: null,
  toolTip: null,

  async mapInit(mapContainer) {
    mapboxgl.accessToken = process.env.MAPBOX_KEY;
    this.renderedMap = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/light-v9',
      zoom: 1.5,
    });
    this.addMapControls();

    const FeatureCollection = await apiCalls.airportsGeoJson();
    // handle the cluster of the geoJSON feature
    this.renderedMap.on('load', this.clusterMarkers(FeatureCollection));
    // add click events for cluster points
    this.addClusterClickEvent();
    // toggle mouse cursor to pointer on hover of cluster.
    this.addMouseMoveCursorEvent();
    // add hover event to show toolTip popup for single cluster
    this.addSingleClusterHover();
  },

  addMapControls() {
    this.renderedMap.addControl(new mapboxgl.NavigationControl());
    this.renderedMap.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      })
    );
    this.renderedMap.addControl(new mapboxgl.FullscreenControl());
  },

  getMap() {
    return this.renderedMap;
  },

  getCenter() {
    return this.renderedMap.getCenter();
  },

  addClusterClickEvent() {
    this.renderedMap.on('click', e => {
      const clusters = this.renderedMap.queryRenderedFeatures(e.point, {
        layers: ['clusters', 'unclustered-point'],
      });

      if (clusters.length) {
        const {
          layer: { id },
          geometry: { coordinates: coords },
        } = clusters[0];

        if (id === 'clusters') {
          this.handleGroupClusterClick(coords);
        } else if (id === 'unclustered-point') {
          this.handleSingleClusterClick(coords, clusters[0]);
        }
      }
    });
  },

  handleSingleClusterClick(coords, cluster) {
    this.renderedMap.flyTo({ center: coords, speed: 0.8, zoom: 14 });
    this.renderedMap.once('moveend', () => {
      const {
        properties: { name, abbrev, wikipedia },
      } = cluster;
      new mapboxgl.Popup()
        .setLngLat(coords)
        .setHTML(
          `
            <h4>${name} Airport</h4>
            <p>Airport Code: ${abbrev}</p>
            <a 
              href=${wikipedia}
              target="_blank"
              rel="noopener
              noreferrer"
            >
              ${name}
            </a>
          `
        )
        .addTo(this.renderedMap);
    });
  },

  handleGroupClusterClick(coords) {
    let zoom = Math.round(this.renderedMap.getZoom());
    this.renderedMap.flyTo({
      center: coords,
      speed: 0.6,
      zoom: (zoom += 1),
    });
  },

  addSingleClusterHover() {
    this.renderedMap.on('mouseenter', 'unclustered-point', e => {
      const {
        geometry: { coordinates: coords },
        properties: { name },
      } = e.features[0];

      this.toolTip = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
      })
        .setLngLat(coords)
        .setHTML(`<p>${name} Airport</p>`)
        .addTo(this.renderedMap);
    });

    this.renderedMap.on('mouseleave', 'unclustered-point', () => {
      this.toolTip.remove();
      this.toolTip = null;
    });
  },

  addMouseMoveCursorEvent() {
    this.renderedMap.on('mousemove', e => {
      const cluster = this.renderedMap.queryRenderedFeatures(e.point, {
        layers: ['clusters', 'unclustered-point'],
      });
      this.renderedMap.getCanvas().style.cursor = cluster.length
        ? 'pointer'
        : '';
    });
  },

  clusterMarkers(FeatureCollection) {
    this.renderedMap.addSource('airports', {
      type: 'geojson',
      data: FeatureCollection,
      cluster: true,
      clusterMaxZoom: 15,
      clusterRadius: 75,
    });

    this.renderedMap.loadImage(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Airplane_silhouette.svg/100px-Airplane_silhouette.svg.png',
      (error, image) => {
        if (error) throw new Error(error);
        this.renderedMap.addImage('plane', image);
        this.renderedMap.addLayer({
          id: 'clusters',
          type: 'symbol',
          source: 'airports',
          filter: ['has', 'point_count'],
          //   * 0.4 airport marker size when point count is less than 25 clusters
          //   * 0.6 airport marker size when point count is between 50 & 25 clusters
          //   * 0.8 airport marker size when point count is between 100 & 50 clusters
          //   * 1 airport marker size when point count is between 250 & 100 clusters
          //   * 1.25 airport marker size when point count is greater than 250 clusters
          layout: {
            'icon-image': 'plane',
            'icon-size': [
              'step',
              ['get', 'point_count'],
              0.4,
              25,
              0.6,
              50,
              0.8,
              100,
              1,
              250,
              1.25,
            ],
            'icon-allow-overlap': true,
            'text-field': '{point_count}',
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 14,
            'text-anchor': 'top',
            'text-offset': [0.3, 0.5],
          },
          paint: {
            'text-color': '#000',
          },
        });

        this.renderedMap.addLayer({
          id: 'unclustered-point',
          type: 'symbol',
          source: 'airports',
          filter: ['!has', 'point_count'],
          // default size of single airport marker 0.25
          layout: {
            'icon-image': 'plane',
            'icon-size': 0.25,
          },
        });
      }
    );
  },
};

export default mapInterface;
