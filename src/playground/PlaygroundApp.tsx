import {useMemo, useState} from 'preact/hooks'
import SpatialScene from './SpatialScene'

export type SpeakerId = 'C' | 'FL' | 'FR' | 'SL' | 'SR' | 'RL' | 'RR' | 'SUB'

export interface Speaker {
  id: SpeakerId
  name: string
  azimuth: number
  elevation: number
  gain: number
}

export const INITIAL_SPEAKERS: Speaker[] = [
  {id: 'C', name: 'Center', azimuth: 0, elevation: 0, gain: 0},
  {id: 'FL', name: 'Front Left', azimuth: -30, elevation: 0, gain: -1.5},
  {id: 'FR', name: 'Front Right', azimuth: 30, elevation: 0, gain: -1.5},
  {id: 'SL', name: 'Side Left', azimuth: -90, elevation: 0, gain: -2},
  {id: 'SR', name: 'Side Right', azimuth: 90, elevation: 0, gain: -2},
  {id: 'RL', name: 'Rear Left', azimuth: -150, elevation: 0, gain: -2.5},
  {id: 'RR', name: 'Rear Right', azimuth: 150, elevation: 0, gain: -2.5},
  {id: 'SUB', name: 'Subwoofer', azimuth: -58, elevation: 0, gain: 0}
]

export function normalizeAzimuth(angle: number): number {
  if (!Number.isFinite(angle)) return 0
  let normalized = angle
  while (normalized > 180) normalized -= 360
  while (normalized < -180) normalized += 360
  return Object.is(normalized, -0) ? 0 : normalized
}

export function pointerPositionToAzimuth(
  clientX: number,
  clientY: number,
  bounds: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>
): number {
  const x = clientX - (bounds.left + bounds.width / 2)
  const y = clientY - (bounds.top + bounds.height / 2)
  return normalizeAzimuth(Math.round(Math.atan2(x, -y) * 180 / Math.PI))
}

function SpatialMark() {
  return (
    <span className="spatial_mark" aria-hidden="true">
      <i className="mark_core" />
      {Array.from({length: 8}, (_, index) => <i className={`mark_dot dot_${index + 1}`} key={index} />)}
    </span>
  )
}

interface DialProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  minLabel: string
  maxLabel: string
  accent?: 'blue' | 'violet'
  onChange: (value: number) => void
}

function Dial({label, value, min, max, step, unit, minLabel, maxLabel, accent = 'blue', onChange}: DialProps) {
  const ratio = (value - min) / (max - min)
  const angle = -132 + ratio * 264
  const radians = angle * Math.PI / 180
  const knobX = 50 + Math.sin(radians) * 29
  const knobY = 48 - Math.cos(radians) * 29
  const formatted = step < 1 ? value.toFixed(1) : Math.round(value).toString()

  return (
    <label className={`dial dial_${accent}`}>
      <span className="dial_label">{label}</span>
      <strong>{formatted}{unit}</strong>
      <span className="dial_visual" aria-hidden="true">
        <svg viewBox="0 0 100 80">
          <path className="dial_track" d="M 23 70 A 37 37 0 1 1 77 70" pathLength="100" />
          <path className="dial_progress" d="M 23 70 A 37 37 0 1 1 77 70" pathLength="100" style={{strokeDasharray: `${ratio * 100} 100`}} />
          <circle className="dial_knob_shadow" cx={knobX} cy={knobY} r="8" />
          <circle className="dial_knob" cx={knobX} cy={knobY} r="6.5" />
        </svg>
        <span className="dial_min">{minLabel}</span>
        <span className="dial_max">{maxLabel}</span>
      </span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(event) => onChange(event.currentTarget.valueAsNumber)}
      />
    </label>
  )
}

