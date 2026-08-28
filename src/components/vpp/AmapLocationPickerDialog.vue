<template>
  <el-dialog
    :visible.sync="dialogVisible"
    width="510px"
    append-to-body
    :show-close="false"
    :close-on-click-modal="false"
    custom-class="amap-location-picker-dialog"
    @opened="handleOpened"
    @closed="handleClosed"
  >
    <div slot="title" class="amap-location-picker-dialog__title" />
    <div class="dpdesign-modal-content amap-location-picker">
      <div v-loading="mapLoading" class="amap-location-picker__map-shell">
        <div class="amap-location-picker__top">
          <div class="amap-location-picker__search">
            <el-input
              v-model="keyword"
              clearable
              placeholder="请输入地址信息"
              @keyup.enter.native="searchAddress"
            />
            <el-button type="primary" class="amap-location-picker__search-btn" @click="searchAddress">
              <img :src="searchIcon" class="amap-location-picker__search-icon" alt="">
            </el-button>
          </div>
          <button type="button" class="amap-location-picker__close" aria-label="关闭" @click="handleCancel">
            <img :src="closeIcon" alt="">
          </button>
        </div>
        <div ref="mapContainer" class="amap-location-picker__map" />
      </div>

      <div class="amap-location-picker__body">
        <div class="amap-location-picker__selected">
          <span class="amap-location-picker__selected-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path fill-rule="evenodd" d="M17.8266,4.10271Q15.4115,1.75,12,1.75Q8.588470000000001,1.75,6.173360000000001,4.10271Q3.75,6.46345,3.749999046326,9.80619Q3.749999046326,12.9524,6.39602,16.7039Q7.87898,18.8065,11.32255,22.3779Q11.416640000000001,22.4755,11.46001,22.5205C11.4696,22.5304,11.47946,22.5401,11.48958,22.5495C11.63532,22.6849,11.82887,22.7568,12.02765,22.7495C12.22642,22.7422,12.41415,22.6562,12.54952,22.5104Q12.76572,22.2777,13.21375,21.7987Q16.503999999999998,18.2813,17.8592,16.298000000000002Q20.25,12.7991,20.25,9.8062Q20.25,6.46344,17.8266,4.10271ZM7.22004,5.177160000000001Q9.198319999999999,3.25,12,3.25Q14.8017,3.25,16.78,5.177160000000001Q18.75,7.0963,18.75,9.8062Q18.75,12.3355,16.6207,15.4517Q15.3302,17.340400000000002,12.11831,20.774Q12.05273,20.8441,11.99199,20.9091Q8.95053,17.723300000000002,7.6218,15.8394Q5.25,12.4766,5.25,9.80619Q5.25,7.0963,7.22004,5.177160000000001ZM14.2981,12.2981Q15.25,11.34619,15.25,10Q15.25,8.65381,14.2981,7.7019Q13.34619,6.75,12,6.75Q10.65381,6.75,9.7019,7.7019Q8.75,8.65381,8.75,10Q8.75,11.34619,9.7019,12.2981Q10.65381,13.25,12,13.25Q13.34619,13.25,14.2981,12.2981ZM13.23744,8.76256Q13.75,9.27513,13.75,10Q13.75,10.72487,13.23744,11.23744Q12.72487,11.75,12,11.75Q11.27513,11.75,10.76256,11.23744Q10.25,10.72487,10.25,10Q10.25,9.27513,10.76256,8.76256Q11.27513,8.25,12,8.25Q12.72487,8.25,13.23744,8.76256Z" />
            </svg>
          </span>
          <span class="amap-location-picker__selected-text">{{ displayAddress }}</span>
        </div>
        <div class="amap-location-picker__tip">当前位置信息将用于场站定位展示</div>

        <div class="amap-location-picker__detail">
          <button type="button" class="amap-location-picker__detail-trigger" @click="detailExpanded = !detailExpanded">
            <i class="el-icon-edit amap-location-picker__detail-icon" />
            <span class="amap-location-picker__detail-label">详细地址</span>
          </button>
          <el-input
            v-if="detailExpanded"
            v-model="detailAddress"
            type="textarea"
            :rows="3"
            class="amap-location-picker__detail-input"
            placeholder="可补充输入详细地址，用于后续运维"
          />
        </div>
      </div>
    </div>

    <div slot="footer" class="amap-location-picker__footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :disabled="!canConfirm" @click="handleConfirm">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import FRONTEND_MAP_CONFIG from '@/config/map'
