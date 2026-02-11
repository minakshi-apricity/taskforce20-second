import { DOMParser } from "xmldom";
import * as toGeoJSON from "@tmcw/togeojson";

export interface ParsedBeat {
    name: string;
    description: string;
    geometry: any;
    type: string;
}

export function parseKML(kmlContent: string): any {
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlContent, "text/xml");
    return toGeoJSON.kml(kml);
}
