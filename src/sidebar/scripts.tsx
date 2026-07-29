import {render} from 'preact'
import SidebarApp from './SidebarApp'
import {renderPlayground} from '../playground/scripts'
import './styles.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Extension page root element not found')
}

if (location.pathname.endsWith('/playground/index.html')) {
  renderPlayground(rootElement)
} else {
  render(<SidebarApp />, rootElement as HTMLElement)
}