import closeIcon from '@/assets/images/map-cloase.svg'
import searchIcon from '@/assets/images/map-search.svg'
import markerIcon from '@/assets/images/map_address.png'
import { geocoderByAddress, geocoderByLocation, getMapSuggestion } from '@/api/vpp/map'
import { isValidCoordinate, loadMapScript, resolveMapProvider } from '@/utils/mapProvider'

const DEFAULT_CENTER = [116.397428, 39.90923]
const MARKER_SIZE = [28, 36]

export default {
  name: 'AmapLocationPickerDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    initialAddress: {
      type: String,
      default: ''
    },
    initialLongitude: {
      type: [Number, String],
      default: undefined
    },
    initialLatitude: {
      type: [Number, String],
      default: undefined
    }
  },
  data() {
    return {
      dialogVisible: false,
      mapLoading: false,
      keyword: '',
      detailAddress: '',
      detailExpanded: false,
      closeIcon,
      searchIcon,
      currentSelection: null,
      mapInstance: null,
      marker: null,
      toolbar: null,
      geocoder: null,
      placeSearch: null
    }
  },
  computed: {
    displayAddress() {
      if (this.detailAddress && String(this.detailAddress).trim()) {
        return this.detailAddress
      }
      if (this.currentSelection && this.currentSelection.address) {
        return this.currentSelection.address
      }
      return '暂无数据'
    },
    canConfirm() {
      return !!(
        this.currentSelection &&
        isValidCoordinate(this.currentSelection.longitude, this.currentSelection.latitude)
      )
    },
    resolvedProvider() {
      return resolveMapProvider(FRONTEND_MAP_CONFIG)
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler(value) {
        this.dialogVisible = value
        if (value) {
          this.keyword = this.initialAddress || ''
          this.detailAddress = this.initialAddress || ''
          this.detailExpanded = false
          this.currentSelection = null
        }
      }
    },
    dialogVisible(value) {
      this.$emit('update:visible', value)
    }
  },
  beforeDestroy() {
    this.destroyMap()
  },
  methods: {
    async handleOpened() {
      const provider = this.resolvedProvider
      if (!provider.key || provider.provider !== 'amap') {
        this.$message.error('高德地图 Key 缺失，请在 src/config/map.js 填写 amapKey')
        return
      }
      this.mapLoading = true
      try {
        await loadMapScript(provider)
        await this.$nextTick()
        this.initMap()
        this.applyInitialSelection()
        this.refreshMapSize()
        // 弹窗动画/布局完成后再 resize，避免容器高度未定导致空白
        window.setTimeout(() => this.refreshMapSize(), 120)
        window.setTimeout(() => this.refreshMapSize(), 320)
      } catch (error) {
        this.$message.error((error && error.message) || '高德地图加载失败')
      } finally {
        this.mapLoading = false
      }
    },
    refreshMapSize() {
      if (!this.mapInstance || typeof this.mapInstance.resize !== 'function') {
        return
      }
      this.mapInstance.resize()
    },
    handleClosed() {
      this.destroyMap()
    },
    initMap() {
      if (!this.$refs.mapContainer || !window.AMap) {
        return
      }
      const center = this.getInitialCenter()
      if (!this.mapInstance) {
        this.mapInstance = new window.AMap.Map(this.$refs.mapContainer, {
          zoom: 13,
          center,
          viewMode: '2D',
          resizeEnable: true
        })
        this.mapInstance.on('click', this.handleMapClick)
        this.ensurePlugins()
      } else {
        this.mapInstance.setCenter(center)
        this.mapInstance.resize()
        this.ensurePlugins()
      }
    },
    ensurePlugins() {
      if (!window.AMap || typeof window.AMap.plugin !== 'function') {
        return
      }
      window.AMap.plugin(['AMap.Geocoder', 'AMap.PlaceSearch', 'AMap.ToolBar'], () => {
        if (!this.geocoder) {
          this.geocoder = new window.AMap.Geocoder({
            radius: 1000,
            extensions: 'all'
          })
        }
        if (!this.placeSearch) {
          this.placeSearch = new window.AMap.PlaceSearch({
            pageSize: 10,
            pageIndex: 1,
            citylimit: false
          })
        }
        if (this.mapInstance && !this.toolbar) {
          this.toolbar = new window.AMap.ToolBar({
            position: 'RB'
          })
          this.mapInstance.addControl(this.toolbar)
        }
      })
    },
    getInitialCenter() {
      if (isValidCoordinate(this.initialLongitude, this.initialLatitude)) {
        return [Number(this.initialLongitude), Number(this.initialLatitude)]
      }
      return DEFAULT_CENTER.slice()
    },
    applyInitialSelection() {
      if (isValidCoordinate(this.initialLongitude, this.initialLatitude)) {
        const longitude = Number(this.initialLongitude)
        const latitude = Number(this.initialLatitude)
        this.setSelection({
          longitude,
          latitude,
          address: this.initialAddress || ''
        }, !this.initialAddress)
        return
      }
      if (this.initialAddress) {
        this.searchAddress()
      }
    },
    handleMapClick(event) {
      if (!event || !event.lnglat) {
        return
      }
      this.resolveByLocation(event.lnglat.getLng(), event.lnglat.getLat())
    },
    searchAddress() {
      const keyword = this.keyword ? String(this.keyword).trim() : ''
      if (!keyword) {
        this.$message.warning('请输入地址信息')
        return
      }
      this.mapLoading = true
      this.searchByAmap(keyword)
        .catch(() => this.searchByBackend(keyword))
        .catch(() => {
          this.$message.warning('未搜索到匹配位置')
        })
        .finally(() => {
          this.mapLoading = false
        })
    },
    searchByAmap(keyword) {
      return new Promise((resolve, reject) => {
        if (!this.placeSearch && !this.geocoder) {
          reject(new Error('amap plugin missing'))
          return
        }
        const handlePlaceResult = (status, result) => {
          if (status === 'complete' && result && result.poiList && result.poiList.pois && result.poiList.pois.length) {
            const poi = result.poiList.pois[0]
            const location = poi.location
            this.setSelection({
              longitude: location.lng,
              latitude: location.lat,
              address: [poi.pname, poi.cityname, poi.adname, poi.address, poi.name].filter(Boolean).join('')
            }, false)
            resolve(poi)
            return
          }
          if (!this.geocoder) {
            reject(new Error('place search empty'))
            return
          }
          this.geocoder.getLocation(keyword, (geoStatus, geoResult) => {
            if (geoStatus === 'complete' && geoResult && geoResult.geocodes && geoResult.geocodes.length) {
              const item = geoResult.geocodes[0]
              this.setSelection({
                longitude: item.location.lng,
                latitude: item.location.lat,
                address: item.formattedAddress || keyword
              }, false)
              resolve(item)
              return
            }
            reject(new Error('geocoder empty'))
          })
        }
        if (this.placeSearch) {
          this.placeSearch.search(keyword, handlePlaceResult)
          return
        }
        handlePlaceResult('error')
      })
    },
    searchByBackend(keyword) {
      return geocoderByAddress({ address: keyword }).then(response => {
        const data = response.data || response || {}
        const location = data.location || {}
        const longitude = Number(location.lng)
        const latitude = Number(location.lat)
        if (isValidCoordinate(longitude, latitude)) {
          this.setSelection({
            longitude,
            latitude,
            address: data.address || keyword
          }, false)
          return data
        }
        return getMapSuggestion({ keyword }).then(suggestionResponse => {
          const suggestionData = suggestionResponse.data || suggestionResponse || {}
          const rows = suggestionData.data || suggestionData.pois || []
          if (!rows.length || !rows[0].location) {
            throw new Error('suggestion empty')
          }
          const item = rows[0]
          this.setSelection({
            longitude: Number(item.location.lng),
            latitude: Number(item.location.lat),
            address: [item.address, item.title || item.name || ''].filter(Boolean).join('') || keyword
          }, false)
          return item
        })
      })
    },
    resolveByLocation(longitude, latitude) {
      this.mapLoading = true
      this.reverseByAmap(longitude, latitude)
        .catch(() => this.reverseByBackend(longitude, latitude))
        .catch(() => {
          this.setSelection({
            longitude,
            latitude,
            address: this.detailAddress || this.keyword || ''
          }, false)
        })
        .finally(() => {
          this.mapLoading = false
        })
    },
    reverseByAmap(longitude, latitude) {
      return new Promise((resolve, reject) => {
        if (!this.geocoder) {
          reject(new Error('geocoder missing'))
          return
        }
        this.geocoder.getAddress([longitude, latitude], (status, result) => {
          if (status === 'complete' && result && result.regeocode) {
            const address = result.regeocode.formattedAddress || ''
            this.setSelection({
              longitude,
              latitude,
              address
            }, false)
            resolve(result)
            return
          }
          reject(new Error('reverse geocode empty'))
        })
      })
    },
    reverseByBackend(longitude, latitude) {
      return geocoderByLocation({
        lat: latitude,
        lng: longitude
      }).then(response => {
        const data = response.data || response || {}
        this.setSelection({
          longitude: Number(data.location && data.location.lng != null ? data.location.lng : longitude),
          latitude: Number(data.location && data.location.lat != null ? data.location.lat : latitude),
          address: data.address || ''
        }, false)
        return data
      })
    },
    setSelection(selection, needReverse) {
      this.currentSelection = {
        longitude: Number(selection.longitude),
        latitude: Number(selection.latitude),
        address: selection.address || ''
      }
      if (selection.address) {
        this.detailAddress = selection.address
      }
      this.placeMarker(this.currentSelection.longitude, this.currentSelection.latitude)
      if (this.mapInstance) {
        this.mapInstance.setCenter([this.currentSelection.longitude, this.currentSelection.latitude])
      }
      if (needReverse) {
        this.resolveByLocation(this.currentSelection.longitude, this.currentSelection.latitude)
      }
    },
    placeMarker(longitude, latitude) {
      if (!window.AMap || !this.mapInstance) {
        return
      }
      const position = [Number(longitude), Number(latitude)]
      const icon = new window.AMap.Icon({
        size: new window.AMap.Size(MARKER_SIZE[0], MARKER_SIZE[1]),
        image: markerIcon,
        imageSize: new window.AMap.Size(MARKER_SIZE[0], MARKER_SIZE[1])
      })
      if (!this.marker) {
        this.marker = new window.AMap.Marker({
          position,
          map: this.mapInstance,
          icon,
          offset: new window.AMap.Pixel(-Math.round(MARKER_SIZE[0] / 2), -MARKER_SIZE[1])
        })
      } else {
        this.marker.setIcon(icon)
        this.marker.setPosition(position)
      }
    },
    destroyMap() {
      if (this.marker) {
        this.marker.setMap(null)
        this.marker = null
      }
      if (this.mapInstance) {
        this.mapInstance.destroy()
        this.mapInstance = null
      }
      this.toolbar = null
      this.geocoder = null
      this.placeSearch = null
    },
    handleCancel() {
      this.dialogVisible = false
      this.$emit('update:visible', false)
    },
    handleConfirm() {
      if (!this.canConfirm) {
        this.$message.warning('请先在地图上选择位置')
        return
      }
      const address = (this.detailAddress && String(this.detailAddress).trim()) || this.currentSelection.address || ''
      this.$emit('confirm', {
        address,
        longitude: Number(this.currentSelection.longitude),
        latitude: Number(this.currentSelection.latitude)
      })
      this.handleCancel()
    }
  }
}
</script>

