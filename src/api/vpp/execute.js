import request from '@/utils/request'

// 查询执行监测列表
export function listExecute(query) {
  return request({ url: '/vpp-dispatch/execute/list', method: 'get', params: query })
}
// 偏差监测（目标 vs 实际曲线，thresholdPercent 可选；stationId/pileNo 可选按需过滤）
export function getDeviation(eventId, thresholdPercent, stationId, pileNo) {
  return request({ url: '/vpp-dispatch/execute/deviation', method: 'get', params: { eventId: eventId, thresholdPercent: thresholdPercent, stationId: stationId, pileNo: pileNo } })
}
// 事件的桩清单（轻量，来自已下发分配）
export function listPiles(eventId) {
  return request({ url: '/vpp-dispatch/execute/piles/' + eventId, method: 'get' })
}
// 模拟生成遥测数据
export function simulateExecute(eventId) {
  return request({ url: '/vpp-dispatch/execute/simulate/' + eventId, method: 'post' })
}
// 录入执行数据
export function addExecute(data) {
  return request({ url: '/vpp-dispatch/execute', method: 'post', data: data })
}
// 更新执行数据（如记录处理备注）
export function updateExecute(data) {
  return request({ url: '/vpp-dispatch/execute', method: 'put', data: data })
}
// 删除执行数据
export function delExecute(executeIds) {
  return request({ url: '/vpp-dispatch/execute/' + executeIds, method: 'delete' })
}