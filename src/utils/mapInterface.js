import apiCalls from './apis';

let mapboxgl;

const mapInterface = {
  renderedMap: null,
  toolTip: null,

  mapInit(mapContainer) {
    return import(/* webpackChunkName: "mapbox-gl" */ 'mapbox-gl')
      .then(async mapboxGL => {
        mapboxgl = mapboxGL.default;

        mapboxgl.accessToken = process.env.MAPBOX_KEY;
        this.renderedMap = new mapboxgl.Map({
          container: mapContainer,
          style: 'mapbox://styles/mike-fenwick/cji81a2a05t2e2rmrvnzez40x', // custom map to inc 3d buildings at zoom 15 & above
        });
        this.addMapControls();

        const featureCollection = await apiCalls.airportsGeoJson();
        // handle the cluster of the geoJSON feature
        this.renderedMap.on('load', this.clusterMarkers(featureCollection));
        // add click events for cluster points
        this.addClusterClickEvent();
        // toggle mouse cursor to pointer on hover of cluster.
        this.addMouseMoveCursorEvent();
        // add hover event to show toolTip popup for single cluster
        this.addSingleClusterHover();
        // adds zoom event to handle map pitch & bearing on zoom > & < 15
        this.addMapZoomEvent();
      })
      .catch(err => console.log(err, 'An error occurred while loading module'));
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
    this.renderedMap.flyTo({
      center: coords,
      speed: 0.8,
      zoom: 15.5,
    });
    this.renderedMap.once('moveend', () => {
      const {
        properties: { name, abbrev, wikipedia },
      } = cluster;
      new mapboxgl.Popup({ offset: [2, -12] })
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
        offset: [2, -12],
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

  addMapZoomEvent() {
    this.renderedMap.on('zoom', () => {
      if (this.renderedMap.getZoom() >= 15) {
        this.renderedMap.easeTo({
          pitch: 45,
          bearing: -10,
        });
      } else if (this.renderedMap.getPitch() && this.renderedMap.getBearing()) {
        this.renderedMap.easeTo({
          pitch: 0,
          bearing: 0,
        });
      }
    });
  },

  clusterMarkers(featureCollection) {
    this.renderedMap.addSource('airports', {
      type: 'geojson',
      data: featureCollection,
      cluster: true,
      clusterMaxZoom: 15,
      clusterRadius: 55,
    });

    // load images from Cloudinary and add to map
    apiCalls.loadImages();

    this.renderedMap.addLayer({
      id: 'clusters',
      type: 'symbol',
      source: 'airports',
      filter: ['has', 'point_count'],
      //   * 0.2 green2 airport marker size when point count is less than 25 clusters
      //   * 0.4 green3 airport marker size when point count is between 50 & 25 clusters
      //   * 0.6 green4 airport marker size when point count is between 100 & 50 clusters
      //   * 0.8 green5 airport marker size when point count is between 250 & 100 clusters
      //   * 1 forest green airport marker size when point count is greater than 250 clusters
      layout: {
        'icon-image': [
          'step',
          ['get', 'point_count'],
          'plane-green2',
          25,
          'plane-green3',
          50,
          'plane-green4',
          100,
          'plane-green5',
          250,
          'plane-forestgrn',
        ],
        'icon-size': [
          'step',
          ['get', 'point_count'],
          0.2,
          25,
          0.3,
          50,
          0.5,
          100,
          0.7,
          250,
          0.9,
        ],
        'icon-allow-overlap': true,
        'text-field': '{point_count}',
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': ['step', ['get', 'point_count'], 10, 50, 14], // font size 10px from 0 - 49 clusters & 14px 50+ clusters
        'text-anchor': 'top',
        'text-offset': [
          'step',
          ['get', 'point_count'],
          ['literal', [0.1, 1]],
          25,
          ['literal', [0.3, -0.9]],
          50,
          ['literal', [0.4, -1]],
          100,
          ['literal', [0.5, -1.2]],
          250,
          ['literal', [0.6, -1.2]],
        ],
      },
      paint: {
        'text-color': ['step', ['get', 'point_count'], '#000', 25, '#FFF'], // text color black upto 25 cluster marker & white above
      },
    });

    this.renderedMap.addLayer({
      id: 'unclustered-point',
      type: 'symbol',
      source: 'airports',
      filter: ['!has', 'point_count'],
      // default size 0.125 green1 plane marker
      layout: {
        'icon-image': 'plane-green1',
        'icon-size': 0.125,
      },
    });
  },
};

export default mapInterface;
