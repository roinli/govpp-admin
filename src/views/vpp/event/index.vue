<template>
  <div class="app-container event-page nco-settings-container">
    <div class="new-style-menu-title">事件管理</div>

    <div class="nco-settings-container-content event-content-split">
      <div class="event-search-card">
        <el-form
          ref="queryForm"
          :model="queryParams"
          size="small"
          :inline="true"
          label-width="90px"
          class="ems-list-search event-list-search"
          @submit.native.prevent
        >
          <div class="event-list-search__grid event-list-search__grid--primary">
            <el-form-item label="事件类型" prop="eventType" class="event-list-search__item event-list-search__item--type">
              <el-select
                v-model="queryParams.eventType"
                placeholder="请选择事件类型"
                clearable
                class="ems-list-search__control"
                @change="handleQuery"
              >
                <el-option label="削峰" value="1" />
                <el-option label="填谷" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status" class="event-list-search__item event-list-search__item--status">
              <el-select
                v-model="queryParams.status"
                placeholder="请选择状态"
                clearable
                class="ems-list-search__control"
                @change="handleQuery"
              >
                <el-option label="待响应" value="0" />
                <el-option label="响应中" value="1" />
                <el-option label="已结束" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="组织方" prop="organizer" class="event-list-search__item event-list-search__item--organizer">
              <el-input
                v-model="queryParams.organizer"
                placeholder="组织方"
                clearable
                class="ems-list-search__control"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="关键词" prop="keyword" class="event-list-search__item event-list-search__item--keyword event-list-search__keyword--row1">
              <el-input
                v-model="queryParams.keyword"
                placeholder="事件编号"
                clearable
                class="ems-list-search__control"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item class="ems-list-search__actions event-list-search__item event-list-search__item--actions">
              <el-button type="primary" @click="handleQuery">查询</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-form-item>
          </div>
          <div class="event-list-search__row event-list-search__row--secondary">
            <el-form-item label="关键词" class="event-list-search__item event-list-search__item--keyword event-list-search__keyword--row2">
              <el-input
                v-model="queryParams.keyword"
                placeholder="事件编号"
                clearable
                class="ems-list-search__control"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="事件开始时间" class="event-list-search__item event-list-search__item--daterange">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="~"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                class="ems-list-search__daterange"
                @change="handleQuery"
              />
            </el-form-item>
          </div>
        </el-form>
      </div>

      <div class="event-content-card">
        <div class="event-toolbar">
          <div class="event-toolbar__left">
            <el-radio-group v-model="viewMode" size="small" @change="handleViewModeChange">
              <el-radio-button label="card"><i class="el-icon-s-grid" /> 卡片</el-radio-button>
              <el-radio-button label="list"><i class="el-icon-s-operation" /> 列表</el-radio-button>
            </el-radio-group>
          </div>
          <div class="event-toolbar__right">
            <el-button plain @click="handleAutoReceive">自动接收</el-button>
            <el-button type="primary" @click="handleAdd" v-hasPermi="['vpp:event:add']">新建事件</el-button>
          </div>
        </div>

        <div class="table-shell">
          <div class="table-shell__wrap">
            <div v-if="viewMode === 'card'" v-loading="loading" class="event-card-grid">
            <div v-for="row in eventList" :key="row.eventId" class="event-card" :class="'event-card--' + (row.status === '0' ? 'wait' : row.status === '1' ? 'run' : 'end')">
              <!-- 头部：事件编号 + 状态 + 组织方 -->
              <div class="event-card__header">
                <div class="event-card__title-row">
                  <span class="event-card__no">{{ row.eventNo }}</span>
                  <span class="event-card__status" :class="row.status === '0' ? 'wait' : row.status === '1' ? 'run' : 'end'">
                    {{ row.status === '0' ? '待响应' : row.status === '1' ? '响应中' : '已结束' }}
                  </span>
                </div>
                <div class="event-card__tags">
                  <span v-if="row.eventType === '1'" class="badge red">削峰</span>
                  <span v-else class="badge purple">填谷</span>
                  <span class="event-card__duration">{{ durationText(row) }}</span>
                </div>
                <div class="event-card__organizer">
                  <i class="el-icon-user" />
                  <span>{{ row.organizer || '—' }}</span>
                </div>
              </div>

              <!-- 待响应：突出申报进度 -->
              <template v-if="row.status === '0'">
                <div class="event-card__metrics">
                  <div class="stat">
                    <span class="stat-val">{{ row.targetPower }}</span>
                    <span class="stat-label">目标(kW)</span>
                  </div>
                  <div class="stat">
                    <span class="stat-val">{{ row.applyPower > 0 ? row.applyPower : '—' }}</span>
                    <span class="stat-label">已申报(kW)</span>
                  </div>
                  <div class="stat">
                    <span class="stat-val">{{ row.applyCount || 0 }}</span>
                    <span class="stat-label">参与场站</span>
                  </div>
                </div>
                <div class="event-card__progress">
                  <div class="event-card__progress-label">
                    <span>申报进度</span>
                    <span>{{ row.applyPower > 0 ? Math.round(row.applyPower / row.targetPower * 100) + '%' : '未申报' }}</span>
                  </div>
                  <div class="event-card__progress-track">
                    <div class="event-card__progress-fill" :style="{ width: row.targetPower > 0 ? Math.min(row.applyPower / row.targetPower * 100, 100) + '%' : '0%' }" />
                  </div>
                </div>
              </template>

              <!-- 响应中：突出实时功率对比 -->
              <template v-else-if="row.status === '1'">
                <div class="event-card__metrics event-card__metrics--highlight">
                  <div class="stat stat--gray">
                    <span class="stat-val">{{ row.targetPower }}</span>
                    <span class="stat-label">目标功率(kW)</span>
                  </div>
                  <div class="stat stat--gray">
                    <span class="stat-val">{{ row.targetEnergy != null ? Number(row.targetEnergy).toFixed(2) : '—' }}</span>
                    <span class="stat-label">目标电量(kWh)</span>
                  </div>
                  <div class="stat stat--blue">
                    <span class="stat-val">{{ row.actualPower || 0 }}</span>
                    <span class="stat-label">实时功率(kW)</span>
                  </div>
                  <div class="stat stat--blue">
                    <span class="stat-val">{{ row.respEnergy != null ? Number(row.respEnergy).toFixed(2) : '—' }}</span>
                    <span class="stat-label">响应电量(kWh)</span>
                  </div>
                </div>
                <div class="event-card__progress">
                  <div class="event-card__progress-label">
                    <span>完成进度</span>
                    <span>{{ row.progress != null ? row.progress + '%' : '0%' }}</span>
                  </div>
                  <div class="event-card__progress-track event-card__progress-track--active">
                    <div class="event-card__progress-fill event-card__progress-fill--active" :style="{ width: (row.progress != null ? row.progress : 0) + '%' }" />
                  </div>
                </div>
                <div class="event-card__time-info">
                  <i class="el-icon-time" />
                  <span>已持续 {{ elapsedText(row) }}</span>
                </div>
              </template>

              <!-- 已结束：场站数 + 结算金额 + 合格率 -->
              <template v-else>
                <div class="event-card__metrics event-card__metrics--result">
                  <div class="stat stat--gray">
                    <span class="stat-val">{{ row.applyCount || 0 }}</span>
                    <span class="stat-label">参与场站数</span>
                  </div>
                  <div class="stat stat--green">
                    <span class="stat-val">{{ row.qualifiedCount || 0 }}</span>
                    <span class="stat-label">合格场站数</span>
                  </div>
                  <div class="stat stat--green">
                    <span class="stat-val">{{ row.settleAmount ? '¥' + row.settleAmount : '—' }}</span>
                    <span class="stat-label">结算金额</span>
                  </div>
                </div>
                <div class="event-card__result-bar">
                  <div class="event-card__result-label">
                    <span>合格率</span>
                    <span class="event-card__result-percent">{{ row.applyCount > 0 ? Math.round((row.qualifiedCount || 0) / row.applyCount * 100) : 0 }}%</span>
                  </div>
                  <div class="event-card__result-track">
                    <div class="event-card__result-fill" :style="{ width: row.applyCount > 0 ? Math.min((row.qualifiedCount || 0) / row.applyCount * 100, 100) + '%' : '0%' }" />
                  </div>
                </div>
              </template>

              <!-- 底部信息 -->
              <div class="event-card__footer">
                <div class="event-card__meta">
                  <span>{{ row.startTime }} ~ {{ row.endTime }}</span>
                </div>
                <div class="event-card__ops">
                  <el-button size="mini" type="text" @click="handleDetail(row)" v-hasPermi="['vpp:event:info']">详情</el-button>
                  <el-button v-if="row.status === '0'" size="mini" type="text" @click="openApply(row)" v-hasPermi="['vpp:event:apply']">申报</el-button>
                  <el-button v-if="row.status === '0'" size="mini" type="text" @click="changeStatus(row, '1')" v-hasPermi="['vpp:event:edit']">开始</el-button>
                  <el-button v-if="row.status === '1'" size="mini" type="text" @click="changeStatus(row, '2')" v-hasPermi="['vpp:event:edit']">结束</el-button>
                  <el-button size="mini" type="text" @click="handleUpdate(row)" v-hasPermi="['vpp:event:edit']">编辑</el-button>
                  <el-button size="mini" type="text" class="event-op-danger" @click="handleDelete(row)" v-hasPermi="['vpp:event:remove']">删除</el-button>
                </div>
              </div>
            </div>
            <div v-if="!eventList.length" class="event-card-empty">
              <img :src="tableEmptyIcon" alt="">
              <p>暂无事件数据</p>
            </div>
          </div>
          <el-table
            v-else
            v-loading="loading"
            :data="eventList"
            class="event-list-table"
            @selection-change="handleSelectionChange"
          >
            <template slot="empty">
              <div class="ems-list-table__empty">
                <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                <p class="ems-list-table__empty-text">暂无数据</p>
              </div>
            </template>
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column label="序号" width="60" align="center">
              <template slot-scope="scope">
                {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="事件编号" prop="eventNo" min-width="160" align="center" show-overflow-tooltip />
            <el-table-column label="类型" min-width="80" align="center">
              <template slot-scope="scope">
                <span v-if="scope.row.eventType === '1'" class="badge red">削峰</span>
                <span v-else class="badge purple">填谷</span>
              </template>
            </el-table-column>
            <el-table-column label="开始时间" prop="startTime" min-width="150" align="center" show-overflow-tooltip />
            <el-table-column label="结束时间" prop="endTime" min-width="150" align="center" show-overflow-tooltip />
            <el-table-column label="时长" min-width="90" align="center">
              <template slot-scope="scope">{{ durationText(scope.row) }}</template>
            </el-table-column>
            <el-table-column label="目标调节量(kW)" prop="targetPower" min-width="120" align="center" />
            <el-table-column label="目标电量(kWh)" prop="targetEnergy" min-width="110" align="center" />
            <el-table-column label="组织方" prop="organizer" min-width="100" align="center" show-overflow-tooltip />
            <el-table-column label="状态" min-width="90" align="center">
              <template slot-scope="scope">
                <span v-if="scope.row.status === '0'" class="badge orange">待响应</span>
                <span v-else-if="scope.row.status === '1'" class="badge blue">响应中</span>
                <span v-else class="badge green">已结束</span>
              </template>
            </el-table-column>
            <el-table-column label="申报" min-width="130" align="center">
              <template slot-scope="scope">
                <span v-if="scope.row.applyPower > 0" class="badge purple nowrap">已申报 {{ scope.row.applyPower }} kW</span>
                <span v-else class="badge gray nowrap">未申报</span>
              </template>
            </el-table-column>
            <el-table-column label="参与场站" min-width="90" align="center">
              <template slot-scope="scope">{{ scope.row.applyCount || 0 }}</template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="280" fixed="right" class-name="small-padding fixed-width ems-list-table__ops">
              <template slot-scope="scope">
                <el-button size="mini" type="text" icon="el-icon-view" @click="handleDetail(scope.row)" v-hasPermi="['vpp:event:info']">详情</el-button>
                <el-button v-if="scope.row.status === '0'" size="mini" type="text" icon="el-icon-document" @click="openApply(scope.row)" v-hasPermi="['vpp:event:apply']">申报</el-button>
                <el-button v-if="scope.row.status === '0'" size="mini" type="text" icon="el-icon-video-play" @click="changeStatus(scope.row, '1')" v-hasPermi="['vpp:event:edit']">开始</el-button>
                <el-button v-if="scope.row.status === '1'" size="mini" type="text" icon="el-icon-circle-check" @click="changeStatus(scope.row, '2')" v-hasPermi="['vpp:event:edit']">结束</el-button>
                <el-button v-if="scope.row.status === '0'" size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['vpp:event:edit']">编辑</el-button>
                <el-button v-if="scope.row.status === '0'" size="mini" type="text" icon="el-icon-delete" style="color:#F56C6C" @click="handleDelete(scope.row)" v-hasPermi="['vpp:event:remove']">删除</el-button>
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
    </div>

    <el-dialog
      :title="editEventId ? '编辑事件' : '新建需求响应事件'"
      :visible.sync="open"
      width="700px"
      append-to-body
      custom-class="event-form-dialog"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="130px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="事件类型">
              <el-radio-group v-model="form.eventType">
                <el-radio label="1">削峰</el-radio>
                <el-radio label="2">填谷</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组织方" prop="organizer">
              <el-input v-model="form.organizer" placeholder="如 电网公司" class="event-form__control" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始时间" prop="startTime">
              <el-date-picker
                v-model="form.startTime"
                type="datetime"
                placeholder="选择开始时间"
                value-format="yyyy-MM-dd HH:mm:ss"
                class="event-form__control"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime">
              <el-date-picker
                v-model="form.endTime"
                type="datetime"
                placeholder="选择结束时间"
                value-format="yyyy-MM-dd HH:mm:ss"
                class="event-form__control"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="目标调节量(kW)" prop="targetPower">
              <el-input-number
                v-model="form.targetPower"
                :min="0"
                :precision="2"
                class="event-form__control"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标电量(kWh)">
              <el-input :value="targetEnergy" disabled placeholder="自动计算" class="event-form__control" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="选填" class="event-form__control" />
        </el-form-item>
        <div class="event-form__tip">事件编号自动生成：DR+时间戳；新建后状态为「待响应」</div>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="open = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      :title="'事件申报：' + applyEventNo"
      :visible.sync="applyOpen"
      width="700px"
      append-to-body
      custom-class="event-apply-dialog"
    >
      <div class="event-apply-hint">
        选择参与场站并填写申报容量（申报容量 ≤ {{ applyCapacityLabel }}，否则无法保存）
      </div>
      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table :data="applyStationList" class="ems-list-table" size="small">
            <template slot="empty">
              <div class="ems-list-table__empty">
                <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                <p class="ems-list-table__empty-text">暂无可用场站，请先在资源台账中添加参与VPP的场站和桩</p>
              </div>
            </template>
            <el-table-column label="是否参与" align="center" min-width="80">
              <template slot-scope="s">
                <el-checkbox v-model="s.row.checked" :disabled="Number(s.row.applyCapacity) <= 0" />
              </template>
            </el-table-column>
            <el-table-column label="场站" prop="stationName" min-width="120" show-overflow-tooltip />
            <el-table-column :label="applyCapacityLabel" prop="applyCapacity" align="right" min-width="120">
              <template slot-scope="s">{{ s.row.applyCapacity }}</template>
            </el-table-column>
            <el-table-column label="申报容量(kW)" align="center" min-width="160">
              <template slot-scope="s">
                <el-input-number
                  v-model="s.row.applyPower"
                  :min="0"
                  :max="s.row.applyCapacity"
                  :precision="2"
                  size="mini"
                  style="width:130px"
                  controls-position="right"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="applyOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitApply">保存申报</el-button>
      </div>
    </el-dialog>

    <!-- ==================== 事件详情 Drawer ==================== -->
    <el-drawer title="事件详情 · 一个活动一页看完" :visible.sync="detailOpen" size="820px" append-to-body>
      <div style="padding:0 20px 20px">
        <div class="ev-card">
          <span class="item">事件编号：<b>{{ detail.eventNo }}</b></span>
          <span class="item">类型：<b>{{ detail.eventType === '1' ? '削峰' : '填谷' }}</b></span>
          <span class="item">时段：<b>{{ detail.startTime }} ~ {{ detail.endTime }}</b></span>
          <span class="item">目标调节量：<b>{{ detail.targetPower }} kW</b></span>
          <span class="item">状态：<span :class="'badge ' + (detail.status === '0' ? 'orange' : detail.status === '1' ? 'blue' : 'green')">{{ detail.status === '0' ? '待响应' : detail.status === '1' ? '响应中' : '已结束' }}</span></span>
        </div>

        <el-row :gutter="16" style="margin:16px 0">
          <el-col :span="6"><div class="kpi-card accent"><div class="kpi-label">申报率</div><div class="kpi-value">{{ applyRateVal }}%<small>申报 {{ applySumKw }} / 目标 {{ detail.targetPower || 0 }} kW</small></div></div></el-col>
          <el-col :span="6"><div class="kpi-card"><div class="kpi-label">分配率</div><div class="kpi-value">{{ allocRateVal }}%<small>分配 {{ allocSumKw }} kW</small></div></div></el-col>
          <el-col :span="6"><div class="kpi-card"><div class="kpi-label">合格率</div><div class="kpi-value" :style="{color: passRateVal >= 80 ? '#67C23A' : '#F56C6C'}">{{ passRateVal }}%<small>合格 {{ qualifiedCount }} / 参与 {{ joinedCount }} 站</small></div></div></el-col>
          <el-col :span="6"><div class="kpi-card"><div class="kpi-label">结算金额</div><div class="kpi-value">{{ totalSettleMoney }}<small>元</small></div></div></el-col>
        </el-row>

        <div style="font-weight:600;margin-bottom:10px">全流程明细 <span style="font-weight:400;font-size:12px;color:#909399">（申报 → 分配 → 执行 → 判定 → 结算）</span></div>
        <el-table :data="flowRows" size="mini" border style="margin-bottom:16px">
          <el-table-column label="场站" prop="name" min-width="140" />
          <el-table-column label="申报(kW)" prop="apply" align="right" min-width="90" />
          <el-table-column label="分配(kW)" prop="alloc" align="right" min-width="90" />
          <el-table-column label="响应电量(kWh)" prop="energy" align="right" min-width="110" />
          <el-table-column label="达成率" align="center" min-width="80"><template slot-scope="s">{{ s.row.rate || '—' }}</template></el-table-column>
          <el-table-column label="判定" align="center" min-width="80">
            <template slot-scope="s">
              <span v-if="s.row.noapply" class="badge gray">未申报</span>
              <span v-else-if="s.row.qualified === true" class="badge green">合格</span>
              <span v-else-if="s.row.qualified === false" class="badge red">不合格</span>
              <span v-else style="color:#c0c4cc">—</span>
            </template>
          </el-table-column>
          <el-table-column label="结算金额(元)" prop="money" align="right" min-width="100" />
          <el-table-column label="操作" align="center" min-width="80">
            <template slot-scope="s"><el-button type="text" size="mini" @click="showStationDetail(s.row)">查看明细</el-button></template>
          </el-table-column>
        </el-table>

        <div style="font-weight:600;margin-bottom:8px">执行曲线</div>
        <div class="chart-legend"><span><i style="background:#0a59f7"></i>目标</span><span><i style="background:#E6A23C"></i>实际</span></div>
        <div v-if="(detail.curve||[]).length" ref="detailChart" class="chart-wrap"></div>
        <div v-else style="text-align:center;padding:24px;color:#909399">暂无执行监测数据</div>

        <div style="font-weight:600;margin:16px 0 14px">事件时间线</div>
        <div v-if="timeline.length" class="tl">
          <div v-for="(t,i) in timeline" :key="i" class="tl-node"><div class="tm">{{ t.time }}</div><div class="nm">{{ t.name }}</div><div class="ds">{{ t.desc }}</div></div>
        </div>
        <div v-else style="text-align:center;padding:24px;color:#909399">暂无流程记录</div>
      </div>
    </el-drawer>

    <el-dialog
      :title="'场站详情 · ' + stationDlgTitle"
      :visible.sync="stationDlgOpen"
      width="540px"
      append-to-body
      custom-class="event-station-dialog"
    >
      <el-descriptions v-if="stationDlgRow.name" :column="1" border>
        <el-descriptions-item label="场站">{{ stationDlgRow.name }}</el-descriptions-item>
        <el-descriptions-item label="申报调节量">{{ stationDlgRow.noapply ? '—' : stationDlgRow.apply + ' kW' }}</el-descriptions-item>
        <el-descriptions-item label="分配调节量">{{ stationDlgRow.noapply ? '—' : stationDlgRow.alloc + ' kW' }}</el-descriptions-item>
        <el-descriptions-item label="执行响应电量">{{ stationDlgRow.noapply ? '—' : stationDlgRow.energy + ' kWh' }}</el-descriptions-item>
        <el-descriptions-item label="达成率">{{ stationDlgRow.rate || '—' }}</el-descriptions-item>
        <el-descriptions-item label="判定">
          <span v-if="stationDlgRow.noapply" class="badge gray">未申报</span>
          <span v-else-if="stationDlgRow.qualified === true" class="badge green">合格</span>
          <span v-else-if="stationDlgRow.qualified === false" class="badge red">不合格</span>
          <span v-else style="color:#c0c4cc">—</span>
        </el-descriptions-item>
        <el-descriptions-item label="结算金额">
          <span v-if="stationDlgRow.noapply" style="color:#909399">未申报，未参与</span>
          <span v-else-if="stationDlgRow.qualified === true">¥{{ Number(stationDlgRow.money || 0).toFixed(2) }}（平台{{ rateText(stationDlgRow.platformRate) }}/运营商{{ rateText(stationDlgRow.operatorRate) }}/场站{{ rateText(stationDlgRow.stationRate) }}）</span>
          <span v-else-if="stationDlgRow.qualified === false" style="color:#F56C6C">0.00（不合格不计费）</span>
          <span v-else style="color:#c0c4cc">—</span>
        </el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="stationDlgOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listEvent, getEvent, addEvent, updateEvent, delEvent, getEventStats, updateEventStatus } from "@/api/vpp/event"
import { listApplyAll, addApply, updateApply, delApply } from "@/api/vpp/apply"
import { listDispatchAll, allocateDispatch, confirmDispatch, sendDispatch } from "@/api/vpp/dispatch"
import { listAssessAll, generateAssess } from "@/api/vpp/assess"
import { listSettlementAll, generateSettlement } from "@/api/vpp/settlement"
import { getDeviation } from "@/api/vpp/execute"
import { listStationCapacity } from "@/api/vpp/resource"
import tableEmptyIcon from "@/assets/images/empty.svg"
import * as echarts from 'echarts'

export default {
  name: "VppEvent",
  data() {
    return {
      loading: true,
      viewMode: 'card',
      tableEmptyIcon,
      eventList: [], ids: [], multiple: true, total: 0,
      stats: {}, detail: {}, detailChart: null,
      open: false, editEventId: null, title: "",
      detailOpen: false,
      applyOpen: false, applyEventId: undefined, applyEventNo: '', applyEventType: '1', applyStationList: [],
      stationDlgOpen: false, stationDlgTitle: '', stationDlgRow: {},
      queryParams: { pageNum: 1, pageSize: 12, keyword: undefined, eventType: undefined, status: undefined, organizer: undefined },
      dateRange: [],
      form: {},
      rules: {
        organizer: [{ required: true, message: "组织方不能为空", trigger: "blur" }],
        startTime: [{ required: true, message: "开始时间不能为空", trigger: "change" }],
        endTime: [{ required: true, message: "结束时间不能为空", trigger: "change" }],
        targetPower: [{ required: true, message: "目标调节量不能为空", trigger: "blur" }]
      }
    }
  },
  computed: {
    applySumKw() { return (this.detail.applies||[]).reduce((s,a) => s+Number(a.applyPower||0), 0) },
    allocSumKw() { return Math.round((this.detail.dispatches||[]).reduce((s,d) => s+Number(d.targetPower||0), 0)*100)/100 },
    applyRateVal() { const t = Number(this.detail.targetPower||0); return t>0 ? Math.round(this.applySumKw/t*1000)/10 : 0 },
    allocRateVal() { const t = Number(this.detail.targetPower||0); return t>0 ? Math.round(this.allocSumKw/t*1000)/10 : 0 },
    joinedCount() { return new Set((this.detail.applies||[]).map(a=>a.stationName)).size },
    qualifiedCount() { return (this.detail.assess||[]).filter(a=>a.qualifiedFlag==='1').length },
    passRateVal() { const j=this.joinedCount; return j>0 ? Math.round(this.qualifiedCount/j*100) : 0 },
    totalSettleMoney() { return (this.detail.settlements||[]).reduce((s,r)=>s+Number(r.totalAmount||0),0).toFixed(2) },
    applyCapacityLabel() { return this.applyEventType === '2' ? '填谷容量(kW)' : '可调容量(kW)' },
    kpiItems() {
      const s = this.stats
      return [
        { label: '待响应(个)', value: s.waitCount || 0, icon: 'el-icon-bell' },
        { label: '响应中(个)', value: s.runCount || 0, icon: 'el-icon-bell' },
        { label: '已结束(个)', value: s.endCount || 0, icon: 'el-icon-bell' },
        { label: '本月事件(个)', value: s.monthCount || 0, icon: 'el-icon-bell' },
        { label: '削峰事件(个)', value: s.peakCount || 0, icon: 'el-icon-bell' },
        { label: '填谷事件(个)', value: s.valleyCount || 0, icon: 'el-icon-bell' },
        { label: '累计目标调节量(kW)', value: this.formatNum(s.totalTargetPower), icon: 'el-icon-s-data' },
        { label: '累计目标电量(kWh)', value: this.formatNum(s.totalTargetEnergy), icon: 'el-icon-data-line' },
        { label: '累计申报(kW)', value: this.formatNum(s.totalApplyPower), icon: 'el-icon-s-data' },
        { label: '累计参与场站(个)', value: s.totalApplyCount || 0, icon: 'el-icon-office-building' },
        { label: '平均目标调节量(kW)', value: this.formatNum(s.avgTargetPower), icon: 'el-icon-s-data' },
        { label: '平均目标电量(kWh)', value: this.formatNum(s.avgTargetEnergy), icon: 'el-icon-data-line' }
      ]
    },
    flowRows() {
      const map = {}, applySet = new Set()
      const get = name => { if(!map[name]) map[name]={name,apply:0,alloc:0,energy:0,qualified:null,money:0,noapply:false,rate:'—'}; return map[name] }
      ;(this.detail.applies||[]).forEach(a=>{get(a.stationName).apply+=Number(a.applyPower||0);applySet.add(a.stationName)})
      ;(this.detail.dispatches||[]).forEach(d=>get(d.stationName).alloc+=Number(d.targetPower||0))
      ;(this.detail.assess||[]).forEach(a=>{const r=get(a.stationName);r.energy=Number(a.responseEnergy||0);r.qualified=a.qualifiedFlag==='1'})
      ;(this.detail.settlements||[]).forEach(s=>{const r=get(s.stationName);r.money+=Number(s.totalAmount||0);r.platformRate=s.platformRate;r.operatorRate=s.operatorRate;r.stationRate=s.stationRate})
      const hasAssess = (this.detail.assess||[]).length > 0
      Object.values(map).forEach(r=>{ if(!hasAssess) r.qualified = null })
      const hours = this.eventHours
      Object.values(map).forEach(r=>{if(!applySet.has(r.name))r.noapply=true;if(hours&&r.alloc)r.rate=(r.energy/(r.alloc*hours)*100).toFixed(1)+'%'})
      return Object.values(map)
    },
    eventHours() { if(!this.detail.startTime||!this.detail.endTime)return 0; return (new Date(this.detail.endTime)-new Date(this.detail.startTime))/3600000 },
    formHours() { if(!this.form.startTime||!this.form.endTime)return 0; return (new Date(this.form.endTime)-new Date(this.form.startTime))/3600000 },
    targetEnergy() { const p=Number(this.form.targetPower||0), h=this.formHours; return p>0&&h>0 ? (p*h).toFixed(2) : '0.00' },
    timeline() {
      const t=[], d=this.detail
      t.push({name:'创建事件',desc:(d.eventNo||'')+'，状态：待响应',time:d.createTime||d.startTime||''})
      if((d.applies||[]).length) t.push({name:'申报',desc:(d.applies||[]).length+' 个场站申报，合计 '+this.applySumKw+' kW',time:''})
      const ds=(d.dispatches||[]).filter(x=>x.status==='1'||x.status==='2')
      if(ds.length) t.push({name:'调度分配',desc:'按申报比例分配，合计 '+this.allocSumKw+' kW',time:''})
      if((d.curve||[]).length) t.push({name:'执行监测',desc:'目标 '+(d.targetPower||0)+' kW，'+d.curve.length+' 个遥测点',time:''})
      if((d.assess||[]).length) t.push({name:'效果评估',desc:'参与 '+this.joinedCount+' 站，合格 '+this.qualifiedCount+' 站',time:''})
      if((d.settlements||[]).length) t.push({name:'结算',desc:'电网结算 '+this.totalSettleMoney+' 元',time:''})
      return t
    }
  },
  created() {
    this.getList(); this.loadStats()
    // 响应中事件：实时功率/已持续时间随时间变化，30s 静默刷新列表
    this.refreshTimer = setInterval(() => {
      if ((this.eventList || []).some(r => r.status === '1')) this.getList(true)
    }, 30000)
  },
  methods: {
    loadStats() { getEventStats().then(res=>{this.stats=res.data||{}}) },
    handleAutoReceive() { this.$modal.msgInfo('对接电网系统自动接收事件（接口预留）') },
    getList(silent) {
      if (!silent) this.loading = true
      this.queryParams = this.addDateRange(this.queryParams, this.dateRange)
      listEvent(this.queryParams).then(r=>{this.eventList=r.data||[];this.total=r.total||0;this.loading=false}).catch(()=>{this.loading=false})
    },
    handleQuery() { this.queryParams.pageNum=1; this.getList() },
    handleViewModeChange() {
      this.queryParams.pageNum = 1
      this.queryParams.pageSize = 12
      this.getList()
    },
    resetQuery() {
      this.queryParams = { pageNum: 1, pageSize: 12, keyword: undefined, eventType: undefined, status: undefined, organizer: undefined }
      this.dateRange = []
      this.getList()
    },
    handleSelectionChange(sel) { this.ids=sel.map(i=>i.eventId); this.multiple=!sel.length },
    reset() { this.form={eventType:'1',status:'0'}; this.editEventId=null },
    handleAdd() { this.reset(); this.open=true },
    handleUpdate(row) { this.reset(); getEvent(row.eventId).then(r=>{this.form=r.data;this.editEventId=row.eventId;this.open=true}) },
    submitForm() {
      this.$refs["form"].validate(v=>{if(v){this.form.targetEnergy=Number(this.targetEnergy);if(this.editEventId){updateEvent(this.form).then(()=>{this.$modal.msgSuccess("事件已更新");this.open=false;this.getList();this.loadStats()})}else{addEvent(this.form).then(()=>{this.$modal.msgSuccess("事件创建成功");this.open=false;this.getList();this.loadStats()})}}})
    },
    // --- 申报 ---
    openApply(row) {
      this.applyEventId=row.eventId; this.applyEventNo=row.eventNo; this.applyEventType=row.eventType||'1'
      const isFillValley = this.applyEventType === '2'
      listApplyAll({eventId: row.eventId}).then(applyRes => {
        const existingMap = {}; (applyRes.data||[]).forEach(a => { existingMap[a.stationId] = a })
        listStationCapacity().then(res => {
          this.applyStationList = (res.data||[]).map(s => {
            const exist = existingMap[s.stationId]
            const cap = isFillValley ? (s.fillValleyPower||0) : (s.adjustablePower||0)
            return { ...s, applyCapacity: cap, checked: !!exist, applyPower: exist ? exist.applyPower : cap, applyId: exist ? exist.applyId : null }
          })
          this.applyOpen = true
        })
      })
    },
    submitApply() {
      const promises = []
      let addCount = 0, updCount = 0, delCount = 0
      this.applyStationList.forEach(s => {
        if (s.checked && s.applyPower > 0) {
          if (Number(s.applyPower) > Number(s.adjustablePower)) {
            return // 超容的跳过，下面统一校验
          }
          if (s.applyId) {
            // 已有申报 → 更新
            promises.push(updateApply({ applyId: s.applyId, eventId: this.applyEventId, eventNo: this.applyEventNo, stationId: s.stationId, stationName: s.stationName, applyPower: s.applyPower }))
            updCount++
          } else {
            // 新申报 → 新增
            promises.push(addApply({ eventId: this.applyEventId, eventNo: this.applyEventNo, stationId: s.stationId, stationName: s.stationName, applyPower: s.applyPower, status: '1' }))
            addCount++
          }
        } else if (!s.checked && s.applyId) {
          // 取消勾选 → 删除
          promises.push(delApply(s.applyId))
          delCount++
        }
      })
      if (!promises.length) { this.$modal.msgWarning(this.applyStationList.some(s => s.checked) ? "所选场站申报容量为 0，无法保存，请填写大于 0 的申报容量" : "请至少勾选一个参与场站"); return }
      // 超容校验
      const over = this.applyStationList.find(s => s.checked && Number(s.applyPower) > Number(s.applyCapacity))
      if (over) { this.$modal.msgWarning(over.stationName + ' 申报容量超过' + this.applyCapacityLabel + ' ' + over.applyCapacity + ' kW'); return }
      Promise.all(promises).then(() => {
        const total = this.applyStationList.filter(s => s.checked).reduce((s, r) => s + Number(r.applyPower), 0)
        this.$modal.msgSuccess("保存成功：新增" + addCount + " 更新" + updCount + " 删除" + delCount + "，合计 " + total.toFixed(1) + " kW")
        this.applyOpen = false
        this.getList()
      }).catch(() => { this.$modal.msgError("保存失败") })
    },
    // --- 状态流转 ---
    changeStatus(row,status) {
      const label=status==='1'?'开始响应':'结束响应'
      this.$modal.confirm('确认将事件「'+row.eventNo+'」状态改为"'+label+'"？').then(()=>updateEventStatus(row.eventId,status)).then(()=>{this.$modal.msgSuccess("状态已更新");row.status=status;this.getList();this.loadStats()}).catch(()=>{})
    },
    // --- 详情 ---
    handleDetail(row) { this.$router.push({ path: '/vpp/event-detail', query: { eventId: row.eventId } }) },
    loadDetail(eventId) {
      getEvent(eventId).then(res=>{this.detail=Object.assign(this.detail,res.data||{})})
      listApplyAll({eventId}).then(res=>{this.detail.applies=res.data||[]})
      listDispatchAll({eventId}).then(res=>{this.detail.dispatches=res.data||[]})
      listAssessAll({eventId}).then(res=>{this.detail.assess=res.data||[]})
      listSettlementAll({eventId}).then(res=>{this.detail.settlements=res.data||[]})
      getDeviation(eventId).then(res=>{this.detail.curve=res.data||[];this.renderDetailChart()})
    },
    renderDetailChart() {
      const pts=this.detail.curve||[]; if(!pts.length)return
      this.$nextTick(()=>{if(!this.$refs.detailChart)return;if(!this.detailChart)this.detailChart=echarts.init(this.$refs.detailChart)
        this.detailChart.setOption({tooltip:{trigger:'axis'},grid:{left:50,right:30,top:20,bottom:40},xAxis:{type:'category',data:pts.map(p=>p.recordTime||p.record_time),axisLabel:{rotate:30}},yAxis:{type:'value',name:'kW'},series:[{name:'目标',type:'line',data:pts.map(p=>Number(p.planPower)),smooth:true,itemStyle:{color:'#0a59f7'}},{name:'实际',type:'line',data:pts.map(p=>Number(p.actualPower)),smooth:true,itemStyle:{color:'#E6A23C'}}]})
      })
    },
    showStationDetail(row) { this.stationDlgRow=row; this.stationDlgTitle=row.name||''; this.stationDlgOpen=true },
    rateText(v) { return Math.round(Number(v||0)*100) + '%' },
    durationText(row) { if (!row.startTime || !row.endTime) return '—'; const h = (new Date(row.endTime) - new Date(row.startTime)) / 3600000; return h > 0 ? (Math.round(h * 10) / 10) + ' 小时' : '—' },
    // 已持续：响应中事件 = min(now, endTime) - startTime（区别于 durationText 的事件总时长）
    elapsedText(row) {
      if (!row.startTime) return '—'
      const start = new Date(row.startTime).getTime()
      const end = row.endTime ? new Date(row.endTime).getTime() : 0
      const ref = end && Date.now() > end ? end : Date.now()
      const h = (ref - start) / 3600000
      return h > 0 ? (Math.round(h * 10) / 10) + ' 小时' : '0 小时'
    },
    formatNum(v) { return v === null || v === undefined ? '0' : Number(v).toLocaleString() },
    reloadDetail() { if(this.detail.eventId) this.loadDetail(this.detail.eventId) },
    handleAllocate() { this.$modal.confirm('按可调容量比例一键分配目标功率？').then(()=>allocateDispatch(this.detail.eventId)).then(()=>{this.$modal.msgSuccess("分配成功");this.reloadDetail()}).catch(()=>{}) },
    handleConfirm() { const ids=(this.detail.dispatches||[]).map(d=>d.dispatchId); if(!ids.length){this.$modal.msgWarning("暂无分配记录");return}; this.$modal.confirm('确认当前分配结果？').then(()=>confirmDispatch(ids.join(','))).then(()=>{this.$modal.msgSuccess("已确认");this.reloadDetail()}).catch(()=>{}) },
    handleSend() { const ids=(this.detail.dispatches||[]).map(d=>d.dispatchId); if(!ids.length){this.$modal.msgWarning("暂无分配记录");return}; this.$modal.confirm('生成并下发指令到参与桩？').then(()=>sendDispatch(ids.join(','))).then(()=>{this.$modal.msgSuccess("已下发");this.reloadDetail()}).catch(()=>{}) },
    handleAssess() { this.$modal.confirm('基于执行监测数据生成效果评估？').then(()=>generateAssess(this.detail.eventId)).then(()=>{this.$modal.msgSuccess("评估已生成");this.reloadDetail()}).catch(()=>{}) },
    handleSettle() { this.$prompt('请输入结算单价（元/kWh）','生成结算单',{inputValue:'0.5',inputPattern:/^\d+(\.\d+)?$/,inputErrorMessage:'请输入数字'}).then(({value})=>generateSettlement(this.detail.eventId,value)).then(()=>{this.$modal.msgSuccess("结算单已生成");this.reloadDetail()}).catch(()=>{}) },
    handleDelete(row) { const ids=row.eventId||this.ids; this.$modal.confirm('是否确认删除选中的事件？').then(()=>delEvent(ids)).then(()=>{this.getList();this.loadStats();this.$modal.msgSuccess("删除成功")}).catch(()=>{}) }
  },
  beforeDestroy() {
    if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null }
    if (this.detailChart) { this.detailChart.dispose(); this.detailChart = null }
  }
}
</script>