<style scoped>
.amap-location-picker {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 620px;
  padding: 0;
}

.amap-location-picker__map-shell {
  position: relative;
  flex: 1 1 auto;
  /* 必须有明确高度，否则 AMap 容器 height:100% 会塌成 0，地图不渲染 */
  height: 520px;
  min-height: 520px;
  margin: 0;
  overflow: hidden;
  border-radius: 0;
  background: #eef3fb;
}

.amap-location-picker__top {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 12;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  pointer-events: none;
}

.amap-location-picker__search,
.amap-location-picker__close {
  pointer-events: auto;
}

.amap-location-picker__search {
  display: flex;
  align-items: center;
  width: 384px;
  max-width: calc(100% - 40px);
  flex: 0 0 auto;
}

.amap-location-picker__search ::v-deep .el-input {
  flex: 1;
  min-width: 0;
}

.amap-location-picker__search ::v-deep .el-input__inner {
  height: 36px;
  line-height: 36px;
  border-radius: 6px 0 0 6px;
  border-right: 0;
  background: #fff;
}

.amap-location-picker__search-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 0 6px 6px 0;
  background: #0a59f7;
  border-color: #0a59f7;
  color: #fff;
}

.amap-location-picker__search-btn:hover,
.amap-location-picker__search-btn:focus {
  background: #0747c7;
  border-color: #0747c7;
  color: #fff;
}

