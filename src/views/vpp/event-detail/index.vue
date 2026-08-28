<template>
  <div class="app-container event-detail-page nco-settings-container">
    <div class="event-detail-topbar">
      <div class="event-detail-topbar__left">
        <span class="event-type-tag" :class="eventTypeTagClass">{{ eventTypeLabel }}</span>
        <span class="event-meta-item">
          事件编号：<b>{{ detail.eventNo || '-' }}</b>
        </span>
        <span class="event-meta-item">
          事件状态：<span :class="'status-tag ' + statusBadge">{{ statusLabel || '-' }}</span>
        </span>
        <span class="event-meta-item">
          时段：<b>{{ detail.startTime || '-' }} ~ {{ detail.endTime || '-' }}</b>
        </span>
        <span class="event-meta-item">
          目标调节量：<b>{{ detail.targetPower || 0 }} kW</b>
        </span>
      </div>
      <div class="event-detail-topbar__right">
        <el-button type="primary" icon="el-icon-time" @click="timelineDlgOpen = true">事件时间线</el-button>
        <el-button type="primary" icon="el-icon-arrow-left" @click="$router.back()">返回</el-button>
      </div>
    </div>

    <div class="userStatisticsMain">
      <div class="topHead">
        <div class="content-top">
          <div class="topItem">
            <div class="flex-top">
              <div class="topItemName">
                <div class="topItemImg" style="background: #0C65F5">
                  <i class="el-icon-pie-chart" />
                </div>
                <span>申报率</span>
              </div>
            </div>
            <div class="topItemValue">{{ applyRate }}%</div>
            <div class="topItemSub">申报 {{ applySum }} / 目标 {{ detail.targetPower || 0 }} kW</div>
          </div>
          <div class="topItem">
            <div class="flex-top">
              <div class="topItemName">
                <div class="topItemImg" style="background: #01CB76">
                  <i class="el-icon-pie-chart" />
                </div>
                <span>分配率</span>
              </div>
            </div>
            <div class="topItemValue">{{ allocRate }}%</div>
            <div class="topItemSub">分配 {{ allocSum }} kW</div>
          </div>
          <div class="topItem">
            <div class="flex-top">
              <div class="topItemName">
                <div class="topItemImg" style="background: #6855FC">
                  <i class="el-icon-pie-chart" />
                </div>
                <span>合格率</span>
              </div>
            </div>
            <div
              class="topItemValue"
              :class="{ 'is-success': passRate !== '—' && passRate >= 80, 'is-danger': passRate !== '—' && passRate < 80 }"
            >{{ passRate }}{{ passRate === '—' ? '' : '%' }}</div>
            <div class="topItemSub">合格 {{ qualifiedCount }} / 参与 {{ joinedCount }} 站</div>
          </div>
          <div class="topItem">
            <div class="flex-top">
              <div class="topItemName">
                <div class="topItemImg" style="background: #FDB924">
                  <i class="el-icon-money" />
                </div>
                <span>结算金额(元)</span>
              </div>
            </div>
            <div class="topItemValue">{{ settleMoney }}</div>
            <div class="topItemSub">电网结算金额</div>
          </div>
        </div>
      </div>
    </div>

    <div class="detail-panel">
      <div class="detail-panel__title">
        全流程明细
        <span class="detail-panel__desc">（申报 → 分配 → 执行 → 判定 → 结算）</span>
      </div>
      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table :data="flowRows" class="ems-list-table" size="small">
            <template slot="empty">
              <div class="ems-list-table__empty">
                <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                <p class="ems-list-table__empty-text">暂无数据</p>
              </div>
            </template>
            <el-table-column label="场站" prop="name" min-width="140" show-overflow-tooltip />
            <el-table-column label="申报(kW)" prop="apply" align="right" min-width="90" />
            <el-table-column label="分配(kW)" prop="alloc" align="right" min-width="90" />
            <el-table-column label="响应电量(kWh)" prop="energy" align="right" min-width="110" />
            <el-table-column label="达成率" align="center" min-width="80">
              <template slot-scope="s">{{ s.row.rate || '—' }}</template>
            </el-table-column>
            <el-table-column label="判定" align="center" min-width="80">
              <template slot-scope="s">
                <span v-if="s.row.noapply" class="badge gray">未申报</span>
                <span v-else-if="s.row.qualified === true" class="badge green">合格</span>
                <span v-else-if="s.row.qualified === false" class="badge red">不合格</span>
                <span v-else class="text-muted">—</span>
              </template>
            </el-table-column>
            <el-table-column label="结算金额(元)" prop="money" align="right" min-width="100" />
            <el-table-column
              label="操作"
              align="center"
              width="80"
              fixed="right"
              class-name="small-padding fixed-width ems-list-table__ops"
            >
              <template slot-scope="s">
                <el-tooltip content="查看明细" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-view"
                    class="ems-list-table__ops-btn"
                    @click="showStationDetail(s.row)"
                  />
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <div class="detail-panel">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div class="detail-panel__title" style="margin-bottom:0">执行曲线</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="detail-panel__desc">选择桩</span>
          <el-select v-model="selectedPile" size="small" placeholder="请选择桩" style="width:200px" @change="renderChart">
            <el-option v-for="p in pileOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </div>
      </div>
      <div v-if="curveData.length" ref="chart" class="chart-wrap" />
      <div v-else class="detail-empty">暂无执行监测数据</div>
    </div>

    <el-dialog
      title="事件时间线"
      :visible.sync="timelineDlgOpen"
      width="520px"
      append-to-body
      custom-class="event-detail-timeline-dialog"
    >
      <div v-if="timeline.length" class="tl-track">
        <div
          v-for="(t, i) in timeline"
          :key="i"
          class="tl-track__node"
          :class="{ 'is-highlight': t.highlight }"
        >
          <div class="tl-track__time">{{ t.time || '—' }}</div>
          <div class="tl-track__name">{{ t.name }}</div>
          <div class="tl-track__desc" :class="{ 'is-highlight': t.highlight }">{{ t.desc }}</div>
        </div>
      </div>
      <div v-else class="detail-empty">暂无流程记录</div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="timelineDlgOpen = false">关 闭</el-button>
      </div>
    </el-dialog>

    <el-dialog
      :title="'场站详情 · ' + stationDlgTitle"
      :visible.sync="stationDlgOpen"
      width="540px"
      append-to-body
      custom-class="event-detail-station-dialog"
    >
      <el-descriptions v-if="stationDlgRow.name" :column="1" border>
        <el-descriptions-item label="场站">{{ stationDlgRow.name }}</el-descriptions-item>
        <el-descriptions-item label="申报调节量">{{ stationDlgRow.noapply ? '—' : stationDlgRow.apply + ' kW' }}</el-descriptions-item>
        <el-descriptions-item label="分配调节量">{{ stationDlgRow.noapply ? '—' : stationDlgRow.alloc + ' kW' }}</el-descriptions-item>
        <el-descriptions-item label="执行响应电量">{{ stationDlgRow.noapply ? '—' : (stationDlgRow.energy === '—' ? '—' : stationDlgRow.energy + ' kWh') }}</el-descriptions-item>
        <el-descriptions-item label="达成率">{{ stationDlgRow.rate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="判定">
          <span v-if="stationDlgRow.noapply" class="badge gray">未申报</span>
          <span v-else-if="stationDlgRow.qualified === true" class="badge green">合格</span>
          <span v-else-if="stationDlgRow.qualified === false" class="badge red">不合格</span>
          <span v-else class="text-muted">—</span>
        </el-descriptions-item>
        <el-descriptions-item label="结算金额">
          <span v-if="stationDlgRow.noapply" class="text-muted">未申报，未参与</span>
          <span v-else-if="stationDlgRow.qualified === true">¥{{ Number(stationDlgRow.money || 0).toFixed(2) }}（平台{{ rateText(stationDlgRow.platformRate) }}/运营商{{ rateText(stationDlgRow.operatorRate) }}/场站{{ rateText(stationDlgRow.stationRate) }}）</span>
          <span v-else-if="stationDlgRow.qualified === false" class="text-danger">0.00（不合格不计费）</span>
          <span v-else class="text-muted">—</span>
        </el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="stationDlgOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getEvent } from "@/api/vpp/event"
import { listApplyAll } from "@/api/vpp/apply"
import { listDispatchAll } from "@/api/vpp/dispatch"
import { listAssessAll } from "@/api/vpp/assess"
import { listSettlementAll } from "@/api/vpp/settlement"
import { getDeviation } from "@/api/vpp/execute"
import tableEmptyIcon from "@/assets/images/empty.svg"
import * as echarts from 'echarts'

export default {
  name: "VppEventDetail",
  data() {
    return {
      eventId: null,
      tableEmptyIcon,
      detail: {}, applies: [], dispatches: [], assesses: [], settlements: [], curveData: [],
      selectedPile: '',
      chart: null,
      stationDlgOpen: false, stationDlgTitle: '', stationDlgRow: {},
      timelineDlgOpen: false
    }
  },
  computed: {
    eventTypeLabel() { return this.detail.eventType === '1' ? '削峰' : (this.detail.eventType === '2' ? '填谷' : '事件') },
    eventTypeTagClass() { return this.detail.eventType === '1' ? 'is-peak' : 'is-valley' },
    statusLabel() { return {'0':'待响应','1':'响应中','2':'已结束'}[this.detail.status] || '' },
    statusBadge() { return {'0':'orange','1':'blue','2':'green'}[this.detail.status] || 'gray' },
    applySum() { return this.applies.reduce((s,a) => s+Number(a.applyPower||0), 0) },
    allocSum() { return Math.round(this.dispatches.reduce((s,d) => s+Number(d.reducePower||0), 0)*100)/100 },
    applyRate() { const t=Number(this.detail.targetPower||0); return t>0 ? Math.round(this.applySum/t*1000)/10 : 0 },
    allocRate() { const t=Number(this.detail.targetPower||0); return t>0 ? Math.round(this.allocSum/t*1000)/10 : 0 },
    joinedCount() { return new Set(this.applies.map(a=>a.stationName)).size },
    qualifiedCount() { return this.assesses.filter(a=>a.qualifiedFlag==='1').length },
    passRate() { if(this.detail.status !== '2') return '—'; const j=this.joinedCount; return j>0 ? Math.round(this.qualifiedCount/j*100) : 0 },
    settleMoney() { return this.detail.status === '2' ? this.settlements.reduce((s,r)=>s+Number(r.totalAmount||0),0).toFixed(2) : '—' },
    eventHours() { if(!this.detail.startTime||!this.detail.endTime)return 0; return (new Date(this.detail.endTime)-new Date(this.detail.startTime))/3600000 },
    pileOptions() { return [...new Set(this.curveData.map(p => (p.stationName || '') + ' ' + (p.pileNo || '')).filter(Boolean))] },
    hasAssess() { return this.detail.status === '2' && this.assesses.length > 0 },
    flowRows() {
      const map = {}, applySet = new Set()
      const get = n => { if(!map[n]) map[n]={name:n,apply:0,alloc:0,energy:0,qualified:null,money:0,noapply:false,rate:'—'}; return map[n] }
      this.applies.forEach(a => { get(a.stationName).apply += Number(a.applyPower||0); applySet.add(a.stationName) })
      this.dispatches.forEach(d => get(d.stationName).alloc += Number(d.reducePower||0))
      this.assesses.forEach(a => { const r = get(a.stationName); r.energy = Number(a.responseEnergy||0); r.qualified = a.qualifiedFlag==='1' })
      this.settlements.forEach(s => { const r = get(s.stationName); r.money += Number(s.totalAmount||0); r.platformRate = s.platformRate; r.operatorRate = s.operatorRate; r.stationRate = s.stationRate })
      const hours = this.eventHours
      Object.values(map).forEach(r => { r.alloc = Math.round(r.alloc*100)/100; r.apply = Math.round(r.apply*100)/100; if(!applySet.has(r.name)) r.noapply = true; if(!this.hasAssess) { r.qualified = null; r.energy = '—'; r.rate = '—' } else if(hours&&r.alloc) r.rate = (Number(r.energy||0)/(r.alloc*hours)*100).toFixed(1)+'%' })
      return Object.values(map)
    },
    timeline() {
      const earliest = (list, keys) => {
        const times = (list || []).map(item => {
          for (const k of keys) {
            if (item && item[k]) return item[k]
          }
          return ''
        }).filter(Boolean).sort()
        return times[0] || ''
      }
      const latest = (list, keys) => {
        const times = (list || []).map(item => {
          for (const k of keys) {
            if (item && item[k]) return item[k]
          }
          return ''
        }).filter(Boolean).sort()
        return times[times.length - 1] || ''
      }
      const t = [], d = this.detail
      const timeKeys = ['createTime', 'updateTime', 'applyTime', 'dispatchTime', 'assessTime', 'settleTime', 'recordTime', 'record_time']
      t.push({
        name: '创建事件',
        desc: (d.eventNo || '') + '，状态：待响应',
        time: d.createTime || d.startTime || '',
        highlight: true
      })
      if (this.applies.length) {
        t.push({
          name: '申报',
          desc: this.applies.length + ' 个场站申报，合计 ' + this.applySum + ' kW',
          time: earliest(this.applies, timeKeys)
        })
      }
      const ds = this.dispatches.filter(x => x.status === '1' || x.status === '2')
      if (ds.length) {
        t.push({
          name: '调度分配',
          desc: '按申报比例分配，合计 ' + this.allocSum + ' kW',
          time: earliest(ds, timeKeys) || latest(this.dispatches, timeKeys)
        })
      }
      if (this.curveData.length) {
        t.push({
          name: '执行监测',
          desc: '目标 ' + (d.targetPower || 0) + ' kW，' + this.curveData.length + ' 个遥测点',
          time: earliest(this.curveData, ['recordTime', 'record_time', 'createTime']) || d.startTime || '',
          highlight: true
        })
      }
      if (this.assesses.length) {
        t.push({
          name: '效果评估',
          desc: '参与 ' + this.joinedCount + ' 站，合格 ' + this.qualifiedCount + ' 站',
          time: earliest(this.assesses, timeKeys) || d.endTime || ''
        })
      }
      if (this.assesses.length) {
        t.push({
          name: '效果评估',
          desc: '参与 ' + this.joinedCount + ' 站，合格 ' + this.qualifiedCount + ' 站',
          time: earliest(this.assesses, timeKeys) || d.endTime || ''
        })
      }
      if (this.settlements.length) {
        t.push({
          name: '结算',
          desc: '电网结算 ' + this.settleMoney + ' 元',
          time: earliest(this.settlements, timeKeys) || d.endTime || '',
          highlight: true
        })
      }
      return t
    }
  },
  created() {
    this.eventId = this.$route.query.eventId
    if (this.eventId) this.loadAll()
  },
  methods: {
    loadAll() {
      getEvent(this.eventId).then(res => { this.detail = res.data || {} })
      listApplyAll({eventId: this.eventId}).then(res => { this.applies = res.data || [] })
      listDispatchAll({eventId: this.eventId}).then(res => { this.dispatches = res.data || [] })
      listAssessAll({eventId: this.eventId}).then(res => { this.assesses = res.data || [] })
      listSettlementAll({eventId: this.eventId}).then(res => { this.settlements = res.data || [] })
      getDeviation(this.eventId).then(res => {
        this.curveData = res.data || []
        if (!this.selectedPile && this.pileOptions.length) this.selectedPile = this.pileOptions[0]
        this.$nextTick(() => this.renderChart())
      })
    },
    renderChart() {
      if (!this.curveData.length || !this.$refs.chart) return
      if (!this.chart) {
        this.chart = echarts.init(this.$refs.chart)
        this._chartResize = () => { this.chart && this.chart.resize() }
        window.addEventListener('resize', this._chartResize)
      }
      // 按选择的桩聚合（默认第一个桩）
      let pts = this.curveData
      if (this.selectedPile) pts = pts.filter(p => (p.stationName || '') + ' ' + (p.pileNo || '') === this.selectedPile)
      const fmt = t => { const s=(t||'').toString(); const m=s.match(/(\d{2}:\d{2}:\d{2})/); return m?m[1]:s }
      const map = {}; pts.forEach(p => { const t=fmt(p.recordTime||p.record_time); if(!map[t])map[t]={plan:0,actual:0}; map[t].plan+=Number(p.planPower||0)*100; map[t].actual+=Number(p.actualPower||0)*100 })
      Object.values(map).forEach(v=>{v.plan=Math.round(v.plan)/100;v.actual=Math.round(v.actual)/100})
      const times = Object.keys(map).sort()
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
          data: times,
          axisLine: { lineStyle: { color: '#ececec' } },
          axisTick: { show: false },
          axisLabel: { color: '#999', rotate: times.length > 12 ? 30 : 0 }
        },
        color: ['#457DFF', '#F9C84B'],
        series: [
          {
            name: '目标',
            type: 'line',
            smooth: true,
            symbolSize: [10, 10],
            data: times.map(t => map[t].plan),
            lineStyle: { color: '#457DFF', width: 3 },
            itemStyle: { color: '#457DFF' }
          },
          {
            name: '实际',
            type: 'line',
            smooth: true,
            symbolSize: [10, 10],
            data: times.map(t => map[t].actual),
            lineStyle: { color: '#F9C84B', width: 3 },
            itemStyle: { color: '#F9C84B' }
          }
        ]
      })
    },
    showStationDetail(row) { this.stationDlgRow = row; this.stationDlgTitle = row.name || ''; this.stationDlgOpen = true },
    rateText(v) { return Math.round(Number(v||0)*100) + '%' }
  },
  beforeDestroy() {
    if (this._chartResize) window.removeEventListener('resize', this._chartResize)
    if (this.chart) { this.chart.dispose(); this.chart = null }
  }
}
</script>

