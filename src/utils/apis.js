import mapInterface from './mapInterface';

const apiCalls = {
  async airportsGeoJson() {
    const response = await fetch(
      'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson'
    );
    const json = await response.json();
    return json;
  },

  loadImages() {
    const images = [
      'http://res.cloudinary.com/mickyfen17/image/upload/v1528564190/Images/airplane-shape-forestgrn.png',
      'http://res.cloudinary.com/mickyfen17/image/upload/v1528569332/Images/airplane-shape-green1.png',
      'http://res.cloudinary.com/mickyfen17/image/upload/v1528569495/Images/airplane-shape-green2.png',
      'http://res.cloudinary.com/mickyfen17/image/upload/v1528564190/Images/airplane-shape-green3.png',
      'http://res.cloudinary.com/mickyfen17/image/upload/v1528564190/Images/airplane-shape-green4.png',
      'http://res.cloudinary.com/mickyfen17/image/upload/v1528564190/Images/airplane-shape-green5.png',
    ];
    return images.forEach(imgUrl => {
      mapInterface.renderedMap.loadImage(imgUrl, (error, image) => {
        if (error) throw new Error(error);
        const imageColor = imgUrl.substring(
          imgUrl.lastIndexOf('-') + 1,
          imgUrl.lastIndexOf('.')
        );
        mapInterface.renderedMap.addImage(`plane-${imageColor}`, image);
      });
    });
  },
};

export default apiCalls;
