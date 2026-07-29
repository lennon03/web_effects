import {useEffect, useRef} from 'preact/hooks'
import * as THREE from 'three'
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js'
import type {Speaker, SpeakerId} from './PlaygroundApp'

interface SpatialSceneProps {
  speakers: Speaker[]
  selectedId: SpeakerId
  guidesVisible: boolean
  viewResetToken: number
  onSelect: (id: SpeakerId) => void
  onAzimuthChange: (id: SpeakerId, azimuth: number) => void
}

interface SpeakerObject {
  group: THREE.Group
  cabinet: THREE.Mesh
  outline: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>
  guide: THREE.Line
  label: HTMLDivElement
}

const LISTENER_Z = 1.55
const SPEAKER_RADIUS = 5.15

function createMaterial(color: number, roughness = 0.72, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({color, roughness, metalness})
}

function makeBox(
  width: number,
  height: number,
  depth: number,
  radius: number,
  material: THREE.Material
) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 5, radius), material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function addSpeakerDriver(group: THREE.Group, y: number, radius: number, z: number) {
  const surround = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.82, radius * 0.12, 10, 32),
    createMaterial(0x080a0d, 0.5, 0.2)
  )
  surround.position.set(0, y, z + 0.04)
  group.add(surround)

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.055, 32),
    createMaterial(0x07090d, 0.35, 0.25)
  )
  rim.rotation.x = Math.PI / 2
  rim.position.set(0, y, z)
  rim.castShadow = true
  group.add(rim)

  const cone = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.42, radius * 0.75, 0.065, 32),
    createMaterial(0x161b22, 0.48, 0.15)
  )
  cone.rotation.x = Math.PI / 2
  cone.position.set(0, y, z + 0.035)
  group.add(cone)

  const dustCap = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.42, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    createMaterial(0x171a1f, 0.42, 0.12)
  )
  dustCap.rotation.x = Math.PI / 2
  dustCap.position.set(0, y, z + 0.08)
  group.add(dustCap)
}

function createSpeaker(id: SpeakerId): {
  group: THREE.Group
  cabinet: THREE.Mesh
  outline: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>
} {
  const group = new THREE.Group()
  const isSub = id === 'SUB'
  const isCenter = id === 'C'
  const width = isSub ? 1.14 : isCenter ? 1.62 : 0.56
  const height = isSub ? 1.34 : isCenter ? 0.64 : 0.9
  const depth = isSub ? 1.22 : isCenter ? 0.61 : 0.61
  const cabinet = makeBox(width, height, depth, 0.09, createMaterial(0x20242a, 0.54, 0.1))
  cabinet.userData.speakerId = id
  group.add(cabinet)

  const frontPlate = makeBox(
    width * (isSub ? 0.88 : 0.9),
    height * (isSub ? 0.9 : 0.86),
    0.035,
    0.055,
    createMaterial(0x1a1d21, 0.68, 0.05)
  )
  frontPlate.position.z = depth / 2 + 0.022
  frontPlate.userData.speakerId = id
  group.add(frontPlate)

  if (isSub) {
    const portRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.245, 0.045, 12, 36),
      createMaterial(0x0b0c0f, 0.56, 0.08)
    )
    portRim.position.set(0, -0.28, depth / 2 + 0.07)
    group.add(portRim)
    const port = new THREE.Mesh(
      new THREE.CircleGeometry(0.205, 36),
      new THREE.MeshBasicMaterial({color: 0x030405})
    )
    port.position.set(0, -0.28, depth / 2 + 0.075)
    group.add(port)
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({color: 0x4e86ff}))
    led.position.set(-0.36, 0.43, depth / 2 + 0.075)
    group.add(led)
  } else if (isCenter) {
    for (const x of [-0.5, 0.5]) {
      const driverGroup = new THREE.Group()
      driverGroup.position.x = x
      addSpeakerDriver(driverGroup, 0, 0.205, depth / 2 + 0.035)
      group.add(driverGroup)
    }
    addSpeakerDriver(group, 0, 0.105, depth / 2 + 0.04)
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.027, 12, 8), new THREE.MeshBasicMaterial({color: 0x4e86ff}))
    led.position.set(-0.66, 0.19, depth / 2 + 0.075)
    group.add(led)
  } else {
    addSpeakerDriver(group, -0.09, 0.215, depth / 2 + 0.035)
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.027, 12, 8), new THREE.MeshBasicMaterial({color: 0x4e86ff}))
    led.position.set(-0.18, 0.31, depth / 2 + 0.075)
    group.add(led)
    const power = new THREE.Mesh(
      new THREE.TorusGeometry(0.036, 0.008, 6, 20, Math.PI * 1.65),
      new THREE.MeshBasicMaterial({color: 0xb9bdc5})
    )
    power.position.set(0, -0.36, depth / 2 + 0.077)
    power.rotation.z = 0.55
    group.add(power)
  }

  for (const x of [-width * 0.32, width * 0.32]) {
    const foot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.065, 0.07, 16),
      createMaterial(0x101216, 0.8)
    )
    foot.position.set(x, -height / 2 - 0.035, 0)
    group.add(foot)
  }

  const edges = new THREE.EdgesGeometry(cabinet.geometry)
  const outline = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0x4f83ff, transparent: true, opacity: 0}))
  outline.scale.setScalar(1.035)
  group.add(outline)
  return {group, cabinet, outline}
}

