// Basic IFC analyzer using regex to extract building elements

export interface IfcElement {
  id: string;
  type: string;
  name?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    area?: number;
    volume?: number;
  };
}

export interface IfcAnalysisResult {
  elements: IfcElement[];
  walls: IfcElement[];
  slabs: IfcElement[];
  columns: IfcElement[];
  beams: IfcElement[];
  doors: IfcElement[];
  windows: IfcElement[];
  roofs: IfcElement[];
  stairs: IfcElement[];
  summary: {
    totalWalls: number;
    totalSlabs: number;
    totalColumns: number;
    totalBeams: number;
    totalDoors: number;
    totalWindows: number;
    totalRoofs: number;
    estimatedWallArea: number;
    estimatedSlabArea: number;
    estimatedFloors: number;
  };
}

function extractIfcEntities(content: string, entityType: string): IfcElement[] {
  const elements: IfcElement[] = [];
  const regex = new RegExp(`#(\\d+)\\s*=\\s*${entityType}[A-Z]*\\(([^;]*)\\)`, 'gi');
  let match;

  while ((match = regex.exec(content)) !== null) {
    const id = match[1];
    const params = match[2];
    const nameMatch = params.match(/'([^']+)'/);
    const name = nameMatch ? nameMatch[1] : undefined;

    const element: IfcElement = {
      id: `#${id}`,
      type: entityType,
      name,
      dimensions: {},
    };

    elements.push(element);
  }

  return elements;
}

export function analyzeIfcFile(content: string): IfcAnalysisResult {
  const walls = extractIfcEntities(content, 'IFCWALL');
  const slabs = extractIfcEntities(content, 'IFCSLAB');
  const columns = extractIfcEntities(content, 'IFCCOLUMN');
  const beams = extractIfcEntities(content, 'IFCBEAM');
  const doors = extractIfcEntities(content, 'IFCDOOR');
  const windows = extractIfcEntities(content, 'IFCWINDOW');
  const roofs = extractIfcEntities(content, 'IFCROOF');
  const stairs = extractIfcEntities(content, 'IFCSTAIR');

  const allElements = [...walls, ...slabs, ...columns, ...beams, ...doors, ...windows, ...roofs, ...stairs];

  const estimatedWallArea = walls.length * 8.0;
  const estimatedSlabArea = slabs.length * 25.0;
  const estimatedFloors = Math.max(1, Math.ceil(slabs.length / 2));

  return {
    elements: allElements,
    walls,
    slabs,
    columns,
    beams,
    doors,
    windows,
    roofs,
    stairs,
    summary: {
      totalWalls: walls.length,
      totalSlabs: slabs.length,
      totalColumns: columns.length,
      totalBeams: beams.length,
      totalDoors: doors.length,
      totalWindows: windows.length,
      totalRoofs: roofs.length,
      estimatedWallArea,
      estimatedSlabArea,
      estimatedFloors,
    },
  };
}