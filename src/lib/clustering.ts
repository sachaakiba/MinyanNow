import { Event } from "./api";

export interface Cluster {
  id: string;
  latitude: number;
  longitude: number;
  events: Event[];
  hasUrgent: boolean;
  // Rayon du cercle en degrés (pour englober tous les événements)
  radiusDeg: number;
}

/**
 * Calcule la distance en degrés entre deux points
 */
function distanceInDegrees(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

/**
 * Arrondit une coordonnée à une grille fixe pour créer des secteurs
 * Cela garantit que les secteurs sont toujours aux mêmes positions
 * et ne révèlent pas la position exacte des événements
 */
function snapToGrid(value: number, gridSize: number): number {
  return Math.floor(value / gridSize) * gridSize + gridSize / 2;
}

/**
 * Génère un ID de secteur basé sur les coordonnées arrondies
 */
function getSectorId(lat: number, lng: number, gridSize: number): string {
  const gridLat = Math.floor(lat / gridSize);
  const gridLng = Math.floor(lng / gridSize);
  return `sector-${gridLat}-${gridLng}`;
}

/**
 * Regroupe les événements par secteurs géographiques fixes (grille)
 * Les secteurs sont des zones carrées de taille fixe
 * Le centre affiché est le centre du secteur, PAS le centre des événements
 * Le rayon du cercle est calculé pour englober tous les événements
 * @param events Liste des événements
 * @param gridSizeKm Taille de la grille en km (défaut: 1km)
 */
export function clusterEvents(
  events: Event[],
  gridSizeKm: number = 1
): Cluster[] {
  if (events.length === 0) return [];

  // Convertit km en degrés (approximation: 1° ≈ 111km)
  const gridSizeDeg = gridSizeKm / 111;

  // Regroupe les événements par secteur
  const sectors = new Map<string, Event[]>();

  for (const event of events) {
    const sectorId = getSectorId(event.latitude, event.longitude, gridSizeDeg);

    if (!sectors.has(sectorId)) {
      sectors.set(sectorId, []);
    }
    sectors.get(sectorId)!.push(event);
  }

  // Convertit les secteurs en clusters
  const clusters: Cluster[] = [];

  sectors.forEach((sectorEvents, sectorId) => {
    // Utilise le premier événement pour déterminer le centre du secteur
    const firstEvent = sectorEvents[0];
    const centerLat = snapToGrid(firstEvent.latitude, gridSizeDeg);
    const centerLng = snapToGrid(firstEvent.longitude, gridSizeDeg);

    // Calcule le rayon pour englober tous les événements
    // On prend la distance max entre le centre et chaque événement + une marge
    let maxDistance = 0;
    for (const event of sectorEvents) {
      const distance = distanceInDegrees(
        centerLat,
        centerLng,
        event.latitude,
        event.longitude
      );
      if (distance > maxDistance) {
        maxDistance = distance;
      }
    }
    // Ajoute 20% de marge et un minimum
    const radiusDeg = Math.max(maxDistance * 1.2, gridSizeDeg * 0.3);

    // Vérifie si un des événements est urgent (moins de 3 places)
    const hasUrgent = sectorEvents.some((e) => {
      const needed = e.maxParticipants - e.currentCount;
      return needed > 0 && needed <= 3;
    });

    clusters.push({
      id: sectorId,
      latitude: centerLat,
      longitude: centerLng,
      events: sectorEvents,
      hasUrgent,
      radiusDeg,
    });
  });

  return clusters;
}

/**
 * Calcule la taille de grille adaptative basée sur le niveau de zoom
 * Plus on est zoomé, plus les secteurs sont petits
 */
export function getGridSizeForZoom(latitudeDelta: number): number {
  // latitudeDelta approximatif:
  // 0.01 = très zoomé (~1km visible)
  // 0.05 = moyen (~5km visible)
  // 0.1 = dézoomé (~10km visible)
  // 0.5 = très dézoomé (~50km visible)

  if (latitudeDelta < 0.02) return 0.5; // 500m
  if (latitudeDelta < 0.05) return 1; // 1km
  if (latitudeDelta < 0.1) return 2; // 2km
  if (latitudeDelta < 0.3) return 3; // 3km
  return 5; // 5km pour les vues très larges
}
