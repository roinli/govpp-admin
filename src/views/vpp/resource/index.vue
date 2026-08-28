<template>
  <div class="app-container resource-page nco-settings-container">
    <div class="new-style-menu-title">资源台账</div>

    <div class="nco-settings-container-content resource-content-split">
      <div class="resource-search-card">
      <el-form
        ref="queryForm"
        :model="queryParams"
        size="small"
        :inline="true"
        label-width="90px"
        class="ems-list-search resource-list-search"
        @submit.native.prevent
      >
        <div class="resource-list-search__grid">
          <el-form-item label="场站" prop="stationId" class="resource-list-search__item resource-list-search__item--station">
            <el-select
              v-model="queryParams.stationId"
              placeholder="请选择场站"
              clearable
              class="ems-list-search__control"
              @change="handleQuery"
            >
              <el-option
                v-for="s in stationOptions"
                :key="s.stationId"
                :label="s.stationName"
                :value="s.stationId"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="类型" prop="pileType" class="resource-list-search__item resource-list-search__item--type">
            <el-select
              v-model="queryParams.pileType"
              placeholder="请选择类型"
              clearable
              class="ems-list-search__control"
              @change="handleQuery"
            >
              <el-option label="直流 DC" value="DC" />
              <el-option label="交流 AC" value="AC" />
            </el-select>
          </el-form-item>
          <el-form-item label="参与状态" prop="participateStatus" class="resource-list-search__item resource-list-search__item--participate">
            <el-select
              v-model="queryParams.participateStatus"
              placeholder="请选择参与状态"
              clearable
              class="ems-list-search__control"
              @change="handleQuery"
            >
              <el-option label="启用" value="1" />
              <el-option label="停用" value="0" />
            </el-select>
          </el-form-item>
          <el-form-item label="设备状态" prop="deviceStatus" class="resource-list-search__item resource-list-search__item--device">
            <el-select
              v-model="queryParams.deviceStatus"
              placeholder="请选择设备状态"
              clearable
              class="ems-list-search__control"
              @change="handleQuery"
            >
              <el-option label="在线" value="1" />
              <el-option label="离线" value="2" />
              <el-option label="故障" value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词" prop="keyword" class="resource-list-search__item resource-list-search__item--keyword">
            <el-input
              v-model="queryParams.keyword"
              placeholder="桩编号/运营商"
              clearable
              class="ems-list-search__control"
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item class="ems-list-search__actions resource-list-search__item resource-list-search__item--actions">
            <el-button type="primary" @click="handleQuery">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </div>
      </el-form>
      </div>

      <div class="resource-content-card">
        <div class="resource-toolbar">
          <div class="resource-toolbar__left">
            <el-radio-group v-model="viewMode" size="small" @change="handleViewModeChange">
              <el-radio-button label="card"><i class="el-icon-s-grid" /> 卡片</el-radio-button>
              <el-radio-button label="list"><i class="el-icon-s-operation" /> 列表</el-radio-button>
            </el-radio-group>
          </div>
          <div class="resource-toolbar__right">
            <el-button plain @click="handleExport">导出</el-button>
            <el-button type="primary" @click="handleAdd" v-hasPermi="['vpp:resource:add']">新增桩资源</el-button>
          </div>
        </div>

        <div class="table-shell">
          <div class="table-shell__wrap" :class="{ 'table-shell__wrap--plain': viewMode === 'card' }">
            <div v-if="viewMode === 'card'" v-loading="loading" class="resource-card-grid">
            <div v-for="row in resourceList" :key="row.resourceId" class="resource-card">
              <!-- 左侧：充电桩图片 -->
              <div class="resource-card__pile-visual">
                <div class="resource-card__pile-img-wrap">
                  <img :src="row.pileType === 'DC' ? dcPileImg : acPileImg" class="resource-card__pile-img" />
                </div>
                <div class="resource-card__pile-type-label" :class="row.pileType === 'DC' ? 'dc' : 'ac'">
                  {{ row.pileType === 'DC' ? '直流桩' : '交流桩' }}
                </div>
              </div>
              
              <!-- 右侧：信息区域 -->
              <div class="resource-card__content">
                <!-- 顶部：桩编号 + 状态 -->
                <div class="resource-card__header">
                  <div class="resource-card__title-group">
                    <span class="resource-card__name">{{ row.pileNo }}</span>
                    <span class="resource-card__station-name">{{ row.stationName || '未绑定场站' }}</span>
                  </div>
                  <div class="resource-card__tags">
                    <span class="resource-card__status-tag" :class="deviceStatusClass(row.deviceStatus)">
                      {{ deviceStatusText(row.deviceStatus) }}
                    </span>
                    <span class="resource-card__status-tag" :class="row.participateStatus === '1' ? 'on' : 'off'">
                      {{ row.participateStatus === '1' ? '启用' : '停用' }}
                    </span>
                  </div>
                </div>
                
                <!-- 运营商信息 -->
                <div class="resource-card__info">
                  <span class="label">运营商</span>
                  <span class="value">{{ row.tenantName || '—' }}</span>
                </div>
                
                <!-- 数据指标 -->
                <div class="resource-card__metrics">
                  <div class="metric-item">
                    <div class="metric-value">{{ row.ratedPower }}</div>
                    <div class="metric-label">额定功率(kW)</div>
                  </div>
                  <div class="metric-item highlight-blue">
                    <div class="metric-value">{{ row.adjustablePower }}</div>
                    <div class="metric-label">削峰可调(kW)</div>
                  </div>
                  <div class="metric-item highlight-green">
                    <div class="metric-value">{{ row.valleyPower }}</div>
                    <div class="metric-label">填谷可调(kW)</div>
                  </div>
                </div>
                
                <!-- 7日功率折线图 -->
                <div class="resource-card__chart-section">
                  <div class="resource-card__chart-title">7日功率趋势</div>
                  <div :ref="'chart_' + row.resourceId" class="resource-card__chart" />
                </div>
                
                <!-- 底部：事件次数 + 操作按钮 -->
                <div class="resource-card__footer">
                  <span class="event-count">事件 <strong>{{ row.eventCount || 0 }}</strong> 次</span>
                  <div class="resource-card__ops">
                    <el-button size="mini" type="text" @click="handleDetail(row)">详情</el-button>
                    <el-button size="mini" type="text" @click="handleUpdate(row)" v-hasPermi="['vpp:resource:edit']">编辑</el-button>
                    <el-button v-if="row.participateStatus === '0'" size="mini" type="text" @click="handleStatusChange(row, '1')" v-hasPermi="['vpp:resource:edit']">启用</el-button>
                    <el-button v-else size="mini" type="text" @click="handleStatusChange(row, '0')" v-hasPermi="['vpp:resource:edit']">停用</el-button>
                    <el-button size="mini" type="text" class="resource-op-danger" @click="handleDelete(row)" v-hasPermi="['vpp:resource:remove']">删除</el-button>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="!resourceList.length" class="resource-card-empty">
              <img :src="tableEmptyIcon" alt="">
              <p>暂无桩资源数据</p>
            </div>
          </div>
          <el-table
            v-else
            v-loading="loading"
            :data="resourceList"
            class="ems-list-table"
            :row-class-name="tableRowClassName"
          >
            <template slot="empty">
              <div class="ems-list-table__empty">
                <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                <p class="ems-list-table__empty-text">暂无数据</p>
              </div>
            </template>
            <el-table-column label="序号" width="60" align="center">
              <template slot-scope="scope">
                {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="资源编码" prop="resourceCode" min-width="160" show-overflow-tooltip align="center" />
            <el-table-column label="场站" prop="stationName" min-width="120" show-overflow-tooltip align="center" />
            <el-table-column label="桩编号" prop="pileNo" min-width="140" show-overflow-tooltip align="center" />
            <el-table-column label="类型" min-width="80" align="center">
              <template slot-scope="scope">
                <span v-if="scope.row.pileType === 'DC'" class="badge blue">直流</span>
                <span v-else class="badge purple">交流</span>
              </template>
            </el-table-column>
            <el-table-column label="额定功率(kW)" prop="ratedPower" min-width="110" align="center" />
            <el-table-column label="削峰可调(kW)" min-width="110" align="center">
              <template slot-scope="scope">
                <span class="text-primary">{{ scope.row.adjustablePower }}</span>
              </template>
            </el-table-column>
            <el-table-column label="7日平均功率(kW)" prop="avg7dPower" min-width="130" align="center" />
            <el-table-column label="填谷可调(kW)" min-width="110" align="center">
              <template slot-scope="scope">
                <span class="text-success">{{ scope.row.valleyPower }}</span>
              </template>
            </el-table-column>
            <el-table-column label="参与事件次数" prop="eventCount" min-width="100" align="center" />
            <el-table-column label="归属运营商" prop="tenantName" min-width="110" align="center" show-overflow-tooltip />
            <el-table-column label="参与状态" min-width="80" align="center">
              <template slot-scope="scope">
                <span v-if="scope.row.participateStatus === '1'" class="badge green">启用</span>
                <span v-else class="badge gray">停用</span>
              </template>
            </el-table-column>
            <el-table-column label="设备状态" min-width="80" align="center">
              <template slot-scope="scope">
                <span class="badge" :class="deviceStatusClass(scope.row.deviceStatus)">{{ deviceStatusText(scope.row.deviceStatus) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="160" fixed="right" class-name="small-padding fixed-width ems-list-table__ops">
              <template slot-scope="scope">
                <el-tooltip content="详情" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-view"
                    class="ems-list-table__ops-btn"
                    @click="handleDetail(scope.row)"
                  />
                </el-tooltip>
                <el-tooltip content="编辑" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-edit"
                    class="ems-list-table__ops-btn"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['vpp:resource:edit']"
                  />
                </el-tooltip>
                <el-tooltip
                  v-if="scope.row.participateStatus === '0'"
                  content="启用"
                  placement="top"
                  effect="light"
                  popper-class="ems-list-tooltip"
                >
                  <el-button
                    type="text"
                    icon="el-icon-video-play"
                    class="ems-list-table__ops-btn"
                    @click="handleStatusChange(scope.row, '1')"
                    v-hasPermi="['vpp:resource:edit']"
                  />
                </el-tooltip>
                <el-tooltip
                  v-else
                  content="停用"
                  placement="top"
                  effect="light"
                  popper-class="ems-list-tooltip"
                >
                  <el-button
                    type="text"
                    icon="el-icon-video-pause"
                    class="ems-list-table__ops-btn"
                    @click="handleStatusChange(scope.row, '0')"
                    v-hasPermi="['vpp:resource:edit']"
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    class="ems-list-table__ops-btn"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['vpp:resource:remove']"
                  />
                </el-tooltip>
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
      :title="editId ? '编辑桩资源（' + editPileNo + '）' : '新增桩资源'"
      :visible.sync="open"
      width="640px"
      append-to-body
      custom-class="resource-form-dialog"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="110px" label-position="right">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="资源编码">
              <el-input v-model="form.resourceCode" placeholder="留空自动生成" class="resource-form__control" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="场站" prop="stationId">
              <el-select
                v-model="form.stationId"
                placeholder="请选择场站"
                filterable
                clearable
                class="resource-form__control"
                @change="onStationChange"
              >
                <el-option
                  v-for="s in stationOptions"
                  :key="s.stationId"
                  :label="s.stationName"
                  :value="s.stationId"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="桩编号" prop="pileNo">
              <el-input v-model="form.pileNo" placeholder="如 PILE-A-001" class="resource-form__control" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型" prop="pileType">
              <el-select v-model="form.pileType" class="resource-form__control">
                <el-option label="直流 DC" value="DC" />
                <el-option label="交流 AC" value="AC" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资源归属" prop="resourceOwnerType">
              <el-select v-model="form.resourceOwnerType" class="resource-form__control">
                <el-option label="运营商" value="1" />
                <el-option label="私有" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="额定功率" prop="ratedPower">
              <div class="resource-form__unit-wrap">
                <el-input-number
                  v-model="form.ratedPower"
                  :min="0"
                  :precision="2"
                  class="resource-form__control"
                />
                <span class="resource-form__unit">kW</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="参与状态">
              <el-select v-model="form.participateStatus" class="resource-form__control">
                <el-option label="启用" value="1" />
                <el-option label="停用" value="0" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备状态">
              <el-select v-model="form.deviceStatus" class="resource-form__control">
                <el-option label="在线" value="1" />
                <el-option label="离线" value="2" />
                <el-option label="故障" value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="削峰系数">
              <el-input-number
                v-model="form.adjustableRate"
                :min="0"
                :max="1"
                :step="0.05"
                :precision="2"
                class="resource-form__control"
                @change="onPeakRateChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="填谷系数">
              <el-input-number
                :value="valleyRateDisplay"
                :min="0"
                :max="1"
                :step="0.05"
                :precision="2"
                disabled
                class="resource-form__control"
              />
              <div class="resource-form__hint resource-form__hint--danger">= 1 − 削峰系数</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" placeholder="选填" class="resource-form__control" />
        </el-form-item>
        <div class="resource-form__tip">可调功率自动计算：额定功率 × 可调系数</div>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="open = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 充电桩详情对话框 -->
    <el-dialog
      title="充电桩详情"
      :visible.sync="detailOpen"
      width="880px"
      append-to-body
      custom-class="resource-detail-dialog"
    >
      <div v-if="detailRow" class="resource-detail">
        <!-- 左侧：充电桩大图 -->
        <div class="resource-detail__left">
          <div class="resource-detail__pile-img-wrap">
            <img :src="detailRow.pileType === 'DC' ? dcPileImg : acPileImg" class="resource-detail__pile-img" />
          </div>
          <div class="resource-detail__pile-label" :class="detailRow.pileType === 'DC' ? 'dc' : 'ac'">
            {{ detailRow.pileType === 'DC' ? '直流充电桩' : '交流充电桩' }}
          </div>
          <div class="resource-detail__pile-no">{{ detailRow.pileNo }}</div>
          <span class="resource-detail__status" :class="detailRow.participateStatus === '1' ? 'on' : 'off'">
            {{ detailRow.participateStatus === '1' ? '启用中' : '已停用' }}
          </span>
        </div>

        <!-- 右侧：参数信息 -->
        <div class="resource-detail__right">
          <div class="resource-detail__section">
            <div class="resource-detail__section-title">基本信息</div>
            <div class="resource-detail__grid">
              <div class="resource-detail__item">
                <span class="label">资源编码</span>
                <span class="value">{{ detailRow.resourceCode || '—' }}</span>
              </div>
              <div class="resource-detail__item">
                <span class="label">所属场站</span>
                <span class="value">{{ detailRow.stationName || '未绑定' }}</span>
              </div>
              <div class="resource-detail__item">
                <span class="label">归属运营商</span>
                <span class="value">{{ detailRow.tenantName || '—' }}</span>
              </div>
              <div class="resource-detail__item">
                <span class="label">资源归属</span>
                <span class="value">{{ detailRow.resourceOwnerType === '1' ? '运营商' : '私有' }}</span>
              </div>
              <div class="resource-detail__item">
                <span class="label">设备状态</span>
                <span class="value">{{ deviceStatusText(detailRow.deviceStatus) }}</span>
              </div>
            </div>
          </div>

          <div class="resource-detail__section">
            <div class="resource-detail__section-title">功率参数</div>
            <div class="resource-detail__metrics">
              <div class="resource-detail__metric">
                <span class="metric-val blue">{{ detailRow.ratedPower || 0 }}</span>
                <span class="metric-label">额定功率(kW)</span>
              </div>
              <div class="resource-detail__metric">
                <span class="metric-val blue">{{ detailRow.adjustablePower || 0 }}</span>
                <span class="metric-label">削峰可调(kW)</span>
              </div>
              <div class="resource-detail__metric">
                <span class="metric-val green">{{ detailRow.valleyPower || 0 }}</span>
                <span class="metric-label">填谷可调(kW)</span>
              </div>
              <div class="resource-detail__metric">
                <span class="metric-val">{{ detailRow.avg7dPower || 0 }}</span>
                <span class="metric-label">7日均功率(kW)</span>
              </div>
            </div>
          </div>

          <div class="resource-detail__section">
            <div class="resource-detail__section-title">调节参数</div>
            <div class="resource-detail__grid">
              <div class="resource-detail__item">
                <span class="label">削峰系数</span>
                <span class="value">{{ detailRow.adjustableRate || 0 }}</span>
              </div>
              <div class="resource-detail__item">
                <span class="label">填谷系数</span>
                <span class="value">{{ detailRow.valleyRate || 0 }}</span>
              </div>
              <div class="resource-detail__item">
                <span class="label">参与事件次数</span>
                <span class="value"><strong>{{ detailRow.eventCount || 0 }}</strong> 次</span>
              </div>
              <div class="resource-detail__item">
                <span class="label">创建时间</span>
                <span class="value">{{ detailRow.createTime || '—' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { listResource, getResourceStats, getResource, getResourcePower7d, addResource, updateResource, delResource, batchResourceStatus, exportResource } from "@/api/vpp/resource"
import { listAllStation } from "@/api/vpp/station"
import tableEmptyIcon from "@/assets/images/empty.svg"
import acPileImg from "@/assets/images/ac-pile.png"
import dcPileImg from "@/assets/images/dc-pile.png"

export default {
  name: "VppResource",
  data() {
    return {
      loading: true,
      viewMode: 'card',
      tableEmptyIcon,
      acPileImg,
      dcPileImg,
      resourceList: [],
      stats: {},
      stationOptions: [],
      ids: [],
      multiple: true,
      total: 0,
      open: false,
      editId: null,
      editPileNo: '',
      detailOpen: false,
      detailRow: null,
      queryParams: {
        pageNum: 1,
        pageSize: 12,
        keyword: undefined,
        stationId: undefined,
        pileType: undefined,
        participateStatus: undefined,
        deviceStatus: undefined
      },
      form: {},
      miniCharts: {},
      rules: {
        stationId: [{ required: true, message: "请选择场站", trigger: "change" }],
        pileNo: [{ required: true, message: "桩编号不能为空", trigger: "blur" }],
        ratedPower: [{ required: true, message: "额定功率不能为空", trigger: "blur" }]
      }
    }
  },
  computed: {
    valleyRateDisplay() {
      const p = Number(this.form.adjustableRate || 0)
      return Math.round((1 - p) * 100) / 100
    },
    kpiItems() {
      const s = this.stats
      return [
        { label: '参与场站(个)', value: s.stationCount || 0, icon: 'el-icon-office-building' },
        { label: '参与桩数(台)', value: s.pileCount || 0, icon: 'el-icon-cpu' },
        { label: '总额定功率(kW)', value: this.formatNum(s.ratedPower), icon: 'el-icon-odometer' },
        { label: '削峰可调功率(kW)', value: this.formatNum(s.adjustablePower), icon: 'el-icon-odometer' },
        { label: '填谷可调功率(kW)', value: this.formatNum(s.valleyPower), icon: 'el-icon-odometer' },
        { label: '直流桩(台)', value: s.dcCount || 0, icon: 'el-icon-cpu' },
        { label: '交流桩(台)', value: s.acCount || 0, icon: 'el-icon-cpu' },
        { label: '7日基线功率(kW)', value: this.formatNum(s.avg7dPower), icon: 'el-icon-odometer' },
        { label: '平均额定功率(kW)', value: this.avgOf(s.ratedPower, s.pileCount), icon: 'el-icon-odometer' },
        { label: '平均削峰可调(kW)', value: this.avgOf(s.adjustablePower, s.pileCount), icon: 'el-icon-s-data' },
        { label: '平均填谷可调(kW)', value: this.avgOf(s.valleyPower, s.pileCount), icon: 'el-icon-s-data' },
        { label: '削峰可调占比(%)', value: this.ratioOf(s.adjustablePower, s.ratedPower), icon: 'el-icon-pie-chart' }
      ]
    }
  },
  created() {
    this.getList()
    this.getStats()
    this.loadStations()
  },
  mounted() {
    window.addEventListener('resize', this.onWindowResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onWindowResize)
    Object.values(this.miniCharts).forEach(chart => chart && chart.dispose())
  },
  methods: {
    onWindowResize() {
      Object.values(this.miniCharts).forEach(chart => chart && chart.resize())
    },
    handleDetail(row) {
      this.detailRow = row
      this.detailOpen = true
    },
    loadStations() {
      listAllStation().then(res => {
        this.stationOptions = res.data || []
      })
    },
    getList() {
      this.loading = true
      listResource(this.queryParams).then(response => {
        this.resourceList = response.data || []
        this.total = response.total || 0
        this.loading = false
        this.$nextTick(() => {
          this.renderMiniCharts()
        })
      }).catch(() => {
        this.loading = false
      })
    },
    renderMiniCharts() {
      Object.values(this.miniCharts).forEach(chart => chart && chart.dispose())
      this.miniCharts = {}
      const rows = this.resourceList
      if (!rows.length) return
      const ids = rows.map(row => row.resourceId)
      // 后端持久化的7日功率数据（充电负荷每日均值，同一资源同一天值固定，刷新不再随机变化）
      getResourcePower7d(ids).then(res => {
        const trendMap = res.data || {}
        rows.forEach(row => {
          const refName = 'chart_' + row.resourceId
          const el = this.$refs[refName]
          if (!el || !el[0]) return
          const chart = echarts.init(el[0])
          this.miniCharts[row.resourceId] = chart
          // 暂无后端历史数据（表未建/任务未跑）则不渲染，避免出现随机假数据
          const points = trendMap[row.resourceId] || []
          if (!points.length) return
          const days = points.map(p => p.date.slice(5).replace('-', '/'))
          const values = points.map(p => Number(p.power) || 0)
          chart.setOption({
            grid: { left: 0, right: 0, top: 12, bottom: 0 },
            xAxis: { type: 'category', data: days, show: false },
            yAxis: { type: 'value', show: false },
            series: [{
              type: 'line',
              data: values,
              smooth: true,
              showSymbol: true,
              symbol: 'circle',
              symbolSize: 6,
              lineStyle: { width: 2, color: '#0a59f7' },
              itemStyle: { color: '#0a59f7' },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(10,89,247,0.25)' },
                  { offset: 1, color: 'rgba(10,89,247,0.02)' }
                ])
              }
            }],
            tooltip: {
              trigger: 'axis',
              formatter: p => p[0].axisValue + '<br/>功率：' + p[0].value + ' kW'
            }
          })
        })
      }).catch(() => {})
    },
    getStats() {
      getResourceStats().then(response => {
        this.stats = response.data || {}
      })
    },
    formatNum(v) {
      return v === null || v === undefined ? '0' : Number(v).toLocaleString()
    },
    avgOf(n, d) {
      if (!d) return '—'
      return (Number(n || 0) / Number(d)).toFixed(1)
    },
    ratioOf(n, d) {
      if (!d) return '—'
      return (Number(n || 0) / Number(d) * 100).toFixed(1) + '%'
    },
    onPeakRateChange() {
      this.$forceUpdate()
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    handleViewModeChange() {
      this.queryParams.pageNum = 1
      this.queryParams.pageSize = 12
      this.getList()
    },
    resetQuery() {
      this.queryParams = {
        pageNum: 1,
        pageSize: 12,
        keyword: undefined,
        stationId: undefined,
        pileType: undefined,
        participateStatus: undefined,
        deviceStatus: undefined
      }
      this.getList()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.resourceId)
      this.multiple = !selection.length
    },
    handleStatusChange(row, status) {
      const label = status === '1' ? '启用' : '停用'
      this.$modal.confirm('确认将「' + row.stationName + ' · ' + row.pileNo + '」改为' + label + '？').then(() => {
        return batchResourceStatus({ resourceIds: [row.resourceId], participateStatus: status })
      }).then(() => {
        row.participateStatus = status
        // 后端启停接口已联动：启用即在线、停用即离线，本地同步避免卡片状态滞后
        row.deviceStatus = status === '1' ? '1' : '2'
        this.$modal.msgSuccess('已' + label)
        this.getStats()
      }).catch(() => {})
    },
    handleBatchStatus(status) {
      if (!this.ids.length) {
        this.$modal.msgWarning("请先勾选桩")
        return
      }
      batchResourceStatus({ resourceIds: this.ids, participateStatus: status }).then(() => {
        this.$modal.msgSuccess("已批量" + (status === '1' ? '启用' : '停用') + " " + this.ids.length + " 台")
        this.getList()
        this.getStats()
      })
    },
    reset() {
      this.form = { pileType: 'DC', resourceOwnerType: '1', adjustableRate: 0.8, participateStatus: '1', deviceStatus: '1' }
      this.editId = null
      this.editPileNo = ''
    },
    handleAdd() {
      this.reset()
      this.open = true
    },
    onStationChange(stationId) {
      const s = this.stationOptions.find(x => x.stationId === stationId)
      if (s) {
        this.form.stationName = s.stationName
      }
    },
    handleUpdate(row) {
      this.reset()
      this.editPileNo = row.pileNo
      getResource(row.resourceId).then(response => {
        this.form = response.data
        this.editId = row.resourceId
        this.open = true
      })
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.editId) {
            updateResource(this.form).then(() => {
              this.$modal.msgSuccess("保存成功：" + this.form.pileNo + " 已更新")
              this.open = false
              this.getList()
              this.getStats()
            })
          } else {
            addResource(this.form).then(() => {
              this.$modal.msgSuccess("保存成功：" + this.form.pileNo + " 已加入资源台账")
              this.open = false
              this.getList()
              this.getStats()
            })
          }
        }
      })
    },
    handleDelete(row) {
      const ids = row.resourceId || this.ids
      if (!ids) {
        this.$modal.msgWarning("请选择要删除的资源")
        return
      }
      const r = row.resourceId ? this.resourceList.find(x => x.resourceId === row.resourceId) : null
      this.$modal.confirm('是否确认删除？').then(() => {
        return delResource(ids)
      }).then(() => {
        this.getList()
        this.getStats()
        this.$modal.msgSuccess("已删除：" + (r ? r.pileNo : ids))
      }).catch(() => {})
    },
    handleExport() {
      this.$modal.confirm('确认导出当前筛选结果的 Excel 文件？').then(() => {
        return exportResource(this.queryParams)
      }).then(res => {
        const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = '资源台账_' + new Date().toISOString().slice(0, 10) + '.xlsx'
        a.click()
        this.$modal.msgSuccess('导出成功')
      }).catch(() => {})
    },
    tableRowClassName({ row }) {
      if (row.participateStatus === '0') return 'resource-row--disabled'
      return ''
    },
    deviceStatusText(status) {
      if (status === '2') return '离线'
      if (status === '3') return '故障'
      return '在线'
    },
    deviceStatusClass(status) {
      if (status === '2') return 'gray'
      if (status === '3') return 'red'
      return 'green'
    }
  }
}
</script>

