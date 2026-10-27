/** Géographie légère, sans carte ni API payante : communes de Suisse romande + distance haversine. */
export type Place = { name: string; npa: string; lat: number; lng: number; canton: string };

export const COMMUNES: Place[] = [
  { name: 'Prilly', npa: '1008', lat: 46.5375, lng: 6.6033, canton: 'VD' },
  { name: 'Lausanne', npa: '1003', lat: 46.5197, lng: 6.6323, canton: 'VD' },
  { name: 'Renens', npa: '1020', lat: 46.5399, lng: 6.5881, canton: 'VD' },
  { name: 'Crissier', npa: '1023', lat: 46.5508, lng: 6.5757, canton: 'VD' },
  { name: 'Écublens', npa: '1024', lat: 46.5285, lng: 6.5620, canton: 'VD' },
  { name: 'Chavannes-près-Renens', npa: '1022', lat: 46.5300, lng: 6.5711, canton: 'VD' },
  { name: 'Le Mont-sur-Lausanne', npa: '1052', lat: 46.5580, lng: 6.6330, canton: 'VD' },
  { name: 'Epalinges', npa: '1066', lat: 46.5480, lng: 6.6690, canton: 'VD' },
  { name: 'Pully', npa: '1009', lat: 46.5106, lng: 6.6617, canton: 'VD' },
  { name: 'Bussigny', npa: '1030', lat: 46.5506, lng: 6.5520, canton: 'VD' },
  { name: 'Morges', npa: '1110', lat: 46.5110, lng: 6.4985, canton: 'VD' },
  { name: 'Vevey', npa: '1800', lat: 46.4628, lng: 6.8419, canton: 'VD' },
  { name: 'Montreux', npa: '1820', lat: 46.4312, lng: 6.9107, canton: 'VD' },
  { name: 'Nyon', npa: '1260', lat: 46.3833, lng: 6.2396, canton: 'VD' },
  { name: 'Yverdon-les-Bains', npa: '1400', lat: 46.7785, lng: 6.6410, canton: 'VD' },
  { name: 'Genève', npa: '1201', lat: 46.2044, lng: 6.1432, canton: 'GE' },
  { name: 'Carouge', npa: '1227', lat: 46.1810, lng: 6.1390, canton: 'GE' },
  { name: 'Vernier', npa: '1214', lat: 46.2170, lng: 6.0850, canton: 'GE' },
  { name: 'Fribourg', npa: '1700', lat: 46.8065, lng: 7.1619, canton: 'FR' },
  { name: 'Bulle', npa: '1630', lat: 46.6193, lng: 7.0569, canton: 'FR' },
  { name: 'Neuchâtel', npa: '2000', lat: 46.9900, lng: 6.9293, canton: 'NE' },
  { name: 'La Chaux-de-Fonds', npa: '2300', lat: 47.1035, lng: 6.8328, canton: 'NE' },
  { name: 'Sion', npa: '1950', lat: 46.2331, lng: 7.3606, canton: 'VS' },
  { name: 'Delémont', npa: '2800', lat: 47.3649, lng: 7.3445, canton: 'JU' },
];

export function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const fmtKm = (d: number) => (d < 1 ? `${Math.round(d * 1000 / 50) * 50} m` : `${d.toFixed(1).replace('.', ',')} km`);
export const findCommune = (q: string) => {
  const s = q.trim().toLowerCase();
  if (!s) return COMMUNES;
  return COMMUNES.filter((c) => c.name.toLowerCase().includes(s) || c.npa.startsWith(s));
};
