// Basic DXF parser for extracting geometric information
// Parses DXF text files to identify entities, polylines, texts, etc.

export interface DxfEntity {
  type: string;
  layer?: string;
  vertices?: { x: number; y: number }[];
  center?: { x: number; y: number };
  radius?: number;
  text?: string;
  insertPoint?: { x: number; y: number };
  blockName?: string;
}

export interface DxfParseResult {
  entities: DxfEntity[];
  polylines: DxfEntity[];
  texts: string[];
  blocks: string[];
  totalArea: number;
  totalPerimeter: number;
  rooms: { name: string; area: number }[];
}

function parseEntities(content: string): DxfEntity[] {
  const entities: DxfEntity[] = [];
  const entitySection = content.split('ENTITIES')[1]?.split('ENDSEC')[0];
  if (!entitySection) return entities;

  const lines = entitySection.split('\n').map(l => l.trim());
  let i = 0;
  let currentEntity: DxfEntity | null = null;

  while (i < lines.length) {
    const code = parseInt(lines[i]);
    const value = lines[i + 1];

    if (code === 0) {
      if (currentEntity) {
        entities.push(currentEntity);
      }
      if (['LINE', 'POLYLINE', 'LWPOLYLINE', 'CIRCLE', 'ARC', 'TEXT', 'MTEXT', 'INSERT'].includes(value)) {
        currentEntity = { type: value, vertices: [] };
      } else {
        currentEntity = null;
      }
    } else if (currentEntity) {
      switch (code) {
        case 8:
          currentEntity.layer = value;
          break;
        case 10:
          if (!currentEntity.vertices) currentEntity.vertices = [];
          currentEntity.vertices.push({ x: parseFloat(value), y: 0 });
          if (currentEntity.type === 'CIRCLE') currentEntity.center = { x: parseFloat(value), y: 0 };
          if (currentEntity.type === 'INSERT') currentEntity.insertPoint = { x: parseFloat(value), y: 0 };
          break;
        case 20:
          if (currentEntity.vertices && currentEntity.vertices.length > 0) {
            currentEntity.vertices[currentEntity.vertices.length - 1].y = parseFloat(value);
          }
          if (currentEntity.center) currentEntity.center.y = parseFloat(value);
          if (currentEntity.insertPoint) currentEntity.insertPoint.y = parseFloat(value);
          break;
        case 40:
          if (currentEntity.type === 'CIRCLE') currentEntity.radius = parseFloat(value);
          break;
        case 1:
          currentEntity.text = value;
          break;
        case 2:
          currentEntity.blockName = value;
          break;
      }
    }

    i += 2;
  }

  if (currentEntity) entities.push(currentEntity);
  return entities;
}

function calculatePolylineArea(vertices: { x: number; y: number }[]): number {
  if (vertices.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area) / 2;
}

function calculatePolylinePerimeter(vertices: { x: number; y: number }[]): number {
  let perimeter = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    const dx = vertices[j].x - vertices[i].x;
    const dy = vertices[j].y - vertices[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  return perimeter;
}

export function parseDxfContent(content: string): DxfParseResult {
  const entities = parseEntities(content);

  const polylines = entities.filter(e =>
    e.type === 'POLYLINE' || e.type === 'LWPOLYLINE'
  );

  const texts = entities
    .filter(e => (e.type === 'TEXT' || e.type === 'MTEXT') && e.text)
    .map(e => e.text!);

  const blocks = entities
    .filter(e => e.type === 'INSERT' && e.blockName)
    .map(e => e.blockName!);

  let totalArea = 0;
  let totalPerimeter = 0;
  const rooms: { name: string; area: number }[] = [];

  polylines.forEach((poly, idx) => {
    if (poly.vertices && poly.vertices.length >= 3) {
      const area = calculatePolylineArea(poly.vertices);
      const perimeter = calculatePolylinePerimeter(poly.vertices);
      totalArea += area;
      totalPerimeter += perimeter;

      const roomName = poly.layer || `Ambiente ${idx + 1}`;
      if (area > 1) {
        rooms.push({ name: roomName, area: Math.round(area * 100) / 100 });
      }
    }
  });

  const roomPatterns = /^(SALA|QUARTO|COZINHA|BANHEIRO|BWC|SUITE|VARANDA|GARAGEM|AREA|HALL|CORREDOR|LAVABO|DEPOSITO|ESCRITORIO)/i;
  texts.forEach(text => {
    if (roomPatterns.test(text)) {
      const areaMatch = text.match(/(\d+[.,]\d+)\s*m/);
      if (areaMatch) {
        rooms.push({
          name: text.split(/\d/)[0].trim(),
          area: parseFloat(areaMatch[1].replace(',', '.'))
        });
      }
    }
  });

  return {
    entities,
    polylines,
    texts,
    blocks,
    totalArea: Math.round(totalArea * 100) / 100,
    totalPerimeter: Math.round(totalPerimeter * 100) / 100,
    rooms,
  };
}

export function analyzeDxfFile(fileContent: string): {
  parseResult: DxfParseResult;
  estimatedArea: number;
  estimatedRooms: number;
  hasFloorPlan: boolean;
} {
  const parseResult = parseDxfContent(fileContent);

  const hasFloorPlan = parseResult.polylines.length > 5 || parseResult.rooms.length > 0;

  const estimatedArea = parseResult.rooms.length > 0
    ? parseResult.rooms.reduce((sum, r) => sum + r.area, 0)
    : parseResult.totalArea;

  return {
    parseResult,
    estimatedArea: Math.round(estimatedArea * 100) / 100,
    estimatedRooms: parseResult.rooms.length || Math.max(1, Math.floor(estimatedArea / 15)),
    hasFloorPlan,
  };
}