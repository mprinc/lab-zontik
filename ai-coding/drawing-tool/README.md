# Drawing Learning Tool

This prototype runs entirely in the browser and captures stylus or trackpad input with pressure so each stroke can be stored and replayed independently. Open `index.html` in a supported browser (Chromium, Edge, or latest Firefox) with a pressure-capable tablet or a Mac trackpad connected.

## Key Features

- **Per-stroke vectors** – every stroke is recorded with an ordered point list that includes `x`, `y`, `pressure`, and elapsed `time` (ms) from the stroke start.
- **Pressure-aware rendering** – line width scales with the recorded pressure (with a small floor so mouse input remains visible).
- **Replay mode** – rebuilds the drawing using the original timing to reproduce the child’s stroke rhythm.
- **Trackpad friendly** – supports Mac touchpads via Force/pressure data when available and falls back to sensible widths when not.
- **Live console** – view a running log of canvas interactions to debug pointer/pressure behaviour quickly.
- **Import/Export** – copy the structured JSON, download it, or load an existing recording back into the tool.

## Suggested Workflow

1. Connect a stylus-enabled tablet or rely on a Mac touchpad, then open the tool in a recent desktop browser that supports Pointer Events.
2. Draw on the canvas; the HUD shows the current pressure reading. On a Mac trackpad, click-drag or Force Click to vary pressure.
3. Use **Replay** to observe timing, **Undo** to remove the last stroke, and **Clear** to reset.
4. Export the vector data via **Download JSON** or **Copy** for further analysis/training inputs.

The JSON schema exported by the tool matches the structure displayed in the “Vector Data” panel, making it easy to feed into other analytics or sketch playback pipelines.
