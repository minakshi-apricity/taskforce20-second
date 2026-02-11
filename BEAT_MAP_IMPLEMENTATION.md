# Beat Map Preview Feature Implementation

## ✅ Completed Work

### Backend Changes
1. ✅ Added `kmlData Json?` field to GeoNode model in Prisma schema
2. ✅ Ran database migration successfully 
3. ✅ Updated geoSchema to accept optional kmlData with coordinates
4. ✅ Modified POST /geo endpoint to store kmlData when creating beats
5. ✅ Created GET /geo/:id/kml endpoint to fetch KML data for beats

### Frontend Changes
1. ✅ Created BeatMapViewerModal component at `/components/BeatMapViewerModal.tsx`
2. ✅ Imported BeatMapViewerModal and MapIcon in areas page
3. ✅ Added mapViewerBeat state to areas page
4. ✅ Updated handleSaveBeatWithKML to send kmlData to API

## ⚠️ Remaining Frontend Work

The following manual changes need to be made to `/app/city/areas/page.tsx`:

### 1. Update renderActions Function (around line 271)

Change from:
```typescript
const renderActions = (node: GeoNode) => {
```

To:
```typescript
const renderActions = (node: GeoNode, hierarchyContext?: { zoneName?: string; wardName?: string; areaName?: string }) => {
  const isEditing = editing?.id === node.id;
  const isBeat = node.level === "BEAT";
  
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {!isEditing && (
        <>
          {isBeat && (
            <button
              className="btn btn-sm"
              onClick={() => setMapViewerBeat({
                id: node.id,
                name: node.name,
                zoneName: hierarchyContext?.zoneName,
                wardName: hierarchyContext?.wardName,
                areaName: hierarchyContext?.areaName
              })}
              disabled={busyId === node.id}
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "transform 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <MapIcon size={14} />
              View Map
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => startEdit(node)} disabled={busyId === node.id}>
            ✏️
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => deleteNode(node)} disabled={busyId === node.id}>
            🗑️
          </button>
        </>
      )}
      ... rest of function
    </div>
  );
};
```

### 2. Update renderActions Calls in Beat Rendering (around line 384)

Change from:
```typescript
{renderActions(b)}
```

To:
```typescript
{renderActions(b, { zoneName: z.name, wardName: w.name, areaName: a.name })}
```

### 3. Add Modal at End of Page (before closing </div>, around line 713)

Add before the closing `</div>`:
```typescript
{/* Beat Map Viewer Modal */}
{mapViewerBeat && (
  <BeatMapViewerModal
    beatId={mapViewerBeat.id}
    beatName={mapViewerBeat.name}
    zoneName={mapViewerBeat.zoneName}
    wardName={mapViewerBeat.wardName}
    areaName={mapViewerBeat.areaName}
    onClose={() => setMapViewerBeat(null)}
  />
)}
```

## Testing Steps

1. Navigate to City Admin → Area & Beat Management
2. Upload a KML file when creating a beat
3. After creation, find the beat in the hierarchy
4. Click "View Map" button next to the beat name
5. Modal should open showing the beat boundary on the map
6. Verify zone, ward, and area names are displayed correctly
7. Close modal and verify it closes properly

## API Endpoints Created

- `POST /api/city/geo` - Now accepts `kmlData` in request body
- `GET /api/city/geo/:id/kml` - Returns `{ kmlData: { name, coordinates } }`

## Components Created

- `/components/BeatMapViewerModal.tsx` - Modal component for viewing beats KML on map
