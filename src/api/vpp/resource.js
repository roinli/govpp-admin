import request from '@/utils/request'

// 查询VPP资源台账列表
export function listResource(query) {
  return request({ url: '/vpp-event/resource/list', method: 'get', params: query })
}
// 场站可调容量列表（事件申报用）
export function listStationCapacity() {
  return request({ url: '/vpp-event/resource/station-list', method: 'get' })
}
// 查询资源统计
export function getResourceStats() {
  return request({ url: '/vpp-event/resource/stats', method: 'get' })
}
// 资源7日功率趋势（充电负荷每日均值，数据由后端定时任务模拟写入，刷新不变）
export function getResourcePower7d(resourceIds) {
  return request({ url: '/vpp-event/resource/power7d', method: 'get', params: { resourceIds: resourceIds.join(',') } })
}
// 总负荷曲线（充电负荷实时口径，分钟级数据按15分钟聚合；date 空取当天，ownerType：operator/private）
export function getLoadCurve(date, ownerType) {
  return request({ url: '/vpp-event/resource/load-curve', method: 'get', params: { date: date || '', ownerType: ownerType || '' } })
}
// 场站可调TOP排行（type：peak=削峰 valley=填谷）
export function getStationRank(type, limit) {
  return request({ url: '/vpp-event/resource/station-rank', method: 'get', params: { type: type, limit: limit || 5 } })
}
// 事件参与占比饼图（平台看运营商 / 运营商看场站 / 场站看自己）
export function getOperatorEventPie() {
  return request({ url: '/vpp-event/resource/operator-event-pie', method: 'get' })
}
// 查询资源详细
export function getResource(resourceId) {
  return request({ url: '/vpp-event/resource/' + resourceId, method: 'get' })
}
// 新增资源
export function addResource(data) {
  return request({ url: '/vpp-event/resource', method: 'post', data: data })
}
// 修改资源
export function updateResource(data) {
  return request({ url: '/vpp-event/resource', method: 'put', data: data })
}
// 批量设置参与状态
export function batchResourceStatus(data) {
  return request({ url: '/vpp-event/resource/batchStatus', method: 'put', data: data })
}
// 导出资源台账
export function exportResource(query) {
  return request({ url: '/vpp-event/resource/export', method: 'post', params: query, responseType: 'blob' })
}
// 删除资源
export function delResource(resourceIds) {
  return request({ url: '/vpp-event/resource/' + resourceIds, method: 'delete' })
}