export default function PlaygroundApp() {
  const [speakers, setSpeakers] = useState(() => INITIAL_SPEAKERS.map((speaker) => ({...speaker})))
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<SpeakerId>('FL')
  const [guidesVisible, setGuidesVisible] = useState(true)
  const [viewResetToken, setViewResetToken] = useState(0)

  const selectedSpeaker = useMemo(
    () => speakers.find((speaker) => speaker.id === selectedSpeakerId) ?? speakers[0],
    [selectedSpeakerId, speakers]
  )

  const updateSpeaker = (id: SpeakerId, patch: Partial<Pick<Speaker, 'azimuth' | 'elevation' | 'gain'>>) => {
    setSpeakers((current) => current.map((speaker) => {
      if (speaker.id !== id) return speaker
      return {
        ...speaker,
        ...patch,
        azimuth: patch.azimuth === undefined ? speaker.azimuth : normalizeAzimuth(Math.round(patch.azimuth)),
        elevation: patch.elevation === undefined ? speaker.elevation : Math.max(-90, Math.min(90, Math.round(patch.elevation))),
        gain: patch.gain === undefined ? speaker.gain : Math.max(-12, Math.min(6, Math.round(patch.gain * 2) / 2))
      }
    }))
  }

  const reset = () => {
    setSpeakers(INITIAL_SPEAKERS.map((speaker) => ({...speaker})))
    setSelectedSpeakerId('FL')
    setViewResetToken((token) => token + 1)
  }

  return (
    <main className="playground">
      <header className="topbar">
        <div className="brand">
          <SpatialMark />
          <div>
            <h1>Spatial Audio Playground</h1>
            <p>Configure your speaker setup in real time.</p>
          </div>
        </div>
        <div className="header_actions">
          <button className="reset_button" type="button" onClick={reset}>Reset</button>
          <button
            className={`icon_button${guidesVisible ? ' is_active' : ''}`}
            type="button"
            aria-label={guidesVisible ? 'Hide placement guides' : 'Show placement guides'}
            aria-pressed={guidesVisible}
            title={guidesVisible ? 'Hide placement guides' : 'Show placement guides'}
            onClick={() => setGuidesVisible((visible) => !visible)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h7M15 7h5M11 4v6M4 17h4M12 17h8M8 14v6M4 12h11M19 12h1M15 9v6" />
            </svg>
          </button>
        </div>
      </header>

      <section className="room_panel" aria-label="Interactive 7.1 speaker room">
        <div className="scene_help">
          <span><i /> Drag a speaker to reposition</span>
          <span>Arrow keys fine-tune</span>
        </div>

        <SpatialScene
          speakers={speakers}
          selectedId={selectedSpeakerId}
          guidesVisible={guidesVisible}
          viewResetToken={viewResetToken}
          onSelect={setSelectedSpeakerId}
          onAzimuthChange={(id, azimuth) => updateSpeaker(id, {azimuth})}
        />

        <section className="control_dock" aria-label={`${selectedSpeaker.name} controls`}>
          <div className="selected_summary">
            <span className="mini_speaker" aria-hidden="true"><i /><i /></span>
            <div>
              <span className="channel_row">
                <b>{selectedSpeaker.id}</b>
                <i className="active_dot" />
              </span>
              <strong>{selectedSpeaker.name}</strong>
              <small>Active</small>
            </div>
          </div>

          <Dial
            label="Azimuth"
            value={selectedSpeaker.azimuth}
            min={-180}
            max={180}
            step={1}
            unit="°"
            minLabel="-180°"
            maxLabel="180°"
            onChange={(azimuth) => updateSpeaker(selectedSpeaker.id, {azimuth})}
          />
          <Dial
            label="Elevation"
            value={selectedSpeaker.elevation}
            min={-90}
            max={90}
            step={1}
            unit="°"
            minLabel="-90°"
            maxLabel="90°"
            onChange={(elevation) => updateSpeaker(selectedSpeaker.id, {elevation})}
          />
          <Dial
            label="Gain"
            value={selectedSpeaker.gain}
            min={-12}
            max={6}
            step={0.5}
            unit=" dB"
            minLabel="-12"
            maxLabel="+6 dB"
            accent="violet"
            onChange={(gain) => updateSpeaker(selectedSpeaker.id, {gain})}
          />
        </section>
      </section>
    </main>
  )
}
