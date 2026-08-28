import request from '@/utils/request'

// 查询需求响应事件列表
export function listEvent(query) {
  return request({ url: '/vpp-event/event/list', method: 'get', params: query })
}
// 事件统计（待响应/响应中/已结束/本月）
export function getEventStats() {
  return request({ url: '/vpp-event/event/stats', method: 'get' })
}
// 查询事件列表（不分页）
export function listEventAll(query) {
  return request({ url: '/vpp-event/event/listAll', method: 'get', params: query })
}
// 查询事件详细
export function getEvent(eventId) {
  return request({ url: '/vpp-event/event/' + eventId, method: 'get' })
}
// 新增事件
export function addEvent(data) {
  return request({ url: '/vpp-event/event', method: 'post', data: data })
}
// 修改事件
export function updateEvent(data) {
  return request({ url: '/vpp-event/event', method: 'put', data: data })
}
// 更新事件状态（手动流转 0→1→2）
export function updateEventStatus(eventId, status) {
  return request({ url: '/vpp-event/event/status/' + eventId, method: 'put', params: { status } })
}
// 删除事件
export function delEvent(eventIds) {
  return request({ url: '/vpp-event/event/' + eventIds, method: 'delete' })
}