<template>
  <div class="app-container job-info-page nco-settings-container">
    <div class="new-style-menu-title">任务管理</div>
    <div class="nco-settings-container-content">
      <el-form
        ref="queryForm"
        :model="queryParams"
        size="small"
        :inline="true"
        label-width="90px"
        class="ems-list-search"
        @submit.native.prevent
      >
        <el-form-item label="执行器" prop="jobGroup">
          <el-select
            v-model="queryParams.jobGroup"
            placeholder="请选择"
            clearable
            class="ems-list-search__control"
          >
            <el-option
              v-for="item in jobGroupOptions"
              :key="item.id"
              :label="item.title"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="运行状态" prop="triggerStatus">
          <el-select
            v-model="queryParams.triggerStatus"
            placeholder="请选择"
            clearable
            class="ems-list-search__control"
          >
            <el-option
              v-for="item in dict.type.sys_job_trigger_status"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述" prop="jobDesc">
          <el-input
            v-model="queryParams.jobDesc"
            placeholder="请输入任务描述"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item class="ems-list-search__actions">
          <el-button type="text" class="expand-trigger" @click="showAdvanced = !showAdvanced">
            {{ showAdvanced ? '收起' : '展开' }}
            <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
          </el-button>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-form
        v-show="showAdvanced"
        :model="queryParams"
        size="small"
        :inline="true"
        label-width="90px"
        class="ems-list-search ems-list-search--advanced"
        @submit.native.prevent
      >
        <el-form-item label="JobHandler" prop="executorHandler">
          <el-input
            v-model="queryParams.executorHandler"
            placeholder="请输入JobHandler"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="负责人" prop="author">
          <el-input
            v-model="queryParams.author"
            placeholder="请输入负责人"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
      </el-form>

      <div class="job-info-divider" role="separator" />

      <div class="job-info-toolbar">
        <div class="job-info-toolbar__left" />
        <div class="job-info-toolbar__right">
          <el-button
            plain
            :disabled="multiple"
            @click="handleDelete"
            v-hasPermi="['job:info:remove']"
          >删除</el-button>
          <el-button
            type="primary"
            @click="handleAdd"
            v-hasPermi="['job:info:add']"
          >新增</el-button>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-shell__wrap">
          <el-table
            v-loading="loading"
            :data="infoList"
            class="ems-list-table"
            @selection-change="handleSelectionChange"
          >
            <template slot="empty">
              <div class="ems-list-table__empty">
                <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
                <p class="ems-list-table__empty-text">暂无数据</p>
              </div>
            </template>
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column label="任务ID" align="center" prop="jobGroup" />
            <el-table-column label="任务描述" align="center" prop="jobDesc" />
            <el-table-column label="调度类型" align="center">
              <template v-slot:="scope">
                {{ scope.row.scheduleType + '：' + scope.row.scheduleConf }}
              </template>
            </el-table-column>
            <el-table-column label="运行模式" align="center">
              <template v-slot:="scope">
                {{ scope.row.glueType + '：' + scope.row.executorHandler }}
              </template>
            </el-table-column>
            <el-table-column label="负责人" align="center" prop="author" />
            <el-table-column label="状态" align="center" prop="triggerStatus">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_job_trigger_status" :value="scope.row.triggerStatus"/>
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              align="center"
              width="180"
              fixed="right"
              class-name="small-padding fixed-width ems-list-table__ops"
            >
              <template v-slot:="scope">
                <el-tooltip content="执行一次" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-caret-right"
                    class="ems-list-table__ops-btn"
                    @click="executeOnce(scope.row)"
                    v-hasPermi="['job:info:trigger']"
                  />
                </el-tooltip>
                <el-tooltip content="修改" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-edit"
                    class="ems-list-table__ops-btn"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['job:info:edit']"
                  />
                </el-tooltip>
                <el-tooltip
                  v-if="scope.row.triggerStatus === 0"
                  content="开启"
                  placement="top"
                  effect="light"
                  popper-class="ems-list-tooltip"
                >
                  <el-button
                    type="text"
                    icon="el-icon-video-play"
                    class="ems-list-table__ops-btn"
                    @click="start(scope.row)"
                    v-hasPermi="['job:info:start']"
                  />
                </el-tooltip>
                <el-tooltip
                  v-if="scope.row.triggerStatus === 1"
                  content="停止"
                  placement="top"
                  effect="light"
                  popper-class="ems-list-tooltip"
                >
                  <el-button
                    type="text"
                    icon="el-icon-video-pause"
                    class="ems-list-table__ops-btn"
                    @click="stop(scope.row)"
                    v-hasPermi="['job:info:stop']"
                  />
                </el-tooltip>
                <el-tooltip content="复制" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-document-copy"
                    class="ems-list-table__ops-btn"
                    @click="copy(scope.row)"
                    v-hasPermi="['job:info:copy']"
                  />
                </el-tooltip>
                <el-tooltip content="下次执行时间" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button
                    type="text"
                    icon="el-icon-view"
                    class="ems-list-table__ops-btn"
                    @click="viewNextTriggerTime(scope.row)"
                    v-hasPermi="['job:info:nextTriggerTime']"
                  />
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="table-footer">
          <pagination
            v-show="total>0"
            :total="total"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </div>
    </div>

    <!-- 添加或修改任务对话框 -->
    <el-dialog
      :title="title"
      :visible.sync="open"
      width="1000px"
      append-to-body
      custom-class="job-info-form-dialog"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="120px" class="job-info-form">
        <div class="job-info-section-title">基础配置</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="执行器" prop="jobGroup">
              <el-select v-model="form.jobGroup" placeholder="请选择" class="job-info-form__control">
                <el-option
                  v-for="item in jobGroupOptions"
                  :key="item.id"
                  :label="item.title"
                  :value="item.id">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="任务描述" prop="jobDesc">
              <el-input v-model="form.jobDesc" placeholder="请输入任务描述" class="job-info-form__control" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="负责人" prop="author">
              <el-input v-model="form.author" placeholder="请输入负责人姓名" class="job-info-form__control" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报警邮件" prop="alarmEmail">
              <el-input v-model="form.alarmEmail" placeholder="请输入报警邮件地址，多个邮件则逗号分开" class="job-info-form__control" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="job-info-section-title">调度配置</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="调度类型" prop="scheduleType">
              <el-select v-model="form.scheduleType" placeholder="请选择" class="job-info-form__control">
                <el-option
                  v-for="item in dict.type.sys_job_schedule_type"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Cron" prop="scheduleConf" v-if="form.scheduleType === 'CRON'">
              <el-popover v-model="cronPopover" class="job-info-form__control" popper-class="job-info-cron-popper">
                <cron @change="changeCron" @close="cronPopover=false" i18n="cn"></cron>
                <el-input slot="reference" @click="cronPopover=true" v-model="form.scheduleConf" placeholder="请输入定时策略" class="job-info-form__control"></el-input>
              </el-popover>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="job-info-section-title">任务配置</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="运行模式" prop="glueType">
              <el-select v-model="form.glueType" placeholder="请选择" class="job-info-form__control">
                <el-option
                  v-for="item in dict.type.sys_job_glue_type"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="JobHandler" prop="executorHandler">
              <el-input :disabled="form.glueType !== 'BEAN'" v-model="form.executorHandler" placeholder="请输入JobHandler" class="job-info-form__control" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="任务参数">
              <el-input type="textarea" v-model="form.executorParam" :rows="3" class="job-info-form__control" />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="job-info-section-title">高级配置</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="路由策略" prop="executorRouteStrategy">
              <el-select v-model="form.executorRouteStrategy" placeholder="请选择" class="job-info-form__control">
                <el-option
                  v-for="item in dict.type.sys_job_executor_route_strategy"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="子任务ID" prop="childJobId">
              <el-input v-model="form.childJobId" placeholder="请输入子任务ID" class="job-info-form__control" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="调度过期策略" prop="misfireStrategy">
              <el-select v-model="form.misfireStrategy" placeholder="请选择" class="job-info-form__control">
                <el-option
                  v-for="item in dict.type.sys_job_misfire_strategy"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="阻塞处理策略" prop="executorBlockStrategy">
              <el-select v-model="form.executorBlockStrategy" placeholder="请选择" class="job-info-form__control">
                <el-option
                  v-for="item in dict.type.sys_job_executor_block_strategy"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="任务超时时间" prop="executorTimeout">
              <el-input v-model="form.executorTimeout" placeholder="任务超时时间，单位秒，大于零时生效" class="job-info-form__control" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="失败重试次数" prop="executorFailRetryCount">
              <el-input v-model="form.executorFailRetryCount" placeholder="失败重试次数，大于零时生效" class="job-info-form__control" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 执行一次添加参数弹框 -->
    <el-dialog
      :title="executeOnceTitle"
      :visible.sync="executeOnceOpen"
      width="500px"
      append-to-body
      custom-class="job-info-execute-dialog"
    >
      <el-form ref="form" :model="executeOnceForm" :rules="executeOnceRules" label-width="80px">
        <el-form-item label="任务参数" prop="executorParam">
          <el-input v-model="executeOnceForm.executorParam" placeholder="请输入任务参数" />
        </el-form-item>
        <el-form-item label="机器地址" prop="jobDesc">
          <el-input v-model="executeOnceForm.jobDesc" placeholder="请输入本次执行的机器地址，为空则从执行器获取" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="executeOnceCancel">取 消</el-button>
        <el-button type="primary" @click="executeOnceSubmitForm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
  import { listInfo, getInfo, delInfo, addInfo, updateInfo, trigger, viewRegisterNode, start, stop, nextTriggerTime } from "@/api/job/info";
  import { getSelectAll } from "@/api/job/group";
  import { parseTime } from "@/utils/witos";
  import {cron} from 'vue-cron';
  import tableEmptyIcon from "@/assets/images/empty.svg";

  export default {
    name: "Info",
    components: { cron },
    dicts: [
      'sys_job_trigger_status',
      'sys_job_schedule_type',
      'sys_job_glue_type',
      'sys_job_executor_route_strategy',
      'sys_job_misfire_strategy',
      'sys_job_executor_block_strategy'
    ],
    data() {
      return {
        cronPopover:false,
        // 执行器选择
        jobGroupOptions: [],
        // 选中的item
        currItem: {},
        // 执行一次 弹框表单 校验
        executeOnceRules: {
          executorParam: [],
          jobDesc: [],
        },
        // 执行一次 弹框表单
        executeOnceForm: {
          executorParam: null,
          jobDesc: null
        },
        // 执行一次标题
        executeOnceTitle: '执行一次',
        // 是否显示弹出层 执行一次弹框
        executeOnceOpen: false,
        // 遮罩层
        loading: true,
        // 选中数组
        ids: [],
        // 非单个禁用
        single: true,
        // 非多个禁用
        multiple: true,
        // 展开高级搜索
        showAdvanced: false,
        // 总条数
        total: 0,
        // 任务表格数据
        infoList: [],
        // 弹出层标题
        title: "",
        // 是否显示弹出层
        open: false,
        tableEmptyIcon,
        // 查询参数
        queryParams: {
          pageNum: 1,
          pageSize: 10,
                        jobGroup: null,
                        jobDesc: null,
                        addTime: null,
                        author: null,
                        alarmEmail: null,
                        scheduleType: null,
                        scheduleConf: null,
                        misfireStrategy: null,
                        executorRouteStrategy: null,
                        executorHandler: null,
                        executorParam: null,
                        executorBlockStrategy: null,
                        executorTimeout: null,
                        executorFailRetryCount: null,
                        glueType: null,
                        glueSource: null,
                        glueRemark: null,
                        glueUpdatetime: null,
                        childJobid: null,
                        triggerStatus: null,
                        triggerLastTime: null,
                        triggerNextTime: null,
                        tenantId: null
        },
        // 表单参数
        form: {
          jobGroup: null
        },
        // 表单校验
        rules: {
          jobGroup: [
            { required: true, message: "请选择执行器", trigger: "blur" }
          ],
          jobDesc: [
            { required: true, message: "任务描述必填", trigger: "blur" }
          ],
          author: [
            { required: true, message: "负责人必填", trigger: "blur" }
          ],
          alarmEmail: [
            { required: true, message: "报警邮件必填", trigger: "blur" }
          ],
          scheduleType: [
            { required: true, message: "请选择调度类型", trigger: "blur" }
          ],
          scheduleConf: [
            { required: true, message: "调度配置必填", trigger: "blur" }
          ],
          glueType: [
            { required: true, message: "请选择运行模式", trigger: "blur" }
          ],
          executorHandler: [
            { required: true, message: "执行器任务handler必填", trigger: "blur" }
          ],
          executorRouteStrategy: [
            { required: true, message: "请选择路由策略", trigger: "blur" }
          ],
          misfireStrategy: [
            { required: true, message: "请选择调度过期策略", trigger: "blur" }
          ],
          executorBlockStrategy: [
            { required: true, message: "请选择阻塞处理策略", trigger: "blur" }
          ],
          executorTimeout: [
            { required: true, message: "任务超时时间必填", trigger: "blur" }
          ],
          executorFailRetryCount: [
            { required: true, message: "失败重试次数必填", trigger: "blur" }
          ]
        }
      };
    },
    created() {
      this.getList();
      this.initPageDicData();
    },
    methods: {
      changeCron(val){
        this.form.scheduleConf=val
      },
      // 复制
      copy(row) {
        this.reset();
        const id = row.id || this.ids
        getInfo(id).then(response => {
          this.form = response.data;
          this.form.id = null;
          this.open = true;
          this.title = "新增";
        });
      },
      /** 初始化当前页面的一些字典值 */
      initPageDicData() {
        this.jobGroupOptions = [];
        getSelectAll({title: ''}).then(response => {
          this.jobGroupOptions = response.data;
        });
      },
      /** 查看下次执行时间 */
      viewNextTriggerTime(row) {
        nextTriggerTime({
          scheduleType: row.scheduleType,
          scheduleConf: row.scheduleConf
        }).then(response => {
          console.log('查看下次执行时间', response)
          if (response.code === 200) {
            this.$modal.msg('下次执行时间：\n' + response.data)
          } else {
            this.$modal.msgError(response.data)
          }
        })
      },
      /** 停止 */
      stop(row) {
        const id = row.id;
        stop(id).then(response => {
          console.log('停止', response)
          this.$modal.msgSuccess("操作成功");
          this.handleQuery();
        });
      },
      /** 开启 */
      start(row) {
        const id = row.id;
        start(id).then(response => {
          this.$modal.msgSuccess("操作成功");
          console.log('开启', response)
          this.handleQuery();
        });
      },
      /** 注册节点 */
      viewRegisterNode(row) {
        const id = row.id;
        viewRegisterNode(id).then(response => {
          console.log('注册节点', response)
        });
      },
      /** 执行一次 弹框关闭 */
      executeOnceCancel() {
        console.log('弹框关闭')
        this.executeOnceOpen = false;
      },
      /** 执行一次 弹框提交 */
      executeOnceSubmitForm() {
        console.log('弹框提交')
        let params = {
          id: this.currItem.id,
          executorParam: '',
          executorAddress: ''
        }
        trigger(params).then(response => {
          this.$modal.msgSuccess("执行成功");
          this.executeOnceOpen = false;
        })
      },
      /** 执行一次 */
      executeOnce(row) {
        console.log('执行一次', row)
        this.currItem = row;
        this.executeOnceOpen = true;
      },
      /** 查询日志 */
      viewLog(row) {
        console.log('查询日志', row)
        this.$store.dispatch('log')
      },
      /** 查询任务列表 */
      getList() {
        this.loading = true;
        listInfo(this.queryParams).then(response => {
          this.infoList = response.data || [];
          this.total = response.total;
          this.loading = false;
        });
      },
      // 取消按钮
      cancel() {
        this.open = false;
        this.reset();
      },
      // 表单重置
      reset() {
        this.form = {
          id: null,
          jobGroup: null,
          jobDesc: null,
          addTime: null,
          updateTime: null,
          author: null,
          alarmEmail: null,
          scheduleType: null,
          scheduleConf: null,
          misfireStrategy: null,
          executorRouteStrategy: null,
          executorHandler: null,
          executorParam: null,
          executorBlockStrategy: null,
          executorTimeout: null,
          executorFailRetryCount: null,
          glueType: null,
          glueSource: null,
          glueRemark: null,
          glueUpdatetime: null,
          childJobid: null,
          triggerStatus: 0,
          triggerLastTime: null,
          triggerNextTime: null,
          tenantId: null
        };
        this.resetForm("form");
      },
      resetExecuteOnceForm(){
        this.executeOnceForm = {
          jobGroup: null,
          jobDesc: null
        }
        this.resetForm("queryForm");
      },
      /** 搜索按钮操作 */
      handleQuery() {
        this.queryParams.pageNum = 1;
        this.getList();
      },
      /** 重置按钮操作 */
      resetQuery() {
        this.resetForm("queryForm");
        this.handleQuery();
      },
      // 多选框选中数据
      handleSelectionChange(selection) {
        this.ids = selection.map(item => item.id)
        this.single = selection.length!==1
        this.multiple = !selection.length
      },
      /** 新增按钮操作 */
      handleAdd() {
        this.reset();
        this.open = true;
        this.title = "新增";
      },
      /** 修改按钮操作 */
      handleUpdate(row) {
        this.reset();
        const id = row.id || this.ids
        getInfo(id).then(response => {
          this.form = response.data;
          this.open = true;
          this.title = "修改任务";
        });
      },
      /** 提交按钮 */
      submitForm() {
        let that = this;
        that.$refs["form"].validate(valid => {
          if (valid) {
            if (that.form.id != null) {
              updateInfo(this.form).then(response => {
                that.$modal.msgSuccess("修改成功");
                that.open = false;
                that.getList();
              });
            } else {
              addInfo(that.form).then(response => {
                that.$modal.msgSuccess("新增成功");
                that.open = false;
                that.getList();
              });
            }
          }
        });
      },
      /** 删除按钮操作 */
      handleDelete(row) {
        const ids = row.id || this.ids;
        this.$modal.confirm('是否确认删除当前任务数据项？').then(function() {
          return delInfo(ids);
        }).then(() => {
          this.getList();
          this.$modal.msgSuccess("删除成功");
        }).catch(() => {});
      },
      /** 导出按钮操作 */
      handleExport() {
        this.download('job/info/export', {
            ...this.queryParams
        }, `任务_${parseTime(new Date().getTime(), '{y}-{m}-{d}') }.xlsx`)
      }
   }
  };
