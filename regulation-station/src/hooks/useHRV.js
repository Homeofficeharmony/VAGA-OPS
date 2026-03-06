import { useState, useRef, useCallback } from 'react'

const BASELINE_KEY = 'vaga-hrv-baseline'
const RR_WINDOW = 60 // keep last N R-R intervals for RMSSD

function parseHRM(value) {
  // Heart Rate Measurement characteristic parsing
  const flags = value.getUint8(0)
  const is16bit = flags & 0x1
  const hr = is16bit ? value.getUint16(1, true) : value.getUint8(1)
  const rrStart = is16bit ? 3 : 2
  const rr = []
  for (let i = rrStart; i + 1 < value.byteLength; i += 2) {
    rr.push((value.getUint16(i, true) / 1024) * 1000) // → milliseconds
  }
  return { hr, rr }
}

function calcRMSSD(intervals) {
  if (intervals.length < 2) return null
  const diffs = intervals.slice(1).map((v, i) => v - intervals[i])
  return Math.sqrt(diffs.reduce((s, d) => s + d * d, 0) / diffs.length)
}

function loadBaseline() {
  try { return JSON.parse(localStorage.getItem(BASELINE_KEY)) || [] } catch { return [] }
}
function saveBaseline(arr) {
  try { localStorage.setItem(BASELINE_KEY, JSON.stringify(arr)) } catch {}
}

export function useHRV() {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [hr, setHr] = useState(null)
  const [rmssd, setRmssd] = useState(null)
  const [suggestedState, setSuggestedState] = useState(null)

  const deviceRef = useRef(null)
  const charRef = useRef(null)
  const rrBufferRef = useRef([])
  const baselineRef = useRef(loadBaseline()) // array of past rmssd values (up to 5)

  const onData = useCallback((event) => {
    const { hr: bpm, rr } = parseHRM(event.target.value)
    setHr(bpm)

    if (rr.length > 0) {
      rrBufferRef.current = [...rrBufferRef.current, ...rr].slice(-RR_WINDOW)
      const current = calcRMSSD(rrBufferRef.current)
      if (current !== null) {
        setRmssd(Math.round(current))

        // Update baseline (rolling 5-session average)
        const bl = baselineRef.current
        if (bl.length >= 5) bl.shift()
        bl.push(current)
        baselineRef.current = bl
        saveBaseline(bl)

        // Suggest state based on rmssd vs baseline mean
        if (bl.length >= 2) {
          const mean = bl.reduce((s, v) => s + v, 0) / bl.length
          const ratio = current / mean
          if (ratio < 0.70) setSuggestedState('frozen')
          else if (ratio < 0.90) setSuggestedState('anxious')
          else setSuggestedState('flow')
        }
      }
    }
  }, [])

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      alert('Web Bluetooth is not supported in this browser. Use Chrome or Edge.')
      return
    }
    try {
      setConnecting(true)
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
      })
      deviceRef.current = device
      device.addEventListener('gattserverdisconnected', () => {
        setConnected(false)
        setHr(null)
        setRmssd(null)
        setSuggestedState(null)
      })

      const server = await device.gatt.connect()
      const service = await server.getPrimaryService('heart_rate')
      const char = await service.getCharacteristic('heart_rate_measurement')
      charRef.current = char
      char.addEventListener('characteristicvaluechanged', onData)
      await char.startNotifications()
      setConnected(true)
    } catch (err) {
      if (err.name !== 'NotFoundError') console.error('BLE connect error:', err)
    } finally {
      setConnecting(false)
    }
  }, [onData])

  const disconnect = useCallback(async () => {
    try {
      charRef.current?.removeEventListener('characteristicvaluechanged', onData)
      await charRef.current?.stopNotifications()
      deviceRef.current?.gatt?.disconnect()
    } catch {}
    setConnected(false)
    setHr(null)
    setRmssd(null)
  }, [onData])

  return { connected, connecting, hr, rmssd, suggestedState, connect, disconnect }
}
