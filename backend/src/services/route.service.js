exports.getRoutePolyline = async ({
    originLat,
    originLng,
    destLat,
    destLng
  }) => {
    const osrmUrl =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${originLng},${originLat};${destLng},${destLat}` +
      `?overview=full&geometries=geojson`;
  
    const response = await fetch(osrmUrl);
    const data = await response.json();
  
    if (!data.routes || !data.routes.length) {
      throw new Error("Route not found");
    }
  
    const route = data.routes[0];
  
    return {
      geometry: route.geometry.coordinates,
      distance: route.distance,
      duration: route.duration
    };
  };
  