<style scoped lang="scss">
.resource-page {
  font-size: 15px;
}

.resource-page .el-form-item__label {
  font-size: 14px;
}

.resource-page .el-input__inner,
.resource-page .el-select .el-input__inner {
  font-size: 14px;
}

.resource-page .el-button {
  font-size: 14px;
}

.resource-page .el-table {
  font-size: 14px;
}

.resource-page .el-table th {
  font-size: 14px;
}

.resource-page .el-table td {
  font-size: 14px;
}

.resource-page .el-dialog {
  font-size: 14px;
}

.resource-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.resource-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.resource-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.resource-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}

.resource-toolbar__right .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.resource-toolbar__right .el-button--primary:hover,
.resource-toolbar__right .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
}

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 14px;
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

.badge.gray {
  background: #f4f4f5;
  color: #909399;
}

.badge.purple {
  background: #f5f0ff;
  color: #8a5cf6;
}

.text-primary {
  color: #0a59f7;
  font-weight: 600;
}

.badge.red {
  background: #fef0f0;
  color: #f56c6c;
}

.text-success {
  color: #67c23a;
}

.text-blue {
  color: #0a59f7;
  font-weight: 600;
}

.text-green {
  color: #67c23a;
  font-weight: 600;
}

.resource-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(max(400px, calc((100% - 45px) / 4)), 1fr));
  gap: 15px;
}