function createSofa(scene: THREE.Scene) {
  const dark = createMaterial(0x2d3035, 0.96)
  const seam = createMaterial(0x24272b, 0.98)
  const base = makeBox(3.55, 0.42, 1.35, 0.16, seam)
  base.position.set(0, 0.34, LISTENER_Z)
  scene.add(base)

  const leftSeat = makeBox(1.55, 0.34, 1.08, 0.13, dark)
  leftSeat.position.set(-0.8, 0.65, LISTENER_Z - 0.03)
  scene.add(leftSeat)
  const rightSeat = leftSeat.clone()
  rightSeat.position.x = 0.8
  scene.add(rightSeat)

  const back = makeBox(3.3, 0.95, 0.42, 0.13, dark)
  back.position.set(0, 1.03, LISTENER_Z + 0.58)
  back.rotation.x = -0.08
  scene.add(back)

  for (const x of [-1.82, 1.82]) {
    const arm = makeBox(0.36, 0.82, 1.4, 0.14, seam)
    arm.position.set(x, 0.69, LISTENER_Z)
    scene.add(arm)
  }

  const rug = makeBox(4.35, 0.06, 2.05, 0.18, createMaterial(0xc9c9c5, 1))
  rug.position.set(0, 0.04, LISTENER_Z)
  rug.receiveShadow = true
  scene.add(rug)

  const listener = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 14), createMaterial(0x3f4247))
  listener.position.set(0, 1.18, LISTENER_Z - 0.05)
  listener.castShadow = true
  scene.add(listener)
}

function createMediaWall(scene: THREE.Scene) {
  const consoleTop = makeBox(3.7, 0.46, 0.72, 0.06, createMaterial(0xeeeeec, 0.8))
  consoleTop.position.set(0, 0.58, -5.28)
  scene.add(consoleTop)
  for (const x of [-1.65, 0, 1.65]) {
    const leg = makeBox(0.08, 0.58, 0.08, 0.015, createMaterial(0x999b99, 0.45, 0.3))
    leg.position.set(x, 0.3, -5.28)
    scene.add(leg)
  }
  const screen = makeBox(4.9, 0.22, 0.48, 0.06, createMaterial(0x17191d, 0.28, 0.28))
  screen.position.set(0, 1.78, -5.56)
  scene.add(screen)
  const stand = makeBox(0.11, 0.76, 0.1, 0.02, createMaterial(0x8f9192, 0.4, 0.35))
  stand.position.set(0, 1.25, -5.5)
  scene.add(stand)
  const soundbar = makeBox(4.35, 0.18, 0.25, 0.07, createMaterial(0x111318, 0.45, 0.22))
  soundbar.position.set(0, 1.02, -5.05)
  scene.add(soundbar)
}

