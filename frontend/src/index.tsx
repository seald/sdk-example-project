import { createRoot } from 'react-dom/client'

import App from './App'
import SocketProvider from './stores/SocketContext'

import './index.css'

const container = document.getElementById('root')
if (container == null) throw new Error('No root element is defined')
const root = createRoot(container)
root.render(<SocketProvider><App /></SocketProvider>)
