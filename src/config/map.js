/**
 * 高德地图
 * Key 申请：https://console.amap.com/dev/key/app
 */
export const FRONTEND_MAP_CONFIG = {
  provider: 'amap',
  amapKey: String(process.env.VUE_APP_AMAP_KEY || '').trim(),
  amapSecurityJsCode: String(process.env.VUE_APP_AMAP_SECURITY_JS_CODE || '').trim()
}

export default FRONTEND_MAP_CONFIG
