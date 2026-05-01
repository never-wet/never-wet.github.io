import { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Compass,
  Crosshair,
  LocateFixed,
  MapPin,
  Plane,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { CameraMode } from "./types";
import { useFlightStore } from "./store/useFlightStore";

interface UIOverlayProps {
  onCameraModeChange: (mode: CameraMode) => void;
  onGoToLocation: () => void;
  onRecover: () => void;
  onResetSandbox: () => void;
  onSearch: (query: string) => void;
  onSandbox: () => void;
  onTakeoffPractice: () => void;
}

const CAMERA_MODES: Array<{ label: string; value: CameraMode }> = [
  { label: "Third", value: "third" },
  { label: "Cockpit", value: "cockpit" },
  { label: "Free", value: "free" },
  { label: "Chase", value: "cinematic" },
];

function formatSpeed(speedMps: number) {
  return Math.round(speedMps * 3.6);
}

export function UIOverlay({
  onCameraModeChange,
  onGoToLocation,
  onRecover,
  onResetSandbox,
  onSearch,
  onSandbox,
  onTakeoffPractice,
}: UIOverlayProps) {
  const [query, setQuery] = useState("");
  const {
    buildingInfo,
    cameraMode,
    impactNotice,
    interiorOpen,
    mapStatus,
    mapStatusMessage,
    sandboxStatus,
    searchStatus,
    setCameraMode,
    setInteriorOpen,
    telemetry,
  } = useFlightStore();

  const headingLabel = useMemo(() => `${Math.round(telemetry.headingDegrees).toString().padStart(3, "0")} deg`, [
    telemetry.headingDegrees,
  ]);
  const warningLabel = useMemo(() => {
    const warnings = [
      telemetry.stallWarning ? "STALL" : "",
      telemetry.terrainWarning ? "TERRAIN" : "",
    ].filter(Boolean);

    if (warnings.length > 0) {
      return warnings.join(" / ");
    }

    return telemetry.isLanded ? "LANDED" : "CLEAR";
  }, [telemetry.isLanded, telemetry.stallWarning, telemetry.terrainWarning]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const selectCamera = (mode: CameraMode) => {
    setCameraMode(mode);
    onCameraModeChange(mode);
  };

  return (
    <div className="hud">
      <header className="hud__topbar" aria-label="Flight simulator controls">
        <form className="location-search" onSubmit={handleSubmit}>
          <Search size={17} aria-hidden="true" />
          <input
            aria-label="Search location"
            placeholder="Search city, street, or neighborhood"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">Fly</button>
        </form>

        <button className="icon-button" type="button" onClick={onGoToLocation} title="Go to my location">
          <LocateFixed size={18} aria-hidden="true" />
          <span>My Location</span>
        </button>

        <div className="segmented" aria-label="Camera mode">
          {CAMERA_MODES.map((mode) => (
            <button
              key={mode.value}
              className={mode.value === cameraMode ? "is-active" : ""}
              type="button"
              onClick={() => selectCamera(mode.value)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </header>

      <aside className="hud__left" aria-label="Flight controls guide">
        <div className="panel-title">
          <Plane size={18} aria-hidden="true" />
          <span>Flight Controls</span>
        </div>
        <dl className="control-list">
          <div>
            <dt>W / S</dt>
            <dd>Throttle</dd>
          </div>
          <div>
            <dt>A / D</dt>
            <dd>Roll</dd>
          </div>
          <div>
            <dt>Arrow Up / Down</dt>
            <dd>Pitch up / down</dd>
          </div>
          <div>
            <dt>Q / E</dt>
            <dd>Rudder yaw</dd>
          </div>
          <div>
            <dt>Space</dt>
            <dd>Airbrake</dd>
          </div>
          <div>
            <dt>C</dt>
            <dd>Camera mode</dd>
          </div>
          <div>
            <dt>R</dt>
            <dd>Safe recovery</dd>
          </div>
          <div>
            <dt>Mouse drag</dt>
            <dd>Camera look</dd>
          </div>
        </dl>

        <div className="sandbox-actions">
          <button type="button" onClick={onSandbox}>
            <ShieldCheck size={16} aria-hidden="true" />
            Training Sandbox
          </button>
          <button type="button" onClick={onTakeoffPractice}>
            <Plane size={16} aria-hidden="true" />
            Runway start
          </button>
          <button type="button" onClick={onResetSandbox}>
            <RotateCcw size={16} aria-hidden="true" />
            Reset sandbox
          </button>
        </div>
        <div className="sandbox-status">
          <span>Training Sandbox</span>
          <strong>{sandboxStatus.intactStructures} / {sandboxStatus.totalStructures}</strong>
          <p>{sandboxStatus.lastEvent}</p>
        </div>
      </aside>

      <aside className="hud__right" aria-label="Building information">
        <div className="panel-title">
          <Building2 size={18} aria-hidden="true" />
          <span>Building Scan</span>
        </div>

        {buildingInfo ? (
          <>
            <h2>{buildingInfo.name}</h2>
            <p>{buildingInfo.address}</p>
            <div className="building-meta">
              <span>{buildingInfo.type}</span>
              <span>{buildingInfo.source === "click" ? "Clicked" : "Nearby"}</span>
              <span>Inspection only</span>
            </div>
            {buildingInfo.coordinates ? (
              <p className="coordinates">
                {buildingInfo.coordinates.latitude}, {buildingInfo.coordinates.longitude}
              </p>
            ) : null}
            <button className="interior-button" type="button" onClick={() => setInteriorOpen(true)}>
              Enter placeholder
            </button>
          </>
        ) : (
          <p className="empty-copy">Click a streamed 3D building or fly close to inspect available OSM metadata.</p>
        )}
      </aside>

      {interiorOpen && buildingInfo ? (
        <div className="interior" role="dialog" aria-modal="true" aria-labelledby="interior-title">
          <div className="interior__panel">
            <div className="panel-title">
              <MapPin size={18} aria-hidden="true" />
              <span id="interior-title">Entry View</span>
            </div>
            <h2>{buildingInfo.name}</h2>
            <p>
              Interior data is represented as a safe placeholder. This keeps exploration focused on location context
              without inventing private indoor details.
            </p>
            <div className="interior__grid" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <button type="button" onClick={() => setInteriorOpen(false)}>
              Return to flight
            </button>
          </div>
        </div>
      ) : null}

      <div className={`status-toast status-toast--${mapStatus}`}>
        <Compass size={16} aria-hidden="true" />
        <span>{searchStatus || mapStatusMessage}</span>
      </div>

      {impactNotice ? (
        <button className="impact-toast" type="button" onClick={onRecover}>
          <RotateCcw size={16} aria-hidden="true" />
          {impactNotice}
        </button>
      ) : null}

      {telemetry.impactState === "recovering" ? (
        <div className="recovery-fade" role="status" aria-live="polite">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>Impact detected - recovery active</span>
        </div>
      ) : null}

      <footer className="hud__bottom" aria-label="Flight instruments">
        <div>
          <span>Airspeed</span>
          <strong>{formatSpeed(telemetry.speedMps)} km/h</strong>
        </div>
        <div>
          <span>MSL</span>
          <strong>{Math.round(telemetry.altitudeMeters)} m</strong>
        </div>
        <div>
          <span>AGL</span>
          <strong>{Math.round(telemetry.altitudeAglMeters)} m</strong>
        </div>
        <div>
          <span>Heading</span>
          <strong>{headingLabel}</strong>
        </div>
        <div>
          <span>Throttle</span>
          <strong>{Math.round(telemetry.throttle * 100)}%</strong>
        </div>
        <div>
          <span>Vertical</span>
          <strong>{telemetry.verticalSpeedMps >= 0 ? "+" : ""}{Math.round(telemetry.verticalSpeedMps)} m/s</strong>
        </div>
        <div>
          <span>Attitude</span>
          <strong>{Math.round(telemetry.pitchDegrees)} / {Math.round(telemetry.rollDegrees)}</strong>
        </div>
        <div className={telemetry.stallWarning || telemetry.terrainWarning ? "instrument-alert instrument-alert--danger" : "instrument-alert"}>
          <span>Warnings</span>
          <strong>{warningLabel}</strong>
        </div>
        <div>
          <span>FPS</span>
          <strong>{Math.round(telemetry.fps)}</strong>
        </div>
      </footer>

      <Crosshair className="reticle" size={28} aria-hidden="true" />
    </div>
  );
}
