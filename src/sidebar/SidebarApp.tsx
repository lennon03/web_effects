import './styles.css'

const bands = [
  {frequency: '60', gain: '+1.5', q: '0.7', type: 'low shelf', position: 42},
  {frequency: '170', gain: '-0.5', q: '1.2', type: 'peak', position: 54},
  {frequency: '350', gain: '+2.0', q: '1.5', type: 'peak', position: 36},
  {frequency: '1k', gain: '-1.0', q: '1.0', type: 'peak', position: 58},
  {frequency: '3.5k', gain: '+0.5', q: '0.8', type: 'peak', position: 47},
  {frequency: '10k', gain: '+1.0', q: '0.7', type: 'high shelf', position: 43}
]

function PowerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2v10M6.34 5.34a8 8 0 1 0 11.32 0" />
    </svg>
  )
}

function FilterIcon({type}: {type: string}) {
  const path = type === 'low shelf'
    ? 'M3 16h5c2 0 2-8 6-8h7'
    : type === 'high shelf'
      ? 'M3 8h7c4 0 4 8 6 8h5'
      : 'M3 16c4 0 4-8 9-8s5 8 9 8'

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
      <path d="M3 20h18" className="filter_axis" />
    </svg>
  )
}

function Stepper({value, unit, label}: {value: string, unit?: string, label: string}) {
  return (
    <div className="stepper" aria-label={`${label}: ${value}${unit ? ` ${unit}` : ''}`}>
      <button type="button" aria-label={`Decrease ${label}`}>−</button>
      <span>{value}{unit && <small>{unit}</small>}</span>
      <button type="button" aria-label={`Increase ${label}`}>+</button>
    </div>
  )
}

function BandControl({band, index}: {band: typeof bands[number], index: number}) {
  return (
    <article className="band">
      <button className="filter_button" type="button" aria-label={`Band ${index + 1} filter: ${band.type}`}>
        <FilterIcon type={band.type} />
        <span className="band_number">{index + 1}</span>
      </button>
      <div className="gain_control" aria-label={`Band ${index + 1} gain: ${band.gain} decibels`}>
        <div className="gain_track">
          <span className="gain_fill" style={{height: `${100 - band.position}%`}} />
          <i style={{top: `${band.position}%`}} />
        </div>
        <span>{band.gain} <small>dB</small></span>
      </div>
      <Stepper value={band.frequency} unit="Hz" label={`band ${index + 1} frequency`} />
      <Stepper value={band.q} label={`band ${index + 1} Q`} />
    </article>
  )
}

function EqControls() {
  return (
    <div className="eq_controls">
      <div className="control_labels" aria-hidden="true">
        <span>Filter</span>
        <span>Gain</span>
        <span>Frequency</span>
        <span>Q</span>
      </div>
      <div className="bands_scroller">
        <div className="bands">
          {bands.map((band, index) => (
            <BandControl band={band} index={index} key={band.frequency} />
          ))}
        </div>
      </div>
      <div className="scroll_hint" aria-hidden="true">
        <span>Scroll for all bands</span>
        <svg viewBox="0 0 24 24">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </div>
  )
}

export default function SidebarApp() {
  return (
    <main className="sidebar_app">
      <header className="app_header">
        <div>
          <p className="eyebrow">Sound shaping</p>
          <h1>Equalizer</h1>
        </div>
        <button className="power_button" type="button" aria-label="Bypass equalizer"><PowerIcon /></button>
      </header>

      <section className="eq_panel" aria-labelledby="eq-title">
        <div className="section_heading">
          <div>
            <h2 id="eq-title">Parametric EQ</h2>
            <p>Six independent filters</p>
          </div>
          <div className="gain_readout"><span>Output</span><strong>0.0 dB</strong></div>
        </div>
        <EqControls />
      </section>

      <section className="convolver_panel" aria-labelledby="convolver-title">
        <div className="section_heading">
          <div>
            <p className="eyebrow">Space</p>
            <h2 id="convolver-title">Convolver</h2>
          </div>
          <span className="status_badge"><i /> Ready</span>
        </div>
        <div className="impulse_dropzone">
          <div className="waveform" aria-hidden="true">
            {[10, 20, 36, 68, 34, 18, 50, 26, 14, 8, 5, 3].map((height, index) => (
              <i key={index} style={{height: `${height}%`}} />
            ))}
          </div>
          <div className="impulse_copy">
            <strong>Load impulse response</strong>
            <span>WAV or AIFF · up to 30 seconds</span>
          </div>
          <button className="load_button" type="button">Choose file</button>
        </div>
        <footer className="convolver_footer">
          <span>No impulse loaded</span>
          <div><span>Mix</span><strong>35%</strong></div>
        </footer>
      </section>
    </main>
  )
}
