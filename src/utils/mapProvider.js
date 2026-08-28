let amapScriptPromise = null

export function isValidCoordinate(longitude, latitude) {
  const lng = Number(longitude)
  const lat = Number(latitude)
  if (Number.isNaN(lng) || Number.isNaN(lat)) {
    return false
  }
  if (lng === 0 && lat === 0) {
    return false
  }
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90
}

export function resolveMapProvider(mapConfig) {
  const config = mapConfig || {}
  return {
    provider: config.provider || 'amap',
    key: config.amapKey || '',
    securityJsCode: config.amapSecurityJsCode || ''
  }
}

export function loadMapScript(providerInfo) {
  if (!providerInfo || !providerInfo.key) {
    return Promise.reject(new Error('高德地图 Key 缺失，请在 src/config/map.js 或环境变量 VUE_APP_AMAP_KEY 中配置'))
  }
  if (window.AMap) {
    return Promise.resolve(window.AMap)
  }
  if (amapScriptPromise) {
    return amapScriptPromise
  }
  const { key, securityJsCode } = providerInfo
  if (securityJsCode) {
    window._AMapSecurityConfig = {
      securityJsCode: String(securityJsCode)
    }
  }
  const version = securityJsCode ? '2.0' : '1.4.15'
  amapScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `https://webapi.amap.com/maps?v=${version}&key=${encodeURIComponent(key)}&callback=__vppAmapReady`
    script.onerror = error => {
      amapScriptPromise = null
      reject(error)
    }
    window.__vppAmapReady = () => {
      delete window.__vppAmapReady
      if (window.AMap) {
        resolve(window.AMap)
      } else {
        amapScriptPromise = null
        reject(new Error('AMap 加载失败'))
      }
    }
    document.head.appendChild(script)
  })
  return amapScriptPromise
}
