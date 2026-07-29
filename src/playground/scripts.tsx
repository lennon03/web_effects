import {render} from 'preact'
import PlaygroundApp from './PlaygroundApp'
import './styles.css'

export function renderPlayground(rootElement: HTMLElement) {
  render(<PlaygroundApp />, rootElement)
}