.resource-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 16px;
  transition: all 0.2s;
  min-width: 0;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border-color: #d0d7e2;
  }

  &__pile-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  &__pile-img-wrap {
    width: 70px;
    height: 105px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  &__pile-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &__pile-type-label {
    font-size: 13px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 12px;

    &.dc {
      background: #edf3ff;
      color: #0a59f7;
    }
    &.ac {
      background: #f5f0ff;
      color: #8a5cf6;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__title-group {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    font-size: 19px;
    font-weight: 600;
    color: #1f2d3d;
    line-height: 1.3;
  }

  &__station-name {
    font-size: 14px;
    color: #909399;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__tags {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  &__status-tag {
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    flex-shrink: 0;

    &.on,
    &.green {
      background: #f0f9eb;
      color: #67c23a;
    }
    &.off,
    &.gray {
      background: #f4f4f5;
      color: #909399;
    }
    &.red {
      background: #fef0f0;
      color: #f56c6c;
    }
  }

  &__info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f8f9fa;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 12px;
    font-size: 15px;

    .label {
      color: #909399;
    }

    .value {
      color: #1f2d3d;
      font-weight: 500;
    }
  }

  &__metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 12px;
  }

  .metric-item {
    text-align: center;
    padding: 12px 6px;
    background: #f8f9fa;
    border-radius: 6px;

    .metric-value {
      font-size: 24px;
      font-weight: 700;
      color: #1f2d3d;
      line-height: 1.2;
      margin-bottom: 4px;
    }

    .metric-label {
      font-size: 13px;
      color: #909399;
    }

    &.highlight-blue .metric-value {
      color: #0a59f7;
    }

    &.highlight-green .metric-value {
      color: #67c23a;
    }
  }

  &__chart-section {
    margin-bottom: 12px;
    border-top: 1px solid #f0f0f0;
    padding-top: 12px;
  }

  &__chart-title {
    font-size: 14px;
    font-weight: 600;
    color: #606266;
    margin-bottom: 8px;
  }

  &__chart {
    width: 100%;
    height: 80px;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid #f0f0f0;
    padding-top: 10px;

    .event-count {
      font-size: 14px;
      color: #909399;

      strong {
        color: #1f2d3d;
        font-weight: 600;
      }
    }
  }

  &__ops {
    display: flex;
    gap: 4px;

    .resource-op-danger {
      color: #f56c6c;
    }
  }
}

