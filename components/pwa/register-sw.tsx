// components/pwa/register-sw.tsx
"use client"

import { useEffect } from "react"

export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker 註冊成功:", registration.scope)
        })
        .catch((error) => {
          console.log("Service Worker 註冊失敗:", error)
        })
    }
  }, [])

  return null
}