<style scoped lang="scss">
.event-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 16px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.event-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.event-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.event-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.event-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}

.event-toolbar__right .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.event-toolbar__right .el-button--primary:hover,
.event-toolbar__right .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
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
.badge.purple { background: #f5f0ff; color: #8a5cf6; }
.nowrap { white-space: nowrap; }

.ev-card { display:flex; flex-wrap:wrap; gap:8px 28px; font-size:13px; color:#606266; padding:12px 0; border-bottom:1px solid #ebeef5; }
.ev-card .item b { color:#303133; font-weight:600; }

.kpi-card { background:#fff; border-radius:6px; padding:12px; box-shadow:0 1px 3px rgba(0,0,0,.06); text-align:center; }
.kpi-label { font-size:13px; color:#909399; margin-bottom:6px; }
.kpi-value { font-size:20px; font-weight:600; color:#303133; }
.kpi-value small { font-size:11px; font-weight:normal; color:#909399; display:block; margin-top:4px; }
.kpi-card.accent { background:linear-gradient(135deg,#0a59f7,#4d84f9); }
.kpi-card.accent .kpi-label,.kpi-card.accent .kpi-value { color:#fff; }
.kpi-card.accent .kpi-value small { color:rgba(255,255,255,.8); }

.chart-legend { display:flex; gap:20px; font-size:13px; color:#606266; margin-bottom:8px; }
.chart-legend i { display:inline-block; width:16px; height:3px; vertical-align:middle; margin-right:5px; }
.chart-wrap { height:260px; background:#fafafa; border:1px solid #ebeef5; border-radius:6px; padding:12px; }

.tl { position:relative; padding-left:24px; border-left:2px solid #ebeef5; }
.tl-node { position:relative; padding:0 0 18px 14px; }
.tl-node::before { content:''; position:absolute; left:-21px; top:4px; width:10px; height:10px; border-radius:50%; background:#0a59f7; border:2px solid #fff; box-shadow:0 0 0 2px #0a59f7; }
.tl-node:last-child { padding-bottom:0; }
.tl-node .tm { color:#909399; font-size:12px; }
.tl-node .nm { font-weight:600; margin:2px 0; }
.tl-node .ds { color:#606266; font-size:13px; }

.event-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(max(340px, calc((100% - 48px) / 4)), 1fr));
  gap: 16px;
}

.event-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  padding: 16px;
  transition: box-shadow 0.2s, border-color 0.2s;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  &__header {
    margin-bottom: 12px;
  }

  &__title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  &__no {
    font-size: 15px;
    font-weight: 600;
    color: #1f2d3d;
  }

  &__tags {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }

  &__duration {
    color: #909399;
  }

  &__organizer {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #606266;
    margin-top: 6px;

    i {
      color: #909399;
    }
  }

  &__status {
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 10px;
    flex-shrink: 0;

    &.wait {
      background: #fdf6ec;
      color: #e6a23c;
    }
    &.run {
      background: #edf3ff;
      color: #0a59f7;
    }
    &.end {
      background: #f4f4f5;
      color: #909399;
    }
  }

  &__metrics {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
    flex-wrap: wrap;

    .stat {
      display: flex;
      flex-direction: column;
      min-width: 50px;

      .stat-val {
        font-size: 18px;
        font-weight: 700;
        color: #1f2d3d;
        line-height: 1.2;
      }

      .stat-label {
        font-size: 11px;
        color: #909399;
        margin-top: 2px;
      }

      // 高亮样式
      &--blue .stat-val {
        color: #0a59f7;
      }

      &--green .stat-val {
        color: #67c23a;
      }

      &--gray .stat-val {
        color: #909399;
      }
    }

    // 响应中的指标高亮
    &--highlight {
      background: #f5f7fa;
      padding: 10px;
      border-radius: 6px;
      margin-left: -10px;
      margin-right: -10px;
      flex-wrap: nowrap;

      .stat {
        flex: 1 1 0;
        min-width: 0;

        .stat-val {
          font-size: 16px;
          white-space: nowrap;
        }
      }
    }

    // 已结束的指标样式
    &--result {
      .stat:first-child {
        flex: 1;
      }
    }
  }

  &__meta {
    font-size: 12px;
    color: #909399;
    margin-bottom: 12px;

    .sep {
      margin: 0 4px;
    }
  }

  &__progress {
    margin-bottom: 12px;
    padding: 10px;
    background: #fafbfc;
    border-radius: 8px;

    &-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      font-size: 12px;
      color: #606266;

      span:last-child {
        font-weight: 600;
      }
    }

    &-track {
      height: 6px;
      background: #e8ecf5;
      border-radius: 3px;
      overflow: hidden;

      &--active {
        background: #d4e4ff;
      }
    }

    &-fill {
      height: 100%;
      background: #606266;
      border-radius: 3px;
      transition: width 0.3s;

      &--active {
        background: #606266;
      }
    }
  }

  &__time-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #606266;
    margin-bottom: 12px;
    padding: 8px 10px;
    background: #f5f7fa;
    border-radius: 6px;

    i {
      font-size: 14px;
    }
  }

  &__result-bar {
    margin-bottom: 12px;
    padding: 10px;
    background: #f5f7fa;
    border-radius: 6px;
  }

  &__result-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    font-size: 12px;
    color: #606266;
  }

  &__result-percent {
    font-size: 16px;
    font-weight: 700;
    color: #606266;
  }

  &__result-track {
    height: 6px;
    background: #e4e7ed;
    border-radius: 3px;
    overflow: hidden;
  }

  &__result-fill {
    height: 100%;
    background: #909399;
    border-radius: 3px;
    transition: width 0.3s;
  }

  &__footer {
    margin-top: auto;
    border-top: 1px solid #f0f0f0;
    padding-top: 10px;
  }

  &__ops {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;

    .event-op-danger {
      color: #f56c6c;
    }
  }
}

.event-card-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 16px;
  color: #909399;

  img {
    width: 80px;
    margin-bottom: 12px;
    opacity: 0.6;
  }

  p {
    font-size: 14px;
    margin: 0;
  }
}
</style>

<style>
.event-page .event-content-split {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
  background: transparent !important;
}

.event-search-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.25rem 1.25rem;
}

.event-page .event-list-search {
  display: block;
  margin-bottom: 0;
}

/* 第一行：小屏 3 个、大屏 4 个普通搜索项 + 按钮；与第二行独立，避免日期范围撑开列宽 */
.event-page .event-list-search__grid--primary {
  display: grid;
  grid-template-columns: repeat(3, max-content);
  gap: 12px 16px;
  align-items: center;
}

.event-page .event-list-search__grid--primary .event-list-search__item,
.event-page .event-list-search__row--secondary .event-list-search__item {
  margin-right: 0;
  margin-bottom: 0;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.event-page .event-list-search__item--type {
  grid-row: 1;
  grid-column: 1;
}

.event-page .event-list-search__item--status {
  grid-row: 1;
  grid-column: 2;
}

.event-page .event-list-search__item--organizer {
  grid-row: 1;
  grid-column: 3;
}

.event-page .event-list-search__item--actions {
  grid-row: 1;
  grid-column: 4;
  margin-left: 8px;
}

.event-page .event-list-search__grid--primary .event-list-search__item.event-list-search__keyword--row1 {
  display: none;
}

.event-page .event-list-search__row--secondary .event-list-search__item.event-list-search__keyword--row2 {
  display: inline-flex;
}

.event-page .event-list-search__row--secondary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 16px;
  margin-top: 12px;
}

@media (min-width: 1600px) {
  .event-page .event-list-search__grid--primary {
    grid-template-columns: repeat(4, max-content);
  }

  .event-page .event-list-search__grid--primary .event-list-search__item.event-list-search__keyword--row1 {
    display: inline-flex;
    grid-row: 1;
    grid-column: 4;
  }

  .event-page .event-list-search__row--secondary .event-list-search__item.event-list-search__keyword--row2 {
    display: none;
  }

  .event-page .event-list-search__item--actions {
    grid-column: 5;
  }
}

.event-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.event-page .ems-list-search__control {
  width: 11rem;
}

.event-page .ems-list-search__daterange {
  width: calc(11rem * 2 + 90px + 16px);
}

.event-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.event-content-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px 16px;
}

.event-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.event-content-card .table-shell {
  background: transparent;
}

.event-content-card .table-shell__wrap {
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.event-list-table {
  border-radius: 8px;
  overflow: hidden;
}

.event-list-table .el-table__header-wrapper th {
  background: #f5f7fa;
  color: #1f2d3d;
  font-weight: 600;
  font-size: 13px;
}

.event-list-table .el-table__row:hover > td {
  background: #f5f7fa !important;
}

.event-list-table .el-table__cell {
  padding: 10px 0;
}

.event-list-table .badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.4;
}

.event-list-table .badge.blue { background: #edf3ff; color: #0a59f7; }
.event-list-table .badge.green { background: #f0f9eb; color: #67c23a; }
.event-list-table .badge.orange { background: #fdf6ec; color: #e6a23c; }
.event-list-table .badge.red { background: #fef0f0; color: #f56c6c; }
.event-list-table .badge.purple { background: #f5f0ff; color: #8a5cf6; }
.event-list-table .badge.gray { background: #f4f4f5; color: #909399; }

.event-list-table .el-button--mini.el-button--text {
  font-size: 13px;
  padding: 4px 6px;
}

.event-list-table .el-button--mini.el-button--text:hover {
  background: rgba(10, 89, 247, 0.06);
}

.event-form-dialog .el-dialog__title,
.event-apply-dialog .el-dialog__title,
.event-station-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.event-form-dialog .el-dialog__header,
.event-apply-dialog .el-dialog__header,
.event-station-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.event-form-dialog .el-dialog__body,
.event-apply-dialog .el-dialog__body {
  padding: 20px 24px 8px;
}

.event-form-dialog .el-form-item__label {
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.85);
}

.event-form-dialog .el-select,
.event-form-dialog .el-input,
.event-form-dialog .el-input-number,
.event-form-dialog .el-date-editor,
.event-form-dialog .el-textarea {
  width: 100%;
}

.event-form-dialog .el-form-item__content > .el-select,
.event-form-dialog .el-form-item__content > .el-input,
.event-form-dialog .el-form-item__content > .el-input-number,
.event-form-dialog .el-form-item__content > .el-date-editor {
  display: block;
  width: 100%;
}

.event-form-dialog .event-form__control {
  width: 100%;
}

.event-form-dialog .event-form__tip {
  margin: -4px 0 12px 130px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.4;
}

.event-apply-dialog .event-apply-hint {
  margin-bottom: 12px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.5;
}
</style>
