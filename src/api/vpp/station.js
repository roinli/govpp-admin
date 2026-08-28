import request from '@/utils/request'

// 查询场站列表（分页）
export function listStation(query) {
  return request({ url: '/vpp-event/station/list', method: 'get', params: query })
}
// 查询全部场站（下拉框用）
export function listAllStation() {
  return request({ url: '/vpp-event/station/all', method: 'get' })
}
// 查询场站统计
export function getStationStats() {
  return request({ url: '/vpp-event/station/stats', method: 'get' })
}
// 查询场站详细
export function getStation(stationId) {
  return request({ url: '/vpp-event/station/' + stationId, method: 'get' })
}
// 新增场站
export function addStation(data) {
  return request({ url: '/vpp-event/station', method: 'post', data: data })
}
// 修改场站
export function updateStation(data) {
  return request({ url: '/vpp-event/station', method: 'put', data: data })
}
// 删除场站
export function delStation(stationIds) {
  return request({ url: '/vpp-event/station/' + stationIds, method: 'delete' })
}
