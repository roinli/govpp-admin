<template>
  <div class="app-container dispatch-page nco-settings-container">
    <div class="new-style-menu-title">调度分配</div>

    <!-- 选择事件 -->
    <div class="dispatch-card">
      <el-form
        size="small"
        :inline="true"
        label-width="90px"
        class="ems-list-search"
        @submit.native.prevent
      >
        <el-form-item label="选择事件">
          <el-select
            v-model="curEventId"
            placeholder="请选择需求响应事件"
            filterable
            clearable
            class="ems-list-search__control dispatch-event-select"
            @change="onEventChange"
          >
            <el-option
              v-for="e in eventOptions"
              :key="e.eventId"
              :label="e.eventNo + '（' + (e.eventType === '1' ? '削峰' : '填谷') + ' ' + e.targetPower + 'kW）'"
              :value="e.eventId"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="ems-list-search__actions">
          <template v-if="isPlatform">
            <el-button
              type="primary"
              plain
              :disabled="curEvent && curEvent.status === '2'"
              @click="handleAllocate"
              v-hasPermi="['vpp:dispatch:add']"
            >一键分配</el-button>
            <el-button
              type="primary"
              plain
              :disabled="!operatorRows.length || (curEvent && curEvent.status === '2')"
              @click="handleConfirm"
              v-hasPermi="['vpp:dispatch:confirm']"
            >确认分配</el-button>
          </template>
          <template v-else>
            <el-button
              type="primary"
              plain
              :disabled="curEvent && curEvent.status === '2'"
              @click="handleAllocate"
              v-hasPermi="['vpp:dispatch:add']"
            >一键分配</el-button>
            <el-button
              type="primary"
              plain
              :disabled="!rows.length || (curEvent && curEvent.status === '2')"
              @click="handleConfirm"
              v-hasPermi="['vpp:dispatch:confirm']"
            >确认分配</el-button>
            <el-button
              type="primary"
              plain
              :disabled="!rows.length || (curEvent && curEvent.status === '2')"
              @click="handleSend"
              v-hasPermi="['vpp:dispatch:send']"
            >下发指令</el-button>
          </template>
          <el-button @click="onEventChange(curEventId)">重置</el-button>
        </el-form-item>
      </el-form>
      <p class="dispatch-rule">分配说明：平台按运营商申报量占比分配目标；运营商再向场站/桩二次分配，确认后下发指令。</p>
    </div>

    <template v-if="curEvent">
      <!-- 事件信息 -->
      <div class="dispatch-card">
        <div class="dispatch-card__title">事件信息</div>
        <div class="ev-info">
          <div class="item">
            <div class="k">事件编号</div>
            <div class="v">{{ curEvent.eventNo }}</div>
          </div>
          <div class="item">
            <div class="k">类型</div>
            <div class="v">{{ curEvent.eventType === '1' ? '削峰' : '填谷' }}</div>
          </div>
          <div class="item">
            <div class="k">时间</div>
            <div class="v v--time">{{ curEvent.startTime }} ~ {{ curEvent.endTime }}</div>
          </div>
          <div class="item">
            <div class="k">目标调节量</div>
            <div class="v">{{ curEvent.targetPower }} kW</div>
          </div>
          <div class="item">
            <div class="k">目标电量</div>
            <div class="v">{{ curEvent.targetEnergy }} kWh</div>
          </div>
          <div class="item">
            <div class="k">状态</div>
            <div class="v">
              <span :class="'badge ' + (curEvent.status === '0' ? 'orange' : curEvent.status === '1' ? 'blue' : 'green')">
                {{ curEvent.status === '0' ? '待响应' : curEvent.status === '1' ? '响应中' : '已结束' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 运营商视图：平台分配展示 -->
      <div v-if="!isPlatform" class="dispatch-card">
        <div class="dispatch-card__head">
          <div class="dispatch-card__title">平台分配</div>
          <div class="dispatch-card__meta">
            平台分配压降合计：<b class="text-primary">{{ operatorSumReduce }}</b> kW
          </div>
        </div>
        <div class="table-shell">
          <div class="table-shell__wrap">
            <el-table :data="operatorRows" class="ems-list-table">
              <template slot="empty">
                <div class="ems-list-table__empty">
                  <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                  <p class="ems-list-table__empty-text">平台尚未分配目标给您</p>
                </div>
              </template>
              <el-table-column type="index" label="序号" width="60" align="center" />
              <el-table-column label="运营商" prop="operatorName" min-width="120" align="center" show-overflow-tooltip />
              <el-table-column label="可调功率(kW)" prop="adjustablePower" align="center" min-width="110" />
              <el-table-column label="目标功率(kW)" prop="targetPower" align="center" min-width="110" />
              <el-table-column
                :label="curEvent.eventType === '2' ? '拉升量(kW)' : '压降量(kW)'"
                prop="reducePower"
                min-width="110"
                align="center"
              />
              <el-table-column label="占比" min-width="80" align="center">
                <template slot-scope="scope">{{ operatorPercent(scope.row) }}</template>
              </el-table-column>
              <el-table-column label="状态" min-width="90" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.row.status === '0'" class="badge orange">待确认</span>
                  <span v-else class="badge blue">已分配</span>
                </template>
              </el-table-column>
                <el-table-column label="创建时间" prop="createTime" min-width="140" align="center" />
                <el-table-column label="确认时间" prop="confirmTime" min-width="140" align="center" />
            </el-table>
          </div>
        </div>
      </div>

      <!-- 分配结果 -->
      <div class="dispatch-card">
        <template v-if="isPlatform">
          <div class="dispatch-card__head">
            <div class="dispatch-card__title">运营商分配</div>
            <div class="dispatch-card__meta">
              {{ curEvent.eventType === '2' ? '拉升合计' : '压降合计' }}：
              <b class="text-primary">{{ operatorSumReduce }}</b> kW　/　事件目标：
              <b>{{ curEvent.targetPower }}</b> kW
            </div>
          </div>
          <div class="table-shell">
            <div class="table-shell__wrap">
              <el-table
                v-loading="loading"
                :data="operatorRows"
                row-key="dispatchId"
                class="ems-list-table"
              >
                <template slot="empty">
                  <div class="ems-list-table__empty">
                    <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                    <p class="ems-list-table__empty-text">先选事件，再点「一键分配」按运营商申报量分配目标功率</p>
                  </div>
                </template>
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column label="运营商" prop="operatorName" min-width="120" align="center" show-overflow-tooltip />
                <el-table-column label="可调功率(kW)" prop="adjustablePower" align="center" min-width="110" />
                <el-table-column label="基线功率(kW)" prop="baselinePower" align="center" min-width="110" />
                <el-table-column label="目标功率(kW)" min-width="150" align="center">
                  <template slot-scope="scope">
                    <el-input-number
                      v-model="scope.row.targetPower"
                      :min="0"
                      :precision="2"
                      size="mini"
                      style="width:130px"
                      @change="(val, oldVal) => editOperatorTarget(scope.row, oldVal)"
                    />
                  </template>
                </el-table-column>
                <el-table-column
                  :label="curEvent.eventType === '2' ? '拉升量(kW)' : '压降量(kW)'"
                  prop="reducePower"
                  min-width="110"
                  align="center"
                />
                <el-table-column label="占比" min-width="80" align="center">
                  <template slot-scope="scope">{{ operatorPercent(scope.row) }}</template>
                </el-table-column>
                <el-table-column label="状态" min-width="90" align="center">
                  <template slot-scope="scope">
                    <span v-if="scope.row.status === '0'" class="badge orange">待确认</span>
                    <span v-else class="badge blue">已分配</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="dispatch-card__head">
            <div class="dispatch-card__title">场站/桩分配</div>
            <div class="dispatch-card__meta">
              {{ curEvent.eventType === '2' ? '拉升合计' : '压降合计' }}：
              <b class="text-primary">{{ sumReduce }}</b> kW
            </div>
          </div>
          <div class="table-shell">
            <div class="table-shell__wrap">
              <el-table
                v-loading="loading"
                :data="rows"
                row-key="dispatchId"
                class="ems-list-table"
              >
                <template slot="empty">
                  <div class="ems-list-table__empty">
                    <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                    <p class="ems-list-table__empty-text">先选事件，再点「一键分配」按场站/桩申报量分配目标功率</p>
                  </div>
                </template>
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column label="场站" prop="stationName" min-width="100" align="center" show-overflow-tooltip />
                <el-table-column label="桩编号" prop="pileNo" min-width="110" align="center" show-overflow-tooltip />
                <el-table-column label="可调功率(kW)" prop="adjustablePower" align="center" min-width="110" />
                <el-table-column label="基线功率(kW)" prop="baselinePower" align="center" min-width="110" />
                <el-table-column label="目标功率(kW)" min-width="150" align="center">
                  <template slot-scope="scope">
                    <el-input-number
                      v-model="scope.row.targetPower"
                      :min="0"
                      :precision="2"
                      size="mini"
                      style="width:130px"
                      @change="editTarget(scope.row)"
                    />
                  </template>
                </el-table-column>
                <el-table-column
                  :label="curEvent.eventType === '2' ? '拉升量(kW)' : '压降量(kW)'"
                  prop="reducePower"
                  min-width="110"
                  align="center"
                />
                <el-table-column label="占比" min-width="80" align="center">
                  <template slot-scope="scope">{{ percent(scope.row) }}</template>
                </el-table-column>
                <el-table-column label="状态" min-width="90" align="center">
                  <template slot-scope="scope">
                    <span v-if="scope.row.status === '0'" class="badge orange">待确认</span>
                    <span v-else-if="scope.row.status === '1'" class="badge blue">已确认</span>
                    <span v-else class="badge green">已下发</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </template>
      </div>
    </template>

    <div v-else class="dispatch-card dispatch-empty">
      <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
      <p class="ems-list-table__empty-text">请选择事件后进行一键分配、确认分配与指令下发</p>
    </div>
  </div>
</template>

<script>
import { listDispatchAll, allocateDispatch, confirmDispatch, sendDispatch, listOperatorDispatch, allocateByOperator, confirmOperatorDispatch } from "@/api/vpp/dispatch"
import { listEventAll } from "@/api/vpp/event"
import { getTenant } from "@/utils/auth"
import tableEmptyIcon from "@/assets/images/empty.svg"

export default {
  name: "VppDispatch",
  data() {
    return {
      loading: false,
      tableEmptyIcon,
      eventOptions: [],
      curEventId: undefined,
      curEvent: null,
      rows: [],
      operatorRows: []
    }
  },
  computed: {
    isPlatform() { return String(getTenant()) === '9999' },
    sumReduce() { return Math.round(this.rows.reduce((s,r) => s+Number(r.reducePower||0), 0) * 100) / 100 },
    operatorSumReduce() { return Math.round(this.operatorRows.reduce((s,r) => s+Number(r.reducePower||0), 0) * 100) / 100 },
    operatorSumTarget() { return Math.round(this.operatorRows.reduce((s,r) => s+Number(r.targetPower||0), 0) * 100) / 100 }
  },
  created() {
    listEventAll().then(res => {
      this.eventOptions = res.data || []
      if (this.eventOptions.length) this.onEventChange(this.eventOptions[0].eventId)
    })
  },
  methods: {
    onEventChange(eventId) {
      this.curEventId = eventId
      this.curEvent = this.eventOptions.find(x => x.eventId === eventId) || null
      this.rows = []; this.operatorRows = []
      if (this.curEvent) {
        this.loading = true
        listOperatorDispatch({ eventId: eventId }).then(res => { this.operatorRows = res.data || [] })
        if (this.isPlatform) {
          this.loading = false
        } else {
          listDispatchAll({ eventId }).then(res => { this.rows = res.data || []; this.loading = false }).catch(() => { this.loading = false })
        }
      }
    },
    editTarget(row) {
      const isPeak = !this.curEvent || this.curEvent.eventType !== '2'
      const diff = Number(row.baselinePower||0) - Number(row.targetPower||0)
      const newReduce = Math.max(0, Math.round((isPeak ? diff : -diff) * 100) / 100)
      this.$set(row, 'reducePower', newReduce)
    },
    editOperatorTarget(row, oldTarget) {
      const isPeak = !this.curEvent || this.curEvent.eventType !== '2'
      const diff = Number(row.baselinePower||0) - Number(row.targetPower||0)
      const newReduce = Math.max(0, Math.round((isPeak ? diff : -diff) * 100) / 100)
      this.$set(row, 'reducePower', newReduce)
    },
    percent(row) { const t = Number(this.operatorSumReduce||0); return t>0 ? Math.round(Number(row.reducePower||0)/t*10000)/100+'%' : '—' },
    operatorPercent(row) { const t = Number(this.curEvent?.targetPower||0); return t>0 ? Math.round(Number(row.reducePower||0)/t*10000)/100+'%' : '—' },
    handleAllocate() {
      if(!this.curEventId){this.$modal.msgWarning("请先选择事件");return}
      if (this.isPlatform) {
        this.$modal.confirm('按运营商申报量占比一键分配目标功率？').then(()=>allocateByOperator(this.curEventId)).then(()=>{this.$modal.msgSuccess("一键分配完成");this.onEventChange(this.curEventId)}).catch(()=>{})
      } else {
        this.$modal.confirm('按场站/桩申报量比例一键分配目标功率？').then(()=>allocateDispatch(this.curEventId)).then(()=>{this.$modal.msgSuccess("一键分配完成");this.onEventChange(this.curEventId)}).catch(()=>{})
      }
    },
    handleConfirm() {
      if (this.isPlatform) {
        if(!this.operatorRows.length){this.$modal.msgWarning("请先一键分配");return}
        this.$modal.confirm('确认全部运营商分配结果？').then(()=>confirmOperatorDispatch(this.operatorRows)).then(()=>{this.$modal.msgSuccess("已确认分配");this.onEventChange(this.curEventId)}).catch(()=>{})
      } else {
        if(!this.rows.length){this.$modal.msgWarning("请先一键分配");return}
        this.$modal.confirm('确认全部分配结果？').then(()=>confirmDispatch(this.rows)).then(()=>{this.$modal.msgSuccess("已确认");this.onEventChange(this.curEventId)}).catch(()=>{})
      }
    },
    handleSend() {
      const ids = this.rows.filter(r => r.status === '1').map(r => r.dispatchId)
      if(!ids.length){this.$modal.msgWarning("没有已确认的分配可下发");return}
      this.$modal.confirm('下发全部已确认的分配？').then(()=>sendDispatch(ids.join(','))).then(()=>{this.$modal.msgSuccess("指令已下发");this.onEventChange(this.curEventId)}).catch(()=>{})
    }
  }
}
</script>

<style scoped lang="scss">
.dispatch-card {
  margin-top: 16px;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px 20px;
  box-sizing: border-box;

  &:first-of-type {
    margin-top: 0.75rem;
  }
}

.dispatch-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.dispatch-card__title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
  margin-bottom: 12px;
}

.dispatch-card__head .dispatch-card__title {
  margin-bottom: 0;
}

.dispatch-card__meta {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.4;

  b {
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
  }
}

.dispatch-event-select {
  width: 26rem;
}

.dispatch-rule {
  margin: 8px 0 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.5;
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
  grid-template-columns: repeat(6, 1fr);
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

.text-primary {
  color: #0a59f7;
}

.dispatch-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 20px;
}

.dispatch-empty .ems-list-table__empty-icon {
  margin: 0 auto 12px;
}

.dispatch-empty .ems-list-table__empty-text {
  margin: 0 auto;
  max-width: 420px;
}

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.5;
}

.badge.blue {
  background: #edf3ff;
  color: #0a59f7;
}

.badge.green {
  background: #f0f9eb;
  color: #67c23a;
}

.badge.orange {
  background: #fdf6ec;
  color: #e6a23c;
}

@media (max-width: 1200px) {
  .ev-info {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