.resource-card-empty {
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

.resource-detail {
  display: flex;
  gap: 24px;

  &__left {
    flex-shrink: 0;
    width: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 16px;
    background: #f8f9fa;
    border-radius: 12px;
  }

  &__pile-img-wrap {
    width: 180px;
    height: 270px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    overflow: hidden;
  }

  &__pile-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  &__pile-label {
    font-size: 17px;
    font-weight: 600;
    margin-bottom: 8px;

    &.dc {
      color: #0a59f7;
    }
    &.ac {
      color: #8a5cf6;
    }
  }

  &__pile-no {
    font-size: 16px;
    color: #606266;
    margin-bottom: 12px;
  }

  &__status {
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;

    &.on {
      background: #f0f9eb;
      color: #67c23a;
    }
    &.off {
      background: #f4f4f5;
      color: #909399;
    }
  }

  &__right {
    flex: 1;
    min-width: 0;
  }

  &__section {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__section-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2d3d;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e8ecf1;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px;
  }

  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: #f8f9fa;
    border-radius: 6px;
    min-width: 0;

    .label {
      flex-shrink: 0;
      white-space: nowrap;
      font-size: 14px;
      color: #909399;
    }

    .value {
      flex: 1;
      min-width: 0;
      text-align: right;
      font-size: 14px;
      color: #1f2d3d;
      font-weight: 500;
      word-break: break-all;

      strong {
        color: #0a59f7;
        font-size: 16px;
      }
    }
  }

  &__metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  &__metric {
    text-align: center;
    padding: 12px 8px;
    background: #f8f9fa;
    border-radius: 6px;

    .metric-val {
      display: block;
      font-size: 22px;
      font-weight: 700;
      color: #1f2d3d;
      line-height: 1.2;
      margin-bottom: 4px;

      &.blue {
        color: #0a59f7;
      }

      &.green {
        color: #67c23a;
      }
    }

    .metric-label {
      font-size: 13px;
      color: #909399;
    }
  }
}
</style>

