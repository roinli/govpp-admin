<template>
  <div class="app-container execute-page nco-settings-container">
    <div class="new-style-menu-title">执行监测</div>

    <!-- 选择事件 -->
    <div class="execute-card">
      <el-form
        size="small"
        :inline="true"
        label-width="90px"
        class="ems-list-search"
        @submit.native.prevent
      >
        <el-form-item label="选择事件">
          <el-select
            v-model="queryParams.eventId"
            placeholder="请选择事件查看偏差曲线"
            filterable
            clearable
            class="ems-list-search__control execute-event-select"
            @change="handleEventChange"
          >
            <el-option
              v-for="e in eventOptions"
              :key="e.eventId"
              :label="e.eventNo + '（' + (e.eventType === '1' ? '削峰' : '填谷') + ' ' + e.targetPower + 'kW）'"
              :value="e.eventId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="偏差阈值">
          <el-input-number
            v-model="threshold"
            :min="0"
            :max="100"
            class="ems-list-search__control execute-threshold"
            @change="handleThresholdChange"
          />
          <span class="execute-unit">%</span>
        </el-form-item>
        <el-form-item label="偏差状态">
          <el-select
            v-model="deviationFilter"
            placeholder="全部"
            clearable
            class="ems-list-search__control execute-deviation"
          >
            <el-option label="正常" value="normal" />
            <el-option label="偏差超标" value="alert" />
            <el-option label="已处理" value="handled" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="curvePoints.length" class="execute-alert-tip">
          <span v-if="alertCount > 0" class="tip tip--danger">告警：{{ alertCount }} 个数据点偏差超 {{ threshold }}%</span>
          <span v-else class="tip tip--success">全部数据点偏差在阈值内</span>
        </el-form-item>
        <el-form-item class="ems-list-search__actions">
          <el-button
            type="primary"
            plain
            icon="el-icon-s-data"
            :disabled="!currentEvent || currentEvent.status !== '1'"
            @click="handleSimulate"
          >实时采集</el-button>
          <el-button icon="el-icon-refresh" @click="refreshData">刷新数据</el-button>
        </el-form-item>
      </el-form>
      <p class="execute-rule">监测说明：按偏差阈值对比目标功率与实际功率；削峰看正偏差、填谷看负偏差，超阈值标记告警。</p>
    </div>

    <template v-if="queryParams.eventId">
      <!-- 事件信息 -->
      <div v-if="currentEvent" class="execute-card">
        <div class="execute-card__title">事件信息</div>
        <div class="ev-info">
          <div class="item">
            <div class="k">事件编号</div>
            <div class="v">{{ currentEvent.eventNo }}</div>
          </div>
          <div class="item">
            <div class="k">类型</div>
            <div class="v">{{ currentEvent.eventType === '1' ? '削峰' : '填谷' }}</div>
          </div>
          <div class="item">
            <div class="k">时段</div>
            <div class="v v--time">{{ currentEvent.startTime }} ~ {{ currentEvent.endTime }}</div>
          </div>
          <div class="item">
            <div class="k">目标调节量</div>
            <div class="v">{{ currentEvent.targetPower }} kW</div>
          </div>
          <div class="item">
            <div class="k">状态</div>
            <div class="v">
              <span v-if="currentEvent.status === '0'" class="badge orange">待响应</span>
              <span v-else-if="currentEvent.status === '1'" class="badge blue">响应中</span>
              <span v-else class="badge green">已结束</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 偏差曲线 -->
      <div v-if="chartEventId" class="execute-card">
        <div class="execute-card__head">
          <div class="execute-card__title">偏差曲线</div>
          <div class="execute-card__actions">
            <span class="execute-card__meta-inline">选择桩</span>
            <el-select
              v-model="selectedPile"
              size="small"
              placeholder="请选择桩"
              class="execute-pile-select"
              @change="loadChart(chartEventId)"
            >
              <el-option
                v-for="p in pileOptions"
                :key="p.stationId + '_' + p.pileNo"
                :label="p.stationName + ' ' + p.pileNo"
                :value="p.stationId + '_' + p.pileNo"
              />
            </el-select>
          </div>
        </div>
        <div ref="chart" class="chart-wrap" />
      </div>

      <!-- 执行数据点 / 告警列表 -->
      <div class="execute-card">
        <div class="execute-card__title">执行数据点 / 告警列表</div>
        <div class="table-shell">
          <div class="table-shell__wrap">
            <el-table
              v-loading="loading"
              :data="filteredExecuteList"
              class="ems-list-table"
              :row-class-name="rowClassName"
            >
              <template slot="empty">
                <div class="ems-list-table__empty">
                  <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                  <p class="ems-list-table__empty-text">暂无数据</p>
                </div>
              </template>
              <el-table-column label="序号" min-width="60" align="center">
                <template slot-scope="scope">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</template>
              </el-table-column>
              <el-table-column label="时间" prop="recordTime" min-width="150" align="center" />
              <el-table-column label="场站" prop="stationName" min-width="100" align="center" show-overflow-tooltip />
              <el-table-column label="桩编号" prop="pileNo" min-width="120" align="center" show-overflow-tooltip />
              <el-table-column label="目标(kW)" prop="planPower" align="center" min-width="90" />
              <el-table-column label="实际(kW)" prop="actualPower" align="center" min-width="90" />
              <el-table-column label="偏差率" align="center" min-width="90">
                <template slot-scope="scope">
                  <span :class="isAlert(scope.row) ? 'text-danger' : 'text-success'">{{ deviationText(scope.row) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="偏差状态" align="center" min-width="90">
                <template slot-scope="scope">
                  <span v-if="isAlert(scope.row) && !scope.row.remark" class="badge red">偏差超标</span>
                  <span v-else-if="isAlert(scope.row) && scope.row.remark" class="badge blue">已处理</span>
                  <span v-else class="badge green">正常</span>
                </template>
              </el-table-column>
              <el-table-column
                label="操作"
                align="center"
                width="80"
                fixed="right"
                class-name="small-padding fixed-width ems-list-table__ops"
              >
                <template slot-scope="scope">
                  <el-tooltip
                    v-if="isAlert(scope.row) && !scope.row.remark"
                    content="处理"
                    placement="top"
                    effect="light"
                    popper-class="ems-list-tooltip"
                  >
                    <el-button
                      type="text"
                      icon="el-icon-edit"
                      class="ems-list-table__ops-btn"
                      @click="handleAlert(scope.row)"
                    />
                  </el-tooltip>
                  <span v-else-if="isAlert(scope.row) && scope.row.remark" class="text-muted" :title="scope.row.remark">已处理</span>
                  <span v-else class="text-muted">—</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="table-footer">
            <pagination
              v-show="total > 0"
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              @pagination="getList"
            />
          </div>
        </div>
      </div>
    </template>

    <div v-else class="execute-card execute-empty">
      <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
      <p class="ems-list-table__empty-text">请选择事件查看偏差曲线与执行数据；可先「实时采集」生成遥测点，再按偏差阈值监测告警</p>
    </div>

    <el-dialog
      title="处理告警"
      :visible.sync="alertOpen"
      width="520px"
      append-to-body
      custom-class="execute-alert-dialog"
    >
      <el-form label-width="90px">
        <el-form-item label="处理说明">
          <el-input
            v-model="alertRemark"
            type="textarea"
            :rows="3"
            placeholder="请输入处理说明"
          />
        </el-form-item>
        <el-form-item label="偏差阈值">
          <span class="text-muted">{{ threshold }}%</span>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="alertOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitAlert">保 存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { listExecute, getDeviation, listPiles, simulateExecute, updateExecute } from "@/api/vpp/execute"
import { listEventAll } from "@/api/vpp/event"
import tableEmptyIcon from "@/assets/images/empty.svg"

export default {
  name: "VppExecute",
  data() {
    return {
      loading: false,
      executeList: [],
      deviationFilter: '',
      eventOptions: [],
      total: 0,
      tableEmptyIcon,
      chartEventId: undefined,
      chart: null,
      threshold: 20,
      curvePoints: [],
      alertCount: 0,
      pileOptions: [],
      queryParams: { pageNum: 1, pageSize: 12, eventId: undefined },
      selectedPile: '',
      alertOpen: false,
      alertRow: {},
      alertRemark: ''
    }
  },
  computed: {
    currentEvent() { return this.eventOptions.find(e => e.eventId === this.queryParams.eventId) || null },
    filteredExecuteList() {
      if (!this.deviationFilter) return this.executeList
      return this.executeList.filter(row => {
        const alert = this.isAlert(row)
        if (this.deviationFilter === 'normal') return !alert
        if (this.deviationFilter === 'alert') return alert && !row.remark
        if (this.deviationFilter === 'handled') return alert && row.remark
        return true
      })
    }
  },
  created() {
    listEventAll().then(res => {
      this.eventOptions = res.data || []
      if (this.eventOptions.length) this.handleEventChange(this.eventOptions[0].eventId)
    })
  },
  methods: {
    getList() {
      if (!this.queryParams.eventId) {
        this.executeList = []
        this.total = 0
        return
      }
      this.loading = true
      listExecute(this.queryParams).then(r => {
        this.executeList = r.data || []
        this.total = r.total || 0
        this.loading = false
      }).catch(() => { this.loading = false })
    },
    handleEventChange(eventId) {
      this.chartEventId = eventId
      this.queryParams.eventId = eventId
      this.queryParams.pageNum = 1
      this.selectedPile = ''
      if (!eventId) {
        this.executeList = []
        this.total = 0
        this.curvePoints = []
        this.alertCount = 0
        this.pileOptions = []
        if (this.chart) {
          this.chart.dispose()
          this.chart = null
        }
        return
      }
      this.getList()
      this.pileOptions = []
      this.curvePoints = []
      this.loadPiles(eventId)
    },
    loadPiles(eventId) {
      listPiles(eventId).then(res => {
        this.pileOptions = res.data || []
        if (this.pileOptions.length) {
          const first = this.pileOptions[0]
          this.selectedPile = first.stationId + '_' + first.pileNo
        }
        this.loadChart(eventId)
      })
    },
    loadChart(eventId) {
      // 按当前选中的桩按需请求，仅返回该桩数据（桩多时避免全量传输）
      const opt = this.pileOptions.find(p => (p.stationId + '_' + p.pileNo) === this.selectedPile) || {}
      getDeviation(eventId, this.threshold, opt.stationId, opt.pileNo).then(res => {
        const pts = res.data || []
        this.curvePoints = pts
        this.alertCount = pts.filter(p => p.alertFlag === '1').length
        this.$nextTick(() => {
          if (!this.$refs.chart) return
          if (!this.chart) {
            this.chart = echarts.init(this.$refs.chart)
            this._chartResize = () => { this.chart && this.chart.resize() }
            window.addEventListener('resize', this._chartResize)
          }
          const fmt = t => { const s = (t || '').toString(); const m = s.match(/(\d{2}:\d{2}:\d{2})/); return m ? m[1] : s }
          const filtered = opt.pileNo ? pts.filter(p => p.pileNo === opt.pileNo) : pts
          const map = {}
          filtered.forEach(p => {
            const t = fmt(p.recordTime || p.record_time)
            if (!map[t]) map[t] = { plan: 0, actual: 0, alert: false }
            map[t].plan += Number(p.planPower || 0) * 100
            map[t].actual += Number(p.actualPower || 0) * 100
            if (p.alertFlag === '1') map[t].alert = true
          })
          const timeSet = Object.keys(map).sort()
          const plan = timeSet.map(t => Math.round(map[t].plan) / 100)
          const actual = timeSet.map(t => ({
            value: Math.round(map[t].actual) / 100,
            symbol: map[t].alert ? 'circle' : 'emptyCircle',
            symbolSize: map[t].alert ? 12 : 10,
            itemStyle: {
              color: map[t].alert ? '#F56C6C' : '#F9C84B',
              borderColor: '#fff',
              borderWidth: map[t].alert ? 2 : 0
            }
          }))
          this.chart.setOption({
            tooltip: {
              trigger: 'axis',
              axisPointer: { type: 'line', lineStyle: { color: '#eee' } },
              show: true,
              backgroundColor: 'white',
              extraCssText: 'box-shadow: 3px 3px 3px rgba(100, 100, 100, 0.3);padding:10px',
              textStyle: { color: 'black' }
            },
            legend: {
              right: 20,
              top: 12,
              textStyle: { color: '#999' },
              data: [{ name: '目标' }, { name: '实际' }]
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '8%',
              top: 56,
              containLabel: true
            },
            yAxis: {
              type: 'value',
              name: 'kW',
              nameTextStyle: { color: '#999' },
              axisLine: { lineStyle: { color: '#ececec' } },
              axisTick: { show: false },
              axisLabel: { color: '#999' },
              splitLine: { lineStyle: { color: '#f0f0f0' } }
            },
            xAxis: {
              type: 'category',
              data: timeSet,
              axisLine: { lineStyle: { color: '#ececec' } },
              axisTick: { show: false },
              axisLabel: { color: '#999', rotate: timeSet.length > 12 ? 30 : 0 }
            },
            color: ['#457DFF', '#F9C84B'],
            series: [
              {
                name: '目标',
                type: 'line',
                smooth: true,
                symbolSize: [10, 10],
                data: plan,
                lineStyle: { color: '#457DFF', width: 3 },
                itemStyle: { color: '#457DFF' }
              },
              {
                name: '实际',
                type: 'line',
                smooth: true,
                data: actual,
                lineStyle: { color: '#F9C84B', width: 3 },
                itemStyle: { color: '#F9C84B' }
              }
            ]
          })
        })
      })
    },
    handleThresholdChange() {
      if (this.chartEventId) this.loadChart(this.chartEventId)
    },
    handleSimulate() {
      if (!this.currentEvent || this.currentEvent.status !== '1') {
        this.$modal.msgWarning("只有响应中的事件才能实时采集")
        return
      }
      simulateExecute(this.queryParams.eventId).then(res => {
        this.$modal.msgSuccess(res.msg || "模拟数据已生成")
        this.getList()
        if (this.chartEventId) this.loadChart(this.chartEventId)
      }).catch(() => {
        this.$modal.msgError("采集失败，请确认事件为响应中且有已下发的分配")
      })
    },
    rowClassName({ row }) {
      return this.isAlert(row) ? 'alerted' : ''
    },
    refreshData() {
      this.getList()
      if (this.chartEventId) this.loadChart(this.chartEventId)
      this.$modal.msgSuccess("已刷新")
    },
    deviationOf(row) {
      const p = Number(row.planPower || 0)
      const a = Number(row.actualPower || 0)
      return p ? Math.round((a - p) / p * 1000) / 10 : 0
    },
    deviationText(row) {
      const d = this.deviationOf(row)
      return (d > 0 ? '+' : '') + d + '%'
    },
    isAlert(row) {
      const d = this.deviationOf(row)
      const isPeak = !this.currentEvent || this.currentEvent.eventType !== '2'
      return isPeak ? d > this.threshold : (-d) > this.threshold
    },
    handleAlert(row) {
      this.alertRow = row
      this.alertRemark = row.stationName + ' ' + row.pileNo + ' 偏差' + this.deviationOf(row).toFixed(1) + '%，已确认'
      this.alertOpen = true
    },
    submitAlert() {
      if (!this.alertRemark.trim()) {
        this.$modal.msgWarning('请输入处理说明')
        return
      }
      const rk = this.alertRemark + ' [阈值:' + this.threshold + '%]'
      updateExecute({ executeId: this.alertRow.executeId, remark: rk }).then(() => {
        this.$modal.msgSuccess('已记录处理说明')
        this.alertRow.remark = rk
        this.alertOpen = false
        this.getList()
        if (this.chartEventId) this.loadChart(this.chartEventId)
      })
    }
  },
  beforeDestroy() {
    if (this._chartResize) window.removeEventListener('resize', this._chartResize)
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  }
}
</script>

<style scoped lang="scss">
.execute-card {
  margin-top: 16px;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px 20px;
  box-sizing: border-box;

  &:first-of-type {
    margin-top: 0.75rem;
  }
}

.execute-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.execute-card__title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
  margin-bottom: 12px;
}

.execute-card__head .execute-card__title {
  margin-bottom: 0;
}

.execute-card__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.execute-card__meta-inline {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
}

.execute-event-select {
  width: 26rem;
}

.execute-threshold {
  width: 8rem;
}

.execute-unit {
  margin-left: 6px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

.execute-alert-tip {
  margin-left: 4px;
}

.execute-rule {
  margin: 8px 0 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.5;
}

.tip {
  font-size: 13px;
  line-height: 1.4;
}

.tip--danger {
  color: #f56c6c;
}

.tip--success {
  color: #67c23a;
}

::v-deep .ems-list-search__actions .el-button + .el-button {
  margin-left: 1rem;
}

::v-deep .ems-list-search__actions .el-button--primary.is-plain:not(.is-disabled) {
  color: #0a59f7;
  background: #fff;
  border-color: #0a59f7;
}

::v-deep .ems-list-search__actions .el-button--primary.is-plain:hover:not(.is-disabled),
::v-deep .ems-list-search__actions .el-button--primary.is-plain:focus:not(.is-disabled) {
  color: #fff;
  background: #0a59f7;
  border-color: #0a59f7;
}

::v-deep .ems-list-search__actions .el-button--primary.is-plain.is-disabled,
::v-deep .ems-list-search__actions .el-button--primary.is-plain.is-disabled:hover,
::v-deep .ems-list-search__actions .el-button--primary.is-plain.is-disabled:focus {
  color: #c0c4cc;
  background: #fff;
  border-color: #ebeef5;
  cursor: not-allowed;
}

.ev-info {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 8px;
  box-sizing: border-box;
}

.ev-info .item {
  text-align: center;
  min-width: 0;
}

.ev-info .item .k {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  line-height: 1.4;
}

.ev-info .item .v {
  font-size: 15px;
  font-weight: 600;
  margin-top: 6px;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
  word-break: break-all;
}

.ev-info .item .v--time {
  font-size: 13px;
  font-weight: 500;
}

.execute-pile-select {
  width: 200px;
}

.chart-wrap {
  height: 320px;
  background: #fff;
  border-radius: 6px;
}

.execute-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 20px;
}

.execute-empty .ems-list-table__empty-icon {
  margin: 0 auto 12px;
}

.execute-empty .ems-list-table__empty-text {
  margin: 0 auto;
  max-width: 420px;
}

.text-danger {
  color: #f56c6c;
}

.text-success {
  color: #67c23a;
}

.text-muted {
  color: #c0c4cc;
  font-size: 12px;
}

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.5;
}

.badge.blue { background: #edf3ff; color: #0a59f7; }
.badge.green { background: #f0f9eb; color: #67c23a; }
.badge.orange { background: #fdf6ec; color: #e6a23c; }
.badge.red { background: #fef0f0; color: #f56c6c; }

::v-deep .el-table .alerted td {
  background: #fef0f0 !important;
}
</style>

<style>
.execute-alert-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.execute-alert-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.execute-alert-dialog .el-dialog__body {
  padding: 20px 24px 8px;
}

.execute-alert-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}
</style>
