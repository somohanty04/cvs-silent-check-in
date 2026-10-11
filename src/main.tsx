import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

/*
  Phone view. On any screen wider than a phone (desktop browser, tablet, narrow preview pane), the prototype loads itself inside a 402 × 874 pt
  device frame so it is always reviewed at the agreed iPhone size. On a phone, or inside the frame,
  the app renders full screen. Query parameters (e.g. ?coupons=error) are passed through.
*/
const DEVICE = { width: 402, height: 874, bezel: 12 }
const inFrame = window.self !== window.top
const wideScreen = window.matchMedia('(min-width: 480px)').matches

function PhoneFrame() {
  const fullWidth = DEVICE.width + DEVICE.bezel * 2
  const fullHeight = DEVICE.height + DEVICE.bezel * 2
  const fit = () => Math.min(1, (window.innerHeight - 48) / fullHeight, (window.innerWidth - 48) / fullWidth)
  const [scale, setScale] = useState(fit)
  useEffect(() => {
    const onResize = () => setScale(fit())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const src = `${window.location.pathname}${window.location.search}${window.location.hash}`
  return (
    <div className="phone-stage">
      <div className="phone-device" style={{ width: fullWidth, height: fullHeight, transform: `scale(${scale})`, marginBottom: (scale - 1) * fullHeight }}>
        <iframe title="CVS app prototype" src={src} width={DEVICE.width} height={DEVICE.height} />
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {!inFrame && wideScreen ? <PhoneFrame /> : <App />}
  </React.StrictMode>,
)
