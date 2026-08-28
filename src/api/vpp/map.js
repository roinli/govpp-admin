import request from '@/utils/request'

export function geocoderByLocation(params) {
  return request({
    url: '/vpp/map/geocoder',
    method: 'get',
    params,
    skipErrorMessage: true
  })
}

export function geocoderByAddress(params) {
  return request({
    url: '/vpp/map/geocoder/address',
    method: 'get',
    params,
    skipErrorMessage: true
  })
}

export function getMapSuggestion(params) {
  return request({
    url: '/vpp/map/suggestion',
    method: 'get',
    params,
    skipErrorMessage: true
  })
}
