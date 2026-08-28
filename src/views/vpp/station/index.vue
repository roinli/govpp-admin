<template>
  <div class="app-container station-page nco-settings-container">
    <div class="new-style-menu-title">场站管理</div>

    <div class="nco-settings-container-content station-content-split">
      <div class="station-search-card">
        <el-form
          ref="queryForm"
          :model="queryParams"
          size="small"
          :inline="true"
          label-width="90px"
          class="ems-list-search station-list-search"
          @submit.native.prevent
        >
          <div class="station-list-search__row">
            <el-form-item label="场站名称" prop="stationName" class="station-list-search__item">
              <el-select
                v-model="queryParams.stationName"
                placeholder="请选择场站"
                clearable
                class="ems-list-search__control"
                @change="handleQuery"
              >
                <el-option
                  v-for="s in stationOptions"
                  :key="s.stationId"
                  :label="s.stationName"
                  :value="s.stationName"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status" class="station-list-search__item">
              <el-select
                v-model="queryParams.status"
                placeholder="请选择状态"
                clearable
                class="ems-list-search__control"
              >
                <el-option
                  v-for="d in statusOptions"
                  :key="d.value"
                  :label="d.label"
                  :value="d.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="联系人" prop="contact" class="station-list-search__item">
              <el-input
                v-model="queryParams.contact"
                placeholder="联系人"
                clearable
                class="ems-list-search__control"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item class="ems-list-search__actions station-list-search__item">
              <el-button type="primary" @click="handleQuery">查询</el-button>
              <el-button @click="resetQuery">重置</el-button>
            </el-form-item>
          </div>
        </el-form>
      </div>

      <div class="station-content-card">
        <div class="station-toolbar">
          <div class="station-toolbar__left">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="card"><i class="el-icon-s-grid" /> 卡片</el-radio-button>
              <el-radio-button label="list"><i class="el-icon-s-operation" /> 列表</el-radio-button>
            </el-radio-group>
          </div>
          <div class="station-toolbar__right">
            <el-button type="primary" @click="handleAdd" v-hasPermi="['vpp:station:add']">新增</el-button>
          </div>
        </div>

        <div class="table-shell">
          <div class="table-shell__wrap" :class="{ 'table-shell__wrap--plain': viewMode === 'card' }">
            <div v-if="viewMode === 'card'" v-loading="loading" class="station-card-grid">
            <div v-for="row in stationList" :key="row.stationId" class="station-card">
              <!-- 左侧：场站图片 -->
              <div class="station-card__visual">
                <div class="station-card__img-wrap">
                  <img :src="row.imageUrl || stationDefaultImg" class="station-card__img" />
                </div>
                <span class="station-card__status" :class="row.status === '1' ? 'on' : 'off'">
                  {{ row.status === '1' ? '正常' : '停用' }}
                </span>
              </div>
              <!-- 右侧：信息区域 -->
              <div class="station-card__content">
              <div class="station-card__head">
                <div class="station-card__name">{{ row.stationName }}</div>
                <div class="station-card__addr">
                  <i class="el-icon-location-outline" />
                  <span>{{ row.address || '未设置地址' }}</span>
                </div>
              </div>
              <div class="station-card__metrics">
                <div class="station-card__metric">
                  <span class="station-card__metric-val">{{ row.capacity }}</span>
                  <span class="station-card__metric-label">容量(kW)</span>
                </div>
                <div class="station-card__metric">
                  <span class="station-card__metric-val">{{ formatMoney(row.totalIncome) }}</span>
                  <span class="station-card__metric-label">总收益(元)</span>
                </div>
                <div class="station-card__metric">
                  <span class="station-card__metric-val">{{ deviceTotal(row) }}</span>
                  <span class="station-card__metric-label">设备总数</span>
                </div>
              </div>
              <div class="station-card__devices">
                <div class="station-card__metric">
                  <span class="station-card__metric-val" style="color:#67C23A">{{ row.onlineCount || 0 }}</span>
                  <span class="station-card__metric-label">在线</span>
                </div>
                <div class="station-card__metric">
                  <span class="station-card__metric-val" style="color:#909399">{{ row.offlineCount || 0 }}</span>
                  <span class="station-card__metric-label">离线</span>
                </div>
                <div class="station-card__metric">
                  <span class="station-card__metric-val" style="color:#F56C6C">{{ row.faultCount || 0 }}</span>
                  <span class="station-card__metric-label">故障</span>
                </div>
              </div>
              <div class="station-card__ops">
                <el-button size="mini" type="text" @click="handleDetail(row)" v-hasPermi="['vpp:station:query']">详情</el-button>
                <el-button size="mini" type="text" @click="handleUpdate(row)" v-hasPermi="['vpp:station:edit']">修改</el-button>
                <el-button size="mini" type="text" @click="openRate(row)" v-hasPermi="['vpp:station:rate']">分成设置</el-button>
                <el-button size="mini" type="text" style="color:#F56C6C" @click="handleDelete(row)" v-hasPermi="['vpp:station:remove']">删除</el-button>
              </div>
              </div>
            </div>
            <div v-if="!stationList.length" class="station-card-empty">
              <img :src="tableEmptyIcon" alt="">
              <p>暂无场站数据</p>
            </div>
          </div>
          <el-table
            v-else
            v-loading="loading"
            :data="stationList"
            class="ems-list-table"
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
            <el-table-column label="图片" align="center" width="80">
              <template slot-scope="scope">
                <img :src="scope.row.imageUrl || stationDefaultImg" class="station-table-thumb" />
              </template>
            </el-table-column>
            <el-table-column label="场站名称" align="center" prop="stationName" min-width="140" show-overflow-tooltip />
            <el-table-column label="地址" align="center" prop="address" min-width="160" show-overflow-tooltip />
            <el-table-column label="容量(kW)" align="center" prop="capacity" min-width="100" />
            <el-table-column label="总收益(元)" align="center" min-width="110">
              <template slot-scope="scope">
                <span class="text-income">{{ formatMoney(scope.row.totalIncome) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="设备总数" align="center" width="90">
              <template slot-scope="scope">
                <span class="dev-count">{{ deviceTotal(scope.row) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="在线设备" align="center" width="90">
              <template slot-scope="scope">
                <span class="dev-count online">{{ scope.row.onlineCount || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="离线设备" align="center" width="90">
              <template slot-scope="scope">
                <span class="dev-count offline">{{ scope.row.offlineCount || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="故障设备" align="center" width="90">
              <template slot-scope="scope">
                <span class="dev-count fault">{{ scope.row.faultCount || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="分成运营商占比" align="center" min-width="100">
              <template slot-scope="scope">
                {{ scope.row.operatorRate != null ? Math.round(Number(scope.row.operatorRate) * 100) + '%' : '1%' }}
              </template>
            </el-table-column>
            <el-table-column label="联系人" align="center" prop="contact" min-width="100" show-overflow-tooltip />
            <el-table-column label="联系电话" align="center" prop="phone" min-width="120" />
            <el-table-column label="状态" align="center" width="100">
              <template slot-scope="scope">
                <span v-if="scope.row.status === '1'" class="badge green">正常</span>
                <span v-else class="badge gray">停用</span>
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
                    v-hasPermi="['vpp:station:query']"
                  />
                </el-tooltip>
                <el-tooltip content="修改" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-edit"
                    class="ems-list-table__ops-btn"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['vpp:station:edit']"
                  />
                </el-tooltip>
                <el-tooltip content="分成设置" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-setting"
                    class="ems-list-table__ops-btn"
                    @click="openRate(scope.row)"
                    v-hasPermi="['vpp:station:rate']"
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-delete"
                    class="ems-list-table__ops-btn"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['vpp:station:remove']"
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
      :title="title"
      :visible.sync="open"
      width="600px"
      append-to-body
      custom-class="station-form-dialog"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="场站名称" prop="stationName">
          <el-input v-model="form.stationName" placeholder="请输入场站名称" class="station-form__control" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <div class="station-address-row">
            <el-input v-model="form.address" placeholder="请输入场站地址" class="station-form__control" />
            <el-button type="primary" icon="el-icon-location-information" @click="mapDialogVisible = true">选择位置</el-button>
          </div>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="省" prop="province">
              <el-select v-model="form.province" placeholder="请选择省份" clearable filterable class="station-form__control">
                <el-option v-for="p in provinceOptions" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="市" prop="city">
              <el-select v-model="form.city" placeholder="请选择城市" clearable filterable allow-create default-first-option class="station-form__control">
                <el-option v-for="c in cityOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="经度" prop="longitude">
              <el-input-number v-model="form.longitude" :precision="6" :controls="false" class="station-form__control station-form__coord" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度" prop="latitude">
              <el-input-number v-model="form.latitude" :precision="6" :controls="false" class="station-form__control station-form__coord" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="容量(kW)" prop="capacity">
          <el-input-number v-model="form.capacity" :min="0" :precision="2" class="station-form__control" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact">
          <el-input v-model="form.contact" placeholder="请输入联系人" class="station-form__control" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系电话" class="station-form__control" />
        </el-form-item>
        <el-form-item label="场站图片" prop="imageUrl">
          <image-upload v-model="form.imageUrl" :limit="1" :file-size="5" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="1">正常</el-radio>
            <el-radio label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" class="station-form__control" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="场站详情"
      :visible.sync="detailOpen"
      width="820px"
      append-to-body
      custom-class="station-detail-dialog"
    >
      <div v-if="detailRow" class="station-detail">
        <!-- 左侧：场站图片完整展示 -->
        <div class="station-detail__left">
          <div class="station-detail__img-wrap">
            <el-image
              :src="detailRow.imageUrl || stationDefaultImg"
              :preview-src-list="[detailRow.imageUrl || stationDefaultImg]"
              fit="contain"
              class="station-detail__img"
            />
          </div>
          <div class="station-detail__name">{{ detailRow.stationName }}</div>
          <span class="station-detail__status" :class="detailRow.status === '1' ? 'on' : 'off'">
            {{ detailRow.status === '1' ? '正常' : '停用' }}
          </span>
        </div>

        <!-- 右侧：信息分组 -->
        <div class="station-detail__right">
          <div class="station-detail__section">
            <div class="station-detail__section-title">收益与设备</div>
            <div class="station-detail__metrics">
              <div class="station-detail__metric">
                <span class="metric-val orange">{{ formatMoney(detailRow.totalIncome) }}</span>
                <span class="metric-label">总收益(元)</span>
              </div>
              <div class="station-detail__metric">
                <span class="metric-val">{{ deviceTotal(detailRow) }}</span>
                <span class="metric-label">设备总数</span>
              </div>
              <div class="station-detail__metric">
                <span class="metric-val green">{{ detailRow.onlineCount || 0 }}</span>
                <span class="metric-label">在线</span>
              </div>
              <div class="station-detail__metric">
                <span class="metric-val gray">{{ detailRow.offlineCount || 0 }}</span>
                <span class="metric-label">离线</span>
              </div>
              <div class="station-detail__metric">
                <span class="metric-val red">{{ detailRow.faultCount || 0 }}</span>
                <span class="metric-label">故障</span>
              </div>
            </div>
          </div>

          <div class="station-detail__section">
            <div class="station-detail__section-title">基本信息</div>
            <div class="station-detail__grid">
              <div class="station-detail__item"><span class="label">容量(kW)</span><span class="value">{{ detailRow.capacity || '—' }}</span></div>
              <div class="station-detail__item"><span class="label">运营商占比</span><span class="value">{{ detailRow.operatorRate != null ? Math.round(Number(detailRow.operatorRate) * 100) + '%' : '1%' }}</span></div>
              <div class="station-detail__item"><span class="label">省份</span><span class="value">{{ detailRow.province || '—' }}</span></div>
              <div class="station-detail__item"><span class="label">城市</span><span class="value">{{ detailRow.city || '—' }}</span></div>
              <div class="station-detail__item"><span class="label">经度</span><span class="value">{{ detailRow.longitude || '—' }}</span></div>
              <div class="station-detail__item"><span class="label">纬度</span><span class="value">{{ detailRow.latitude || '—' }}</span></div>
            </div>
            <div class="station-detail__item station-detail__item--full"><span class="label">详细地址</span><span class="value">{{ detailRow.address || '—' }}</span></div>
          </div>

          <div class="station-detail__section">
            <div class="station-detail__section-title">联系信息</div>
            <div class="station-detail__grid">
              <div class="station-detail__item"><span class="label">联系人</span><span class="value">{{ detailRow.contact || '—' }}</span></div>
              <div class="station-detail__item"><span class="label">联系电话</span><span class="value">{{ detailRow.phone || '—' }}</span></div>
              <div class="station-detail__item"><span class="label">创建时间</span><span class="value">{{ detailRow.createTime || '—' }}</span></div>
              <div class="station-detail__item"><span class="label">备注</span><span class="value">{{ detailRow.remark || '—' }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      :title="'分成设置：' + rateForm.stationName"
      :visible.sync="rateOpen"
      width="440px"
      append-to-body
      custom-class="station-rate-dialog"
    >
      <el-form label-width="120px">
        <el-form-item label="分成运营商占比(%)">
          <el-input-number
            v-model="rateForm.operatorPercent"
            :min="0"
            :max="100"
            :precision="0"
            class="station-form__control"
          />
        </el-form-item>
        <el-form-item label="场站占比(%)">
          <el-input :value="100 - Number(rateForm.operatorPercent)" disabled class="station-form__control" />
        </el-form-item>
      </el-form>
      <div class="station-rate-hint">运营商与场站的分成比例，总和为 100%</div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="rateOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitRate">确 定</el-button>
      </div>
    </el-dialog>

    <amap-location-picker-dialog
      :visible.sync="mapDialogVisible"
      :initial-address="form.address"
      :initial-longitude="form.longitude"
      :initial-latitude="form.latitude"
      @confirm="handleLocationConfirm"
    />
  </div>
</template>

<script>
import { listStation, listAllStation, getStationStats, getStation, addStation, updateStation, delStation } from "@/api/vpp/station"
import tableEmptyIcon from "@/assets/images/empty.svg"
import stationDefaultImg from "@/assets/images/station.png"
import { AmapLocationPickerDialog } from "@/components/vpp"

export default {
  name: "VppStation",
  components: { AmapLocationPickerDialog },
  data() {
    return {
      loading: true,
      viewMode: 'card',
      tableEmptyIcon,
      stationDefaultImg,
      stationList: [],
      stats: {},
      ids: [],
      multiple: true,
      total: 0,
      title: "",
      open: false,
      detailOpen: false,
      detailRow: null,
      rateOpen: false,
      rateForm: {},
      mapDialogVisible: false,
      statusOptions: [{ label: '正常', value: '1' }, { label: '停用', value: '0' }],
      provinceOptions: [
        '北京市', '天津市', '河北省', '山西省', '内蒙古自治区', '辽宁省', '吉林省', '黑龙江省',
        '上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省',
        '湖北省', '湖南省', '广东省', '广西壮族自治区', '海南省', '重庆市', '四川省', '贵州省', '云南省',
        '西藏自治区', '陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区', '台湾省', '香港特别行政区', '澳门特别行政区'
      ],
      provinceCityMap: {
        '北京市': ['北京市'],
        '天津市': ['天津市'],
        '河北省': ['石家庄市', '唐山市', '保定市', '廊坊市'],
        '山西省': ['太原市', '大同市', '阳泉市', '运城市'],
        '内蒙古自治区': ['呼和浩特市', '包头市', '鄂尔多斯市'],
        '辽宁省': ['沈阳市', '大连市', '鞍山市', '营口市'],
        '吉林省': ['长春市', '吉林市', '四平市'],
        '黑龙江省': ['哈尔滨市', '齐齐哈尔市', '大庆市'],
        '上海市': ['上海市'],
        '江苏省': ['南京市', '苏州市', '无锡市', '常州市'],
        '浙江省': ['杭州市', '宁波市', '温州市', '绍兴市'],
        '安徽省': ['合肥市', '芜湖市', '蚌埠市'],
        '福建省': ['福州市', '厦门市', '泉州市'],
        '江西省': ['南昌市', '九江市', '赣州市'],
        '山东省': ['济南市', '青岛市', '烟台市', '济宁市'],
        '河南省': ['郑州市', '洛阳市', '开封市'],
        '湖北省': ['武汉市', '宜昌市', '襄阳市'],
        '湖南省': ['长沙市', '株洲市', '湘潭市'],
        '广东省': ['广州市', '深圳市', '佛山市', '东莞市'],
        '广西壮族自治区': ['南宁市', '柳州市', '桂林市'],
        '海南省': ['海口市', '三亚市'],
        '重庆市': ['重庆市'],
        '四川省': ['成都市', '绵阳市', '德阳市', '宜宾市', '南充市', '泸州市', '达州市', '乐山市', '自贡市', '攀枝花市', '广元市', '遂宁市', '内江市', '资阳市', '眉山市', '广安市', '巴中市', '雅安市'],
        '贵州省': ['贵阳市', '遵义市'],
        '云南省': ['昆明市', '曲靖市', '大理市'],
        '西藏自治区': ['拉萨市'],
        '陕西省': ['西安市', '宝鸡市', '咸阳市'],
        '甘肃省': ['兰州市', '天水市'],
        '青海省': ['西宁市'],
        '宁夏回族自治区': ['银川市'],
        '新疆维吾尔自治区': ['乌鲁木齐市'],
        '台湾省': ['台北市'],
        '香港特别行政区': ['香港'],
        '澳门特别行政区': ['澳门'],
      },
      stationOptions: [],
      queryParams: { pageNum: 1, pageSize: 12, stationName: undefined, status: undefined, contact: undefined },
      form: {},
      rules: {
        stationName: [{ required: true, message: "场站名称不能为空", trigger: "blur" }],
        capacity: [{ required: true, message: "容量不能为空", trigger: "blur" }]
      }
    }
  },
  computed: {
    cityOptions() {
      const options = (this.form.province && this.provinceCityMap[this.form.province]) || []
      if (this.form.city && !options.includes(this.form.city)) {
        return [this.form.city, ...options]
      }
      return options
    },
    kpiItems() {
      const s = this.stats
      return [
        { label: '场站数量(个)', value: s.stationCount || 0, icon: 'el-icon-office-building' },
        { label: '总容量(kW)', value: this.formatNum(s.totalCapacity), icon: 'el-icon-odometer' },
        { label: '关联桩数(台)', value: s.pileCount || 0, icon: 'el-icon-cpu' },
        { label: '启用场站(个)', value: s.enabledCount || 0, icon: 'el-icon-office-building' },
        { label: '削峰可调(kW)', value: this.formatNum(s.adjustablePower), icon: 'el-icon-s-data' },
        { label: '填谷可调(kW)', value: this.formatNum(s.valleyPower), icon: 'el-icon-s-data' },
        { label: '停用场站(个)', value: s.disabledCount || 0, icon: 'el-icon-office-building' },
        { label: '平均容量(kW)', value: this.formatNum(s.avgCapacity), icon: 'el-icon-odometer' },
        { label: '额定功率(kW)', value: this.formatNum(s.ratedPower), icon: 'el-icon-odometer' },
        { label: '7日基线功率(kW)', value: this.formatNum(s.baselinePower), icon: 'el-icon-odometer' },
        { label: '直流桩(台)', value: s.dcPileCount || 0, icon: 'el-icon-cpu' },
        { label: '交流桩(台)', value: s.acPileCount || 0, icon: 'el-icon-cpu' }
      ]
    }
  },
  watch: {
    'form.province'(val, oldVal) {
      if (oldVal !== undefined && val !== oldVal) {
        this.form.city = undefined
      }
    }
  },
  created() {
    this.getList()
    this.loadStations()
    this.getStats()
  },
  methods: {
    getList() {
      this.loading = true
      listStation(this.queryParams).then(response => {
        this.stationList = response.data || []
        this.total = response.total || 0
        this.loading = false
      }).catch(() => { this.loading = false })
    },
    getStats() {
      getStationStats().then(response => { this.stats = response.data || {} })
    },
    loadStations() {
      listAllStation().then(res => {
        this.stationOptions = res.data || []
      })
    },
    formatNum(v) {
      return v === null || v === undefined ? '0' : Number(v).toLocaleString()
    },
    formatMoney(v) {
      return v === null || v === undefined ? '0.00' : Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    deviceTotal(row) {
      return (Number(row.onlineCount) || 0) + (Number(row.offlineCount) || 0) + (Number(row.faultCount) || 0)
    },
    handleDetail(row) {
      this.detailRow = row
      this.detailOpen = true
    },
    handleQuery() { this.queryParams.pageNum = 1; this.getList() },
    resetQuery() {
      this.queryParams = { pageNum: 1, pageSize: 12, stationName: undefined, status: undefined, contact: undefined }
      this.handleQuery()
    },
    handleSelectionChange(selection) { this.ids = selection.map(item => item.stationId); this.multiple = !selection.length },
    reset() { this.form = { status: '1', province: undefined, city: undefined, longitude: undefined, latitude: undefined, imageUrl: undefined } },
    handleAdd() { this.reset(); this.open = true; this.title = "新增场站" },
    handleUpdate(row) {
      this.reset()
      getStation(row.stationId).then(response => { this.form = response.data; this.open = true; this.title = "修改场站" })
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.stationId != null) {
            updateStation(this.form).then(() => { this.$modal.msgSuccess("修改成功"); this.open = false; this.getList(); this.getStats() })
          } else {
            addStation(this.form).then(() => { this.$modal.msgSuccess("新增成功"); this.open = false; this.getList(); this.getStats() })
          }
        }
      })
    },
    handleDelete(row) {
      const ids = row.stationId || this.ids
      this.$modal.confirm('是否确认删除选中的场站？').then(() => {
        return delStation(ids)
      }).then(() => { this.getList(); this.getStats(); this.$modal.msgSuccess("删除成功") }).catch(() => {})
    },
    cancel() { this.open = false; this.reset() },
    handleLocationConfirm(location) {
      this.$set(this.form, 'address', location.address || '')
      this.$set(this.form, 'longitude', location.longitude !== undefined && location.longitude !== null ? Number(location.longitude) : undefined)
      this.$set(this.form, 'latitude', location.latitude !== undefined && location.latitude !== null ? Number(location.latitude) : undefined)
      this.applyProvinceCityFromAddress(location.address)
    },
    applyProvinceCityFromAddress(address) {
      if (!address) {
        return
      }
      const matchedProvince = this.provinceOptions.find(province => address.includes(province))
      if (!matchedProvince) {
        return
      }
      const cities = this.provinceCityMap[matchedProvince] || []
      const matchedCity = cities.find(city => address.includes(city))
      this.form.province = matchedProvince
      this.$nextTick(() => {
        if (matchedCity) {
          this.form.city = matchedCity
        }
      })
    },
    openRate(row) {
      this.rateForm = { stationId: row.stationId, stationName: row.stationName, operatorPercent: row.operatorRate != null ? Number(row.operatorRate) * 100 : 1 }
      this.rateOpen = true
    },
    submitRate() {
      const operatorRate = (Number(this.rateForm.operatorPercent) / 100).toFixed(2)
      updateStation({ stationId: this.rateForm.stationId, operatorRate: operatorRate }).then(() => {
        this.$modal.msgSuccess("分成设置已保存")
        this.rateOpen = false
        this.getList()
      })
    }
  }
}
</script>

<style scoped lang="scss">
.userStatisticsMain {
  width: 100%;
  position: relative;
  margin-top: 0.75rem;

  .topHead {
    width: 100%;

    .content-top {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
    }
    .topItem {
      flex: 0 0 calc((100% - 70px) / 6);
      min-height: 100px;
      border-radius: 14px;
      padding: 18px 18px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      position: relative;
      overflow: hidden;
      transition: transform .25s ease, box-shadow .25s ease;
      cursor: default;
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 28px rgba(0,0,0,.18);
      }
      &__bg {
        position: absolute;
        inset: 0;
        z-index: 0;
        opacity: .92;
      }
      &__icon-wrap {
        position: relative;
        z-index: 1;
        width: 42px;
        height: 42px;
        border-radius: 12px;
        background: rgba(255,255,255,.22);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 2px;
        i {
          font-size: 20px;
          color: #fff;
        }
      }
      &__body {
        position: relative;
        z-index: 1;
        flex: 1;
        min-width: 0;
      }
      &__value {
        font-size: 26px;
        font-weight: 700;
        color: #fff;
        line-height: 1.15;
        letter-spacing: -.5px;
      }
      &__label {
        font-size: 11px;
        color: rgba(255,255,255,.85);
        margin-top: 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      &__deco {
        position: absolute;
        right: -16px;
        bottom: -16px;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: rgba(255,255,255,.08);
        z-index: 0;
        pointer-events: none;
      }
    }
    .topItem--0 .topItem__bg { background: linear-gradient(135deg, #0C65F5 0%, #4fc3f7 100%); }
    .topItem--1 .topItem__bg { background: linear-gradient(135deg, #01CB76 0%, #4db6ac 100%); }
    .topItem--2 .topItem__bg { background: linear-gradient(135deg, #6855FC 0%, #9fa8da 100%); }
    .topItem--3 .topItem__bg { background: linear-gradient(135deg, #FDB924 0%, #ffb74d 100%); }
    .topItem--4 .topItem__bg { background: linear-gradient(135deg, #1890FF 0%, #40a9ff 100%); }
    .topItem--5 .topItem__bg { background: linear-gradient(135deg, #F4601F 0%, #ff8a65 100%); }
    .topItem--6 .topItem__bg { background: linear-gradient(135deg, #909399 0%, #bdbdbd 100%); }
    .topItem--7 .topItem__bg { background: linear-gradient(135deg, #00B4D8 0%, #4dd0e1 100%); }
    .topItem--8 .topItem__bg { background: linear-gradient(135deg, #8A5CF6 0%, #b39ddb 100%); }
    .topItem--9 .topItem__bg { background: linear-gradient(135deg, #36CFC9 0%, #80cbc4 100%); }
    .topItem--10 .topItem__bg { background: linear-gradient(135deg, #0C65F5 0%, #4fc3f7 100%); }
    .topItem--11 .topItem__bg { background: linear-gradient(135deg, #01CB76 0%, #4db6ac 100%); }
  }
}

.station-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 16px 0;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.station-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.station-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.station-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.station-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}

.station-toolbar__right .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.station-toolbar__right .el-button--primary:hover,
.station-toolbar__right .el-button--primary:focus {
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

.badge.green {
  background: #f0f9eb;
  color: #67c23a;
}

.badge.gray {
  background: #f4f4f5;
  color: #909399;
}

/* 卡片自适应：最多一行 4 个，窄屏自动减少列数（对齐资源台账） */
.station-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(max(400px, calc((100% - 45px) / 4)), 1fr));
  gap: 15px;
}

.station-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  gap: 14px;
  min-width: 0;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  &__visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  &__img-wrap {
    width: 132px;
    height: 90px;
    border-radius: 8px;
    overflow: hidden;
    background: #f5f7fa;
  }

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  &__head {
    margin-bottom: 10px;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    color: #1f2d3d;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 4px;
  }

  &__status {
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 10px;

    &.on {
      background: #f0f9eb;
      color: #67c23a;
    }
    &.off {
      background: #f4f4f5;
      color: #909399;
    }
  }

  &__addr {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #909399;

    i {
      font-size: 14px;
    }

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__metrics {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__metric {
    display: flex;
    flex-direction: column;
    background: #f8fafc;
    border-radius: 6px;
    padding: 8px 10px;
    min-width: 0;

    &-val {
      font-size: 15px;
      font-weight: 700;
      color: #1f2d3d;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-label {
      font-size: 11px;
      color: #909399;
      margin-top: 2px;
    }
  }

  &__contact {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 13px;
    color: #606266;
    margin-bottom: 12px;
    padding: 10px;
    background: #fafbfc;
    border-radius: 6px;

    span {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      i {
        font-size: 14px;
        color: #909399;
        flex-shrink: 0;
      }
    }
  }

  &__ops {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-top: 1px solid #f0f0f0;
    padding-top: 10px;

    .el-button--mini.el-button--text {
      padding: 5px 0;
      justify-content: center;
    }
  }

  &__devices {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__device {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    flex: 1;
    font-size: 12px;
    padding: 4px 0;
    border-radius: 10px;

    i {
      font-size: 13px;
    }

    &.online {
      background: #f0f9eb;
      color: #67c23a;
    }
    &.offline {
      background: #f4f4f5;
      color: #909399;
    }
    &.fault {
      background: #fef0f0;
      color: #f56c6c;
    }
  }
}

.station-table-thumb {
  width: 56px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  display: inline-block;
}

.text-income {
  color: #e6a23c;
  font-weight: 600;
}

.dev-count {
  font-weight: 600;

  &.online {
    color: #67c23a;
  }
  &.offline {
    color: #909399;
  }
  &.fault {
    color: #f56c6c;
  }
}

.station-card-empty {
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

.station-detail {
  display: flex;
  gap: 24px;

  &__left {
    flex-shrink: 0;
    width: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 12px;
  }

  &__img-wrap {
    width: 100%;
    height: 220px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    background: #fff;
    overflow: hidden;
  }

  &__img {
    width: 100%;
    height: 100%;
    cursor: zoom-in;

    ::v-deep img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  }

  &__name {
    font-size: 17px;
    font-weight: 600;
    color: #1f2d3d;
    margin-bottom: 10px;
    text-align: center;
    word-break: break-all;
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
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f8f9fa;
    border-radius: 6px;

    .label {
      font-size: 13px;
      color: #909399;
      flex-shrink: 0;
    }

    .value {
      font-size: 14px;
      color: #1f2d3d;
      font-weight: 500;
      text-align: right;
      word-break: break-all;
    }

    &--full {
      margin-top: 10px;
    }
  }

  &__metrics {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
  }

  &__metric {
    text-align: center;
    padding: 12px 6px;
    background: #f8f9fa;
    border-radius: 6px;

    .metric-val {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: #1f2d3d;
      line-height: 1.2;
      margin-bottom: 4px;

      &.orange {
        color: #e6a23c;
      }
      &.green {
        color: #67c23a;
      }
      &.gray {
        color: #909399;
      }
      &.red {
        color: #f56c6c;
      }
    }

    .metric-label {
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>

<style>
.station-page .station-content-split {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
  background: transparent !important;
}

.station-search-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.25rem 1.25rem;
}

.station-page .station-list-search {
  display: block;
  margin-bottom: 0;
}

.station-page .station-list-search__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 16px;
}

.station-page .station-list-search__row .station-list-search__item {
  margin-right: 0;
  margin-bottom: 0;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.station-page .station-list-search__row .ems-list-search__actions {
  margin-left: 8px;
}

.station-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.station-page .ems-list-search__control {
  width: 11rem;
}

.station-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.station-content-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
}

.station-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.station-content-card .table-shell {
  background: transparent;
}

.station-content-card .table-shell__wrap--plain {
  border: none;
  border-radius: 0;
  overflow: visible;
}

.station-page .ems-list-table .badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.4;
}

.station-page .ems-list-table .badge.green {
  background: #f0f9eb;
  color: #67c23a;
}

.station-page .ems-list-table .badge.gray {
  background: #f4f4f5;
  color: #909399;
}

.station-form-dialog .el-dialog__title,
.station-rate-dialog .el-dialog__title,
.station-detail-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.station-form-dialog .el-dialog__header,
.station-rate-dialog .el-dialog__header,
.station-detail-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.station-form-dialog .el-dialog__body,
.station-rate-dialog .el-dialog__body {
  padding: 20px 24px 8px;
}

.station-detail-dialog .el-dialog__body {
  padding: 20px 24px;
}

.station-form-dialog .el-form-item__label,
.station-rate-dialog .el-form-item__label {
  font-size: 14px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.85);
}

.station-form-dialog .el-input,
.station-form-dialog .el-input-number,
.station-form-dialog .el-textarea,
.station-rate-dialog .el-input,
.station-rate-dialog .el-input-number {
  width: 100%;
}

.station-form-dialog .station-form__control,
.station-rate-dialog .station-form__control {
  width: 100%;
}

.station-rate-dialog .station-rate-hint {
  margin: -4px 0 12px 120px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.4;
}

.station-form-dialog .station-address-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  width: 100%;
}

.station-form-dialog .station-address-row .station-form__control {
  width: 100%;
}

.station-form-dialog .station-form__coord .el-input__inner {
  text-align: left;
}
</style>