<style>
.resource-page .resource-list-search {
  display: block;
  margin-bottom: 0;
}

/* 小屏每行 3 个搜索项，大屏每行 4 个；控件保持 11rem，按钮固定在第一行末尾 */
.resource-page .resource-list-search__grid {
  display: grid;
  grid-template-columns: repeat(3, max-content);
  gap: 12px 16px;
  align-items: center;
}

.resource-page .resource-list-search__grid .resource-list-search__item {
  margin-right: 0;
  margin-bottom: 0;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.resource-page .resource-list-search__item--station {
  grid-row: 1;
  grid-column: 1;
}

.resource-page .resource-list-search__item--type {
  grid-row: 1;
  grid-column: 2;
}

.resource-page .resource-list-search__item--participate {
  grid-row: 1;
  grid-column: 3;
}

.resource-page .resource-list-search__item--device {
  grid-row: 2;
  grid-column: 1;
}

.resource-page .resource-list-search__item--keyword {
  grid-row: 2;
  grid-column: 2;
}

.resource-page .resource-list-search__item--actions {
  grid-row: 1;
  grid-column: 4;
  margin-left: 8px;
}

@media (min-width: 1600px) {
  .resource-page .resource-list-search__grid {
    grid-template-columns: repeat(4, max-content);
  }

  .resource-page .resource-list-search__item--device {
    grid-row: 1;
    grid-column: 4;
  }

  .resource-page .resource-list-search__item--actions {
    grid-row: 1;
    grid-column: 5;
  }

  .resource-page .resource-list-search__item--keyword {
    grid-row: 2;
    grid-column: 1;
  }
}

.resource-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.resource-page .ems-list-search__control {
  width: 11rem;
}

.resource-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.resource-page .resource-content-split {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
  background: transparent !important;
}

.resource-search-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.25rem 1.25rem;
}

