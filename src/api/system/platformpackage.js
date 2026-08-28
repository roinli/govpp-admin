import request from '@/utils/request'

// 查询平台套餐列表
export function listPlatformPackage(query) {
  return request({
    url: '/system/platformpackage/list',
    method: 'get',
    params: query
  })
}

// 查询平台套餐详细
export function getPlatformPackage(id) {
  return request({
    url: '/system/platformpackage/' + id,
    method: 'get'
  })
}

// 新增平台套餐
export function addPlatformPackage(data) {
  return request({
    url: '/system/platformpackage',
    method: 'post',
    data: data
  })
}

// 修改平台套餐
export function updatePlatformPackage(data) {
  return request({
    url: '/system/platformpackage',
    method: 'put',
    data: data
  })
}

// 删除平台套餐
export function delPlatformPackage(id) {
  return request({
    url: '/system/platformpackage/' + id,
    method: 'delete'
  })
}

// 获取平台套餐精简列表（下拉选择用）
export function getPlatformPackageSimpleList() {
  return request({
    url: '/system/platformpackage/get-simple-list',
    method: 'get'
  })
}
