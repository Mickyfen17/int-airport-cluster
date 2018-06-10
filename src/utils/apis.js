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
      'http://res.cloudinary.com/mickyfen17/image/upload/v1528569332/Images/airplane-shape-grassgrn.png',
      'http://res.cloudinary.com/mickyfen17/image/upload/v1528569495/Images/airplane-shape-desert.png',
      'http://res.cloudinary.com/mickyfen17/image/upload/v1528564190/Images/airplane-shape-grey.png',
      'http://res.cloudinary.com/mickyfen17/image/upload/v1528564190/Images/airplane-shape-drkblue.png',
      'http://res.cloudinary.com/mickyfen17/image/upload/v1528564190/Images/airplane-shape-blue.png',
    ];
    return images.forEach((imgUrl, i) => {
      mapInterface.renderedMap.loadImage(imgUrl, (error, image) => {
        if (error) throw new Error(error);
        const imageUrl = images[i];
        const imageColor = imageUrl.substring(
          imageUrl.lastIndexOf('-') + 1,
          imageUrl.lastIndexOf('.')
        );
        mapInterface.renderedMap.addImage(`plane-${imageColor}`, image);
        return image;
      });
    });
  },
};

export default apiCalls;