function makeGuideLine() {
  const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()])
  const material = new THREE.LineDashedMaterial({color: 0x66707c, dashSize: 0.12, gapSize: 0.1, transparent: true, opacity: 0.6})
  const line = new THREE.Line(geometry, material)
  line.computeLineDistances()
  return line
}

function createAngleArc() {
  const geometry = new THREE.BufferGeometry()
  const material = new THREE.LineBasicMaterial({color: 0x4b7fff, transparent: true, opacity: 0.8})
  const line = new THREE.Line(geometry, material)
  line.position.set(0, 0.055, LISTENER_Z)
  return line
}

export default function SpatialScene(props: SpatialSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const latestProps = useRef(props)
  latestProps.current = props
  const resetViewRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    resetViewRef.current?.()
  }, [props.viewResetToken])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf4f5f7)
    scene.fog = new THREE.Fog(0xf4f5f7, 20, 31)

    const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 70)
    const resetView = () => {
      const compact = camera.aspect < 0.8
      camera.fov = compact ? 42 : 33
      camera.position.set(0, compact ? 18 : 13.8, compact ? 23 : 15.5)
      camera.lookAt(0, 0, -0.2)
      camera.updateProjectionMatrix()
    }
    resetView()
    resetViewRef.current = resetView

    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: false, powerPreference: 'high-performance'})
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    renderer.domElement.className = 'room_canvas'
    renderer.domElement.tabIndex = 0
    renderer.domElement.setAttribute('aria-label', '3D speaker map. Select a speaker, then drag or use arrow keys to adjust its azimuth.')
    host.appendChild(renderer.domElement)

    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8dce5, 2.6))
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.8)
    keyLight.position.set(-5, 13, 8)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(2048, 2048)
    keyLight.shadow.camera.left = -9
    keyLight.shadow.camera.right = 9
    keyLight.shadow.camera.top = 10
    keyLight.shadow.camera.bottom = -10
    keyLight.shadow.bias = -0.0004
    scene.add(keyLight)

    const floor = makeBox(14, 0.28, 15.6, 0.55, createMaterial(0xf0f0ef, 0.96))
    floor.position.set(0, -0.18, -0.15)
    floor.receiveShadow = true
    scene.add(floor)
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

    createSofa(scene)
    createMediaWall(scene)

    const selectedArc = createAngleArc()
    scene.add(selectedArc)
    const objects = new Map<SpeakerId, SpeakerObject>()
    const pickables: THREE.Object3D[] = []

    for (const speaker of latestProps.current.speakers) {
      const {group, cabinet, outline} = createSpeaker(speaker.id)
      scene.add(group)
      pickables.push(cabinet)
      const guide = makeGuideLine()
      scene.add(guide)
      const label = document.createElement('div')
      label.className = 'scene_label'
      label.innerHTML = `<b>${speaker.id}</b><span>${speaker.azimuth}°</span>`
      host.appendChild(label)
      objects.set(speaker.id, {group, cabinet, outline, guide, label})
    }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let draggingId: SpeakerId | null = null
    let hoveredId: SpeakerId | null = null
    let frame = 0

    const setPointer = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
    }

    const onPointerDown = (event: PointerEvent) => {
      setPointer(event)
      const hit = raycaster.intersectObjects(pickables, false)[0]
      if (!hit) return
      const id = hit.object.userData.speakerId as SpeakerId
      draggingId = id
      latestProps.current.onSelect(id)
      renderer.domElement.setPointerCapture(event.pointerId)
      renderer.domElement.classList.add('is_dragging')
      event.preventDefault()
    }

    const updateDrag = (event: PointerEvent) => {
      setPointer(event)
      if (!draggingId) {
        const hit = raycaster.intersectObjects(pickables, false)[0]
        hoveredId = hit ? hit.object.userData.speakerId as SpeakerId : null
        renderer.domElement.classList.toggle('is_hovering', Boolean(hoveredId))
        return
      }
      const point = new THREE.Vector3()
      if (!raycaster.ray.intersectPlane(floorPlane, point)) return
      const azimuth = Math.round(Math.atan2(point.x, -(point.z - LISTENER_Z)) * 180 / Math.PI)
      latestProps.current.onAzimuthChange(draggingId, azimuth)
    }

    const endDrag = (event: PointerEvent) => {
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId)
      draggingId = null
      renderer.domElement.classList.remove('is_dragging')
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
      const selected = latestProps.current.speakers.find((speaker) => speaker.id === latestProps.current.selectedId)
      if (!selected) return
      event.preventDefault()
      const increment = event.shiftKey ? 5 : 1
      const direction = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : -1
      latestProps.current.onAzimuthChange(selected.id, selected.azimuth + increment * direction)
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', updateDrag)
    renderer.domElement.addEventListener('pointerup', endDrag)
    renderer.domElement.addEventListener('pointercancel', endDrag)
    renderer.domElement.addEventListener('keydown', onKeyDown)

    const resize = () => {
      const width = host.clientWidth
      const height = host.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      resetView()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    resize()

    const projected = new THREE.Vector3()
    const render = () => {
      frame = requestAnimationFrame(render)
      const current = latestProps.current
      for (const speaker of current.speakers) {
        const object = objects.get(speaker.id)
        if (!object) continue
        const radians = speaker.azimuth * Math.PI / 180
        const x = Math.sin(radians) * SPEAKER_RADIUS
        const z = LISTENER_Z - Math.cos(radians) * SPEAKER_RADIUS
        const elevationLift = Math.sin(speaker.elevation * Math.PI / 180) * 1.2
        const isSelected = speaker.id === current.selectedId
        object.group.position.set(x, 0.56 + elevationLift, z)
        object.group.lookAt(0, object.group.position.y, LISTENER_Z)
        object.outline.material.opacity = isSelected ? 1 : hoveredId === speaker.id ? 0.48 : 0

        const positions = object.guide.geometry.attributes.position as THREE.BufferAttribute
        positions.setXYZ(0, 0, 0.055, LISTENER_Z)
        positions.setXYZ(1, x, 0.055, z)
        positions.needsUpdate = true
        object.guide.computeLineDistances()
        object.guide.visible = current.guidesVisible && speaker.id !== 'SUB'

        projected.copy(object.group.position).add(new THREE.Vector3(0, speaker.id === 'SUB' ? 0.88 : 0.78, 0)).project(camera)
        object.label.style.left = `${(projected.x * 0.5 + 0.5) * host.clientWidth}px`
        object.label.style.top = `${(-projected.y * 0.5 + 0.5) * host.clientHeight}px`
        object.label.classList.toggle('is_selected', isSelected)
        object.label.style.display = projected.z > 1 || projected.z < -1 ? 'none' : ''
        object.label.innerHTML = `<b>${speaker.id}</b><span>${speaker.azimuth}°</span>`
      }

      const selected = current.speakers.find((speaker) => speaker.id === current.selectedId)
      if (selected) {
        const segments = Math.max(2, Math.round(Math.abs(selected.azimuth) / 5))
        const points: THREE.Vector3[] = []
        for (let index = 0; index <= segments; index++) {
          const angle = (selected.azimuth * index / segments) * Math.PI / 180
          points.push(new THREE.Vector3(Math.sin(angle) * 1.05, 0, -Math.cos(angle) * 1.05))
        }
        selectedArc.geometry.dispose()
        selectedArc.geometry = new THREE.BufferGeometry().setFromPoints(points)
        selectedArc.visible = current.guidesVisible && selected.id !== 'SUB'
      }
      renderer.render(scene, camera)
    }
    render()

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', updateDrag)
      renderer.domElement.removeEventListener('pointerup', endDrag)
      renderer.domElement.removeEventListener('pointercancel', endDrag)
      renderer.domElement.removeEventListener('keydown', onKeyDown)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.LineSegments) {
          object.geometry?.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material?.dispose())
        }
      })
      renderer.dispose()
      resetViewRef.current = null
      host.replaceChildren()
    }
  }, [])

  return <div className="scene_host" ref={hostRef} />
}