.resource-content-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
}

.resource-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.resource-content-card .table-shell {
  background: transparent;
}

.resource-content-card .table-shell__wrap--plain {
  border: none;
  border-radius: 0;
  overflow: visible;
}

.resource-page .ems-list-table .resource-row--disabled td {
  opacity: 0.6;
}

.resource-form-dialog .el-dialog__title,
.resource-detail-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.resource-form-dialog .el-dialog__header,
.resource-detail-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.resource-detail-dialog .el-dialog__body {
  padding: 20px 24px;
}

.resource-form-dialog .el-dialog__body {
  padding: 20px 24px 8px;
}

.resource-form-dialog .el-form-item__label {
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.85);
}

.resource-form-dialog .el-select,
.resource-form-dialog .el-input,
.resource-form-dialog .el-input-number {
  width: 100%;
}

.resource-form-dialog .el-form-item__content > .el-select,
.resource-form-dialog .el-form-item__content > .el-input,
.resource-form-dialog .el-form-item__content > .el-input-number {
  display: block;
  width: 100%;
}

.resource-form-dialog .resource-form__control {
  width: 100%;
}

.resource-form-dialog .resource-form__unit-wrap {
  display: flex;
  align-items: center;
  width: 100%;
}

.resource-form-dialog .resource-form__unit-wrap .el-input-number {
  flex: 1;
  width: auto;
}

.resource-form-dialog .resource-form__unit {
  margin-left: 8px;
  flex-shrink: 0;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.resource-form-dialog .resource-form__hint {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.45);
}

.resource-form-dialog .resource-form__hint--danger {
  color: #f56c6c;
}

.resource-form-dialog .resource-form__tip {
  margin: -4px 0 12px 110px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.4;
}
</style>