<style scoped lang="scss">
.event-detail-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  background: #fff;
  border-radius: 8px;
  padding: 14px 20px;
}

.event-detail-topbar__left {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  min-width: 0;
  flex: 1;
}

.event-detail-topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.event-type-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  line-height: 1;
  flex-shrink: 0;

  &.is-peak {
    background: #0a59f7;
  }

  &.is-valley {
    background: #FDB924;
  }
}

.event-meta-item {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.5;
  white-space: nowrap;

  b {
    color: rgba(0, 0, 0, 0.85);
    font-weight: 600;
  }
}

.status-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.5;
  border: 1px solid transparent;
  vertical-align: middle;
}

.status-tag.blue {
  background: #edf3ff;
  color: #0a59f7;
  border-color: #0a59f7;
}

.status-tag.green {
  background: #f0f9eb;
  color: #67c23a;
  border-color: #67c23a;
}

.status-tag.orange {
  background: #fff8e8;
  color: #FDB924;
  border-color: #FDB924;
}

.status-tag.gray {
  background: #f4f4f5;
  color: #909399;
  border-color: #dcdfe6;
}

.userStatisticsMain {
  width: 100%;
  position: relative;
  margin-top: 16px;

  .topHead {
    width: 100%;

    .content-top {
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      align-items: center;

      .topItem {
        margin-right: 15px;
        background: linear-gradient(135deg, #ffffff 0%, #f7faff 100%);
        border: 1px solid #eef1f7;
        padding: 12px 15px;
        width: calc(100% / 4 - (15px * 3 / 4));
        margin-bottom: 0;
        min-height: 112px;
        height: auto;
        font-size: 20px;
        color: #666666;
        border-radius: 10px;
        box-shadow: 0 4px 14px rgba(31,45,61,0.06);
        display: flex;
        flex-direction: column;
        justify-content: center;
        box-sizing: border-box;

        &:nth-child(4n) {
          margin-right: 0;
        }

        .topItemImg {
          width: 36px;
          height: 36px;
          background: #01CB76;
          border-radius: 8px;
          box-shadow: 0 6px 12px rgba(0,0,0,0.08);
          margin-right: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        i {
          font-size: 18px;
          color: #fff;
        }

        .flex-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .topItemName {
          font-weight: 400;
          font-size: 16px;
          color: #666666;
          display: flex;
          align-items: center;
        }

        .topItemValue {
          font-weight: 400;
          font-size: 20px;
          color: #131212;
          margin-top: 12px;
          line-height: 1.2;

          &.is-success {
            color: #67c23a;
          }

          &.is-danger {
            color: #f56c6c;
          }
        }

        .topItemSub {
          margin-top: 6px;
          font-size: 12px;
          color: rgba(0, 0, 0, 0.45);
          line-height: 1.4;
        }
      }
    }
  }
}

.detail-panel {
  margin-top: 16px;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px 20px;
  box-sizing: border-box;
}

.detail-panel__title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
  margin-bottom: 12px;
}

.detail-panel__desc {
  font-weight: 400;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-left: 4px;
}

.detail-empty {
  text-align: center;
  padding: 32px 16px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.chart-wrap {
  height: 320px;
  background: #fff;
  border-radius: 6px;
  box-sizing: border-box;
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
.badge.gray { background: #f4f4f5; color: #909399; }

.text-muted { color: #c0c4cc; }
.text-danger { color: #f56c6c; }
</style>

<style>
.event-detail-station-dialog .el-dialog__title,
.event-detail-timeline-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.event-detail-station-dialog .el-dialog__header,
.event-detail-timeline-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.event-detail-station-dialog .el-dialog__body {
  padding: 20px 24px 8px;
}

.event-detail-station-dialog .el-descriptions-item__label {
  background-color: #f7f7f7 !important;
  border-right: 1px solid #e4e7ed !important;
  color: #464646 !important;
  font-weight: 400;
  font-size: 14px;
  width: 120px;
  text-align: right !important;
}

.event-detail-station-dialog .el-descriptions-item__content {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
}

.event-detail-station-dialog .el-descriptions .el-descriptions-item__cell {
  border-color: #e4e7ed !important;
  height: 42px;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  vertical-align: middle;
}

.event-detail-timeline-dialog .el-dialog__header {
  text-align: center;
}

.event-detail-timeline-dialog .el-dialog__title {
  width: 100%;
  display: block;
  text-align: center;
}

.event-detail-timeline-dialog .el-dialog__headerbtn {
  top: 18px;
}

.event-detail-timeline-dialog .el-dialog__body {
  padding: 20px 28px 8px;
  max-height: 60vh;
  overflow-y: auto;
}

.event-detail-timeline-dialog .el-dialog__footer {
  padding: 12px 24px 20px;
}

.event-detail-timeline-dialog .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.event-detail-timeline-dialog .tl-track {
  position: relative;
  padding-left: 24px;
}

.event-detail-timeline-dialog .tl-track::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 10px;
  bottom: 10px;
  border-left: 1px dashed #d9d9d9;
}

.event-detail-timeline-dialog .tl-track__node {
  position: relative;
  padding: 0 0 22px 14px;
}

.event-detail-timeline-dialog .tl-track__node:last-child {
  padding-bottom: 0;
}

.event-detail-timeline-dialog .tl-track__node::before {
  content: '';
  position: absolute;
  left: -24px;
  top: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #0a59f7;
  border: 3px solid rgba(10, 89, 247, 0.28);
  box-sizing: border-box;
  box-shadow: 0 0 0 2px #fff;
  z-index: 1;
}

.event-detail-timeline-dialog .tl-track__time {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
  margin-bottom: 4px;
}

.event-detail-timeline-dialog .tl-track__name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
  margin-bottom: 2px;
}

.event-detail-timeline-dialog .tl-track__desc {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.5;
}

.event-detail-timeline-dialog .tl-track__desc.is-highlight {
  color: #FDB924;
  font-weight: 500;
}
</style>
