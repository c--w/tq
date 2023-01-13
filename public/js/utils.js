//import $ from "jQuery";
const asin = Math.asin
const cos = Math.cos
const sin = Math.sin
const sqrt = Math.sqrt
const PI = Math.PI

// equatorial mean radius of Earth (in meters)
const R = 6378137

function squared (x) { return x * x }
function toRad (x) { return x * PI / 180.0 }
function hav (x) {
  return squared(sin(x / 2))
}

// hav(theta) = hav(bLat - aLat) + cos(aLat) * cos(bLat) * hav(bLon - aLon)
function dist (a, b) {
  const aLat = toRad(Array.isArray(a) ? a[1] : a.latitude ?? a.CapitalLatitude)
  const bLat = toRad(Array.isArray(b) ? b[1] : b.latitude ?? b.CapitalLatitude)
  const aLng = toRad(Array.isArray(a) ? a[0] : a.longitude ?? a.lng ?? a.CapitalLongitude)
  const bLng = toRad(Array.isArray(b) ? b[0] : b.longitude ?? b.lng ?? b.CapitalLongitude)

  const ht = hav(bLat - aLat) + cos(aLat) * cos(bLat) * hav(bLng - aLng)
  return 2 * R * asin(sqrt(ht))
}