.amap-location-picker__search-icon {
  display: block;
  width: 16px;
  height: 16px;
}

.amap-location-picker__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  flex-shrink: 0;
  margin-left: auto;
}

.amap-location-picker__close img {
  width: 14px;
  height: 14px;
  display: block;
}

.amap-location-picker__map {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}

.amap-location-picker__body {
  flex-shrink: 0;
  padding: 24px;
}

.amap-location-picker__selected {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 10px 14px;
  border-radius: 8px;
  background: #f5f5f5;
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.5;
}

.amap-location-picker__selected-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  color: rgba(0, 0, 0, 0.85);
  flex-shrink: 0;
}

.amap-location-picker__selected-icon svg {
  display: block;
}

.amap-location-picker__selected-text {
  flex: 1;
  min-width: 0;
  word-break: break-all;
}

.amap-location-picker__tip {
  margin: 10px 0 12px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 1.5;
}

.amap-location-picker__detail {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.amap-location-picker__detail-trigger {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.amap-location-picker__detail-icon {
  margin-right: 6px;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
}

.amap-location-picker__detail-label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.4;
}

.amap-location-picker__detail-input {
  width: 100%;
  margin-top: 8px;
}

.amap-location-picker__footer {
  text-align: right;
}

.amap-location-picker__footer .el-button + .el-button {
  margin-left: 12px;
}

.amap-location-picker__footer .el-button--primary {
  background: #0a59f7;
  border-color: #0a59f7;
}

.amap-location-picker__footer .el-button--primary:hover,
.amap-location-picker__footer .el-button--primary:focus {
  background: #0747c7;
  border-color: #0747c7;
}
</style>

<style>
.amap-location-picker-dialog {
  width: 510px !important;
  min-height: 760px;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.amap-location-picker-dialog .el-dialog__header {
  padding: 0;
  display: none;
}

.amap-location-picker-dialog .el-dialog__body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  padding: 0;
  min-height: 0;
}

.amap-location-picker-dialog .el-dialog__footer {
  padding: 0 24px 24px;
}

.amap-location-picker-dialog .dpdesign-modal-content {
  box-sizing: border-box;
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
}
</style>