</script>

<style scoped>
.job-info-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.job-info-page .ems-list-search--advanced {
  margin-top: 12px;
}

.job-info-page .ems-list-search--advanced .el-form-item {
  margin-bottom: 0;
}

.job-info-page .ems-list-search__control {
  width: 11rem;
}

.job-info-page .expand-trigger {
  padding-left: 4px;
  padding-right: 4px;
  color: #0a59f7;
  font-size: 14px;
}

.job-info-page .expand-trigger:hover,
.job-info-page .expand-trigger:focus {
  color: #0747c7;
}

.job-info-page .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

.job-info-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.job-info-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.job-info-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.job-info-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.job-info-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}

.job-info-toolbar__right .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.job-info-toolbar__right .el-button--primary:hover,
.job-info-toolbar__right .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
}
</style>

<style>
.job-info-form-dialog .el-dialog__title,
.job-info-execute-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.job-info-form-dialog .el-dialog__header,
.job-info-execute-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.job-info-form-dialog .el-dialog__body {
  padding: 20px 24px 8px;
}

.job-info-form-dialog .el-form-item__label,
.job-info-execute-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}

.job-info-form-dialog .job-info-section-title {
  display: flex;
  align-items: center;
  margin: 20px 0 16px;
  padding: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.85);
}

.job-info-form-dialog .job-info-section-title:first-child {
  margin-top: 0;
}

.job-info-form-dialog .job-info-section-title::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 14px;
  margin-right: 8px;
  border-radius: 2px;
  background: #0a59f7;
  flex-shrink: 0;
}

.job-info-form-dialog .job-info-form__control,
.job-info-form-dialog .el-select,
.job-info-form-dialog .el-input,
.job-info-form-dialog .el-textarea,
.job-info-form-dialog .el-popover {
  width: 100%;
}

.job-info-form-dialog .el-form-item__content > .el-select,
.job-info-form-dialog .el-form-item__content > .el-input,
.job-info-form-dialog .el-form-item__content > .el-popover {
  display: block;
  width: 100%;
}

.job-info-form-dialog .el-popover__reference-wrapper,
.job-info-form-dialog .el-popover__reference {
  display: block;
  width: 100%;
}

.job-info-form-dialog .el-form-item {
  margin-bottom: 18px;
}

.job-info-execute-dialog .el-input {
  width: 100%;
}
</style>
