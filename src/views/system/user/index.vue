<template>
  <div class="app-container user-page nco-settings-container">
    <div class="new-style-menu-title">用户管理</div>
    <div class="nco-settings-container-content">
      <div class="user-layout">
        <aside class="nco-station-left-tree">
          <div class="tree-searcher">
            <el-input
              v-model="deptName"
              size="small"
              clearable
              placeholder="请输入部门名称"
            />
            <span class="tree-searcher__icon" aria-hidden="true">
              <svg viewBox="64 64 896 896" width="1em" height="1em" fill="currentColor" focusable="false">
                <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z" />
              </svg>
            </span>
          </div>
          <div class="tree-content-wrapper" v-loading="treeLoading">
            <el-tree
              ref="tree"
              :data="deptOptions"
              :props="defaultProps"
              :expand-on-click-node="false"
              :filter-node-method="filterNode"
              node-key="id"
              default-expand-all
              highlight-current
              empty-text=""
              class="station-tree"
              :class="{ 'is-empty': !deptOptions || !deptOptions.length }"
              @node-click="handleNodeClick"
            >
              <span slot-scope="{ node }" class="station-tree__node">
                <img :src="deptIcon" class="station-tree__node-icon" alt="">
                <span class="station-tree__node-label" :title="node.label">{{ node.label }}</span>
              </span>
            </el-tree>
            <div v-if="!treeLoading && (!deptOptions || !deptOptions.length)" class="station-tree__empty ems-list-table__empty">
              <img :src="tableEmptyIcon" class="ems-list-table__empty-icon" alt="">
              <p class="ems-list-table__empty-text">暂无部门数据</p>
            </div>
          </div>
        </aside>

        <section class="user-main-panel">
          <el-form
            ref="queryForm"
            :model="queryParams"
            size="small"
            :inline="true"
            label-width="90px"
            class="ems-list-search user-list-search"
            @submit.native.prevent
          >
            <div class="user-list-search__primary">
              <el-form-item label="用户名称" prop="userName" class="user-list-search__item">
                <el-input
                  v-model="queryParams.userName"
                  placeholder="请输入用户名称"
                  clearable
                  class="ems-list-search__control"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item label="手机号码" prop="phonenumber" class="user-list-search__item">
                <el-input
                  v-model="queryParams.phonenumber"
                  placeholder="请输入手机号码"
                  clearable
                  class="ems-list-search__control"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
              <el-form-item label="用户状态" prop="status" class="user-list-search__item user-list-search__status--pc">
                <el-select
                  v-model="queryParams.status"
                  placeholder="请输入用户状态"
                  clearable
                  class="ems-list-search__control"
                >
                  <el-option
                    v-for="dict in dict.type.sys_normal_disable"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item class="ems-list-search__actions user-list-search__item">
                <el-button type="text" class="expand-trigger" @click="showAdvanced = !showAdvanced">
                  {{ showAdvanced ? '收起' : '展开' }}
                  <i :class="showAdvanced ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />
                </el-button>
                <el-button type="primary" @click="handleQuery">查询</el-button>
                <el-button @click="resetQuery">重置</el-button>
              </el-form-item>
            </div>
          </el-form>

          <el-form
            v-show="showAdvanced"
            :model="queryParams"
            size="small"
            :inline="true"
            label-width="90px"
            class="ems-list-search ems-list-search--advanced user-list-search__advanced"
            @submit.native.prevent
          >
            <div class="user-list-search__advanced-row">
              <el-form-item label="用户状态" prop="status" class="user-list-search__item user-list-search__status--nb">
                <el-select
                  v-model="queryParams.status"
                  placeholder="请输入用户状态"
                  clearable
                  class="ems-list-search__control"
                >
                  <el-option
                    v-for="dict in dict.type.sys_normal_disable"
                    :key="dict.value"
                    :label="dict.label"
                    :value="dict.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="创建时间" class="user-list-search__item">
                <el-date-picker
                  v-model="dateRange"
                  class="ems-list-search__daterange"
                  value-format="yyyy-MM-dd"
                  type="daterange"
                  range-separator="-"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                />
              </el-form-item>
            </div>
          </el-form>

          <div class="user-divider" role="separator" />

          <div class="user-toolbar">
            <div class="user-toolbar__left" />
            <div class="user-toolbar__right">
              <el-button
                plain
                :disabled="single"
                @click="handleUpdate"
                v-hasPermi="['system:user:edit']"
              >修改</el-button>
              <el-button
                plain
                :disabled="multiple"
                @click="handleDelete"
                v-hasPermi="['system:user:remove']"
              >删除</el-button>
              <el-button
                plain
                @click="handleExport"
                v-hasPermi="['system:user:export']"
              >导出</el-button>
              <el-button
                plain
                @click="handleImport"
                v-hasPermi="['system:user:import']"
              >导入</el-button>
              <el-button
                type="primary"
                @click="handleAdd"
                v-hasPermi="['system:user:add']"
              >新增</el-button>
            </div>
          </div>

          <div class="table-shell">
            <div class="table-shell__wrap">
              <el-table
                v-loading="loading"
                :data="userList"
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
                <el-table-column label="序号" align="center" width="80">
                  <template slot-scope="scope">
                    <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + (scope.$index + 1) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="用户编号" align="center" key="userId" prop="userId" v-if="false" />
                <el-table-column label="用户名称" align="center" key="userName" prop="userName" min-width="120" :show-overflow-tooltip="true" />
                <el-table-column label="用户昵称" align="center" key="nickName" prop="nickName" min-width="120" :show-overflow-tooltip="true" />
                <el-table-column label="部门" align="center" key="deptName" prop="dept.deptName" min-width="120" :show-overflow-tooltip="true" />
                <el-table-column label="手机号码" align="center" key="phonenumber" prop="phonenumber" width="120" />
                <el-table-column label="状态" align="center" key="status" width="100">
                  <template slot-scope="scope">
                    <el-switch
                      v-model="scope.row.status"
                      active-value="0"
                      inactive-value="1"
                      @change="handleStatusChange(scope.row)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="创建时间" align="center" prop="createTime" width="160">
                  <template slot-scope="scope">
                    <span>{{ parseTime(scope.row.createTime) }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  label="操作"
                  align="center"
                  width="160"
                  fixed="right"
                  class-name="small-padding fixed-width ems-list-table__ops"
                >
                  <template slot-scope="scope" v-if="scope.row.userId !== 1 && scope.row.userType != '00'">
                    <el-tooltip content="修改" placement="top" effect="light" popper-class="ems-list-tooltip">
                      <el-button
                        type="text"
                        icon="el-icon-edit"
                        class="ems-list-table__ops-btn"
                        @click="handleUpdate(scope.row)"
                        v-hasPermi="['system:user:edit']"
                      />
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top" effect="light" popper-class="ems-list-tooltip">
                      <el-button
                        type="text"
                        icon="el-icon-delete"
                        class="ems-list-table__ops-btn"
                        @click="handleDelete(scope.row)"
                        v-hasPermi="['system:user:remove']"
                      />
                    </el-tooltip>
                    <el-tooltip content="重置密码" placement="top" effect="light" popper-class="ems-list-tooltip">
                      <el-button
                        type="text"
                        icon="el-icon-key"
                        class="ems-list-table__ops-btn"
                        @click="handleResetPwd(scope.row)"
                        v-hasPermi="['system:user:resetPwd']"
                      />
                    </el-tooltip>
                    <el-tooltip content="分配角色" placement="top" effect="light" popper-class="ems-list-tooltip">
                      <el-button
                        type="text"
                        icon="el-icon-circle-check"
                        class="ems-list-table__ops-btn"
                        @click="handleAuthRole(scope.row)"
                        v-hasPermi="['system:user:edit']"
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
        </section>
      </div>
    </div>

    <!-- 添加或修改用户配置对话框 -->
    <el-dialog
      :title="title"
      :visible.sync="open"
      width="600px"
      append-to-body
      custom-class="user-form-dialog"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="form.nickName" placeholder="请输入用户昵称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归属部门" prop="deptId">
              <treeselect v-model="form.deptId" :options="deptOptions" :show-count="true" placeholder="请选择归属部门" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="form.phonenumber" placeholder="请输入手机号码" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户名称" prop="userName">
              <el-input v-model="form.userName" placeholder="请输入用户名称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="form.userId == undefined" label="用户密码" prop="password">
              <el-input v-model="form.password" placeholder="请输入用户密码" type="password" maxlength="20" show-password />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户性别">
              <el-select v-model="form.sex" placeholder="请选择性别">
                <el-option
                  v-for="dict in dict.type.sys_user_sex"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in dict.type.sys_normal_disable"
                  :key="dict.value"
                  :label="dict.value"
                >{{ dict.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="是否场站方">
              <el-radio-group v-model="form.isStation">
                <el-radio :label="0">否</el-radio>
                <el-radio :label="1">是</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="岗位">
              <el-select v-model="form.postIds" multiple placeholder="请选择岗位">
                <el-option
                  v-for="item in postOptions"
                  :key="item.postId"
                  :label="item.postName"
                  :value="item.postId"
                  :disabled="item.status == 1"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色">
              <el-select v-model="form.roleIds" multiple placeholder="请选择角色">
                <el-option
                  v-for="item in roleOptions"
                  :key="item.roleId"
                  :label="item.roleName"
                  :value="item.roleId"
                  :disabled="item.status == 1"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      title="重置密码"
      :visible.sync="resetPwdOpen"
      width="400px"
      append-to-body
      custom-class="user-reset-pwd-dialog"
    >
      <el-form ref="resetPwdForm" :model="resetPwdForm" :rules="resetPwdRules" label-width="80px">
        <el-form-item label="用户名称">
          <el-input :value="resetPwdForm.userName" disabled />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="resetPwdForm.password"
            placeholder="请输入新密码"
            type="password"
            maxlength="20"
            show-password
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancelResetPwd">取 消</el-button>
        <el-button type="primary" @click="submitResetPwd">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 用户导入对话框 -->
    <el-dialog
      :title="upload.title"
      :visible.sync="upload.open"
      width="400px"
      append-to-body
      custom-class="user-import-dialog"
    >
      <el-upload
        ref="upload"
        :limit="1"
        accept=".xlsx, .xls"
        :headers="upload.headers"
        :action="upload.url + '?updateSupport=' + upload.updateSupport"
        :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :auto-upload="false"
        drag
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip text-center" slot="tip">
          <div class="el-upload__tip" slot="tip">
            <el-checkbox v-model="upload.updateSupport" /> 是否更新已经存在的用户数据
          </div>
          <span>仅允许导入xls、xlsx格式文件。</span>
          <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importTemplate">下载模板</el-link>
        </div>
      </el-upload>
      <div slot="footer" class="dialog-footer">
        <el-button @click="upload.open = false">取 消</el-button>
        <el-button type="primary" @click="submitFileForm">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listUser, getUser, delUser, addUser, updateUser, resetUserPwd, changeUserStatus, deptTreeSelect } from "@/api/system/user";
import { getToken } from "@/utils/auth";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import { parseTime } from "@/utils/witos";
import tableEmptyIcon from "@/assets/images/empty.svg";
import deptIcon from "@/assets/images/company.png";

export default {
  name: "User",
  dicts: ['sys_normal_disable', 'sys_user_sex'],
  components: { Treeselect },
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showAdvanced: false,
      total: 0,
      userList: [],
      title: "",
      deptOptions: [],
      treeLoading: true,
      open: false,
      deptName: undefined,
      initPassword: undefined,
      dateRange: [],
      postOptions: [],
      roleOptions: [],
      form: {},
      tableEmptyIcon,
      deptIcon,
      defaultProps: {
        children: "children",
        label: "label"
      },
      upload: {
        open: false,
        title: "",
        isUploading: false,
        updateSupport: 0,
        headers: { Authorization: "Bearer " + getToken() },
        url: process.env.VUE_APP_BASE_API + "/system/user/importData"
      },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userName: undefined,
        phonenumber: undefined,
        status: undefined,
        deptId: undefined
      },
      resetPwdOpen: false,
      resetPwdForm: {
        userId: undefined,
        userName: undefined,
        password: undefined
      },
      resetPwdRules: {
        password: [
          { required: true, message: "用户密码不能为空", trigger: "blur" },
          { min: 5, max: 20, message: "用户密码长度必须介于 5 和 20 之间", trigger: "blur" },
          { pattern: /^[^<>"'|\\]+$/, message: "不能包含非法字符：< > \" ' \\\ |", trigger: "blur" }
        ]
      },
      rules: {
        userName: [
          { required: true, message: "用户名称不能为空", trigger: "blur" },
          { min: 2, max: 20, message: '用户名称长度必须介于 2 和 20 之间', trigger: 'blur' }
        ],
        nickName: [
          { required: true, message: "用户昵称不能为空", trigger: "blur" }
        ],
        password: [
          { required: true, message: "用户密码不能为空", trigger: "blur" },
          { min: 5, max: 20, message: '用户密码长度必须介于 5 和 20 之间', trigger: 'blur' },
          { pattern: /^[^<>"'|\\]+$/, message: "不能包含非法字符：< > \" ' \\\ |", trigger: "blur" }
        ],
        email: [
          {
            type: "email",
            message: "请输入正确的邮箱地址",
            trigger: ["blur", "change"]
          }
        ],
        phonenumber: [
          {
            pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
            message: "请输入正确的手机号码",
            trigger: "blur"
          }
        ]
      }
    };
  },
  watch: {
    deptName(val) {
      this.$refs.tree.filter(val);
    }
  },
  created() {
    this.getList();
    this.getDeptTree();
    this.getConfigKey("sys.user.initPassword").then(response => {
      this.initPassword = response.msg;
    });
  },
  methods: {
    /** 查询用户列表 */
    getList() {
      this.loading = true;
      listUser(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.userList = response.data || [];
        this.total = response.total;
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    /** 查询部门下拉树结构 */
    getDeptTree() {
      this.treeLoading = true;
      deptTreeSelect().then(response => {
        this.deptOptions = response.data || [];
        this.treeLoading = false;
      }).catch(() => {
        this.deptOptions = [];
        this.treeLoading = false;
      });
    },
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1;
    },
    handleNodeClick(data) {
      this.queryParams.deptId = data.id;
      this.handleQuery();
    },
    handleStatusChange(row) {
      let text = row.status === "0" ? "启用" : "停用";
      this.$modal.confirm('确认要"' + text + '""' + row.userName + '"用户吗？').then(function() {
        return changeUserStatus(row.userId, row.status);
      }).then(() => {
        this.$modal.msgSuccess(text + "成功");
      }).catch(function() {
        row.status = row.status === "0" ? "1" : "0";
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        userId: undefined,
        deptId: undefined,
        userName: undefined,
        nickName: undefined,
        password: undefined,
        phonenumber: undefined,
        email: undefined,
        sex: undefined,
        status: "0",
        remark: undefined,
        isStation: 0,
        postIds: [],
        roleIds: []
      };
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.queryParams.deptId = undefined;
      this.$refs.tree.setCurrentKey(null);
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.userId);
      this.single = selection.length != 1;
      this.multiple = !selection.length;
    },
    handleAdd() {
      this.reset();
      getUser().then(response => {
        this.postOptions = response.posts;
        this.roleOptions = response.roles;
        this.open = true;
        this.title = "添加用户";
        this.form.password = this.initPassword;
      });
    },
    handleUpdate(row) {
      this.reset();
      const userId = row.userId || this.ids;
      getUser(userId).then(response => {
        this.form = response.data;
        this.postOptions = response.posts;
        this.roleOptions = response.roles;
        this.$set(this.form, "postIds", response.postIds);
        this.$set(this.form, "roleIds", response.roleIds);
        this.open = true;
        this.title = "修改用户";
        this.form.password = "";
      });
    },
    handleResetPwd(row) {
      this.resetPwdForm = {
        userId: row.userId,
        userName: row.userName,
        password: undefined
      };
      this.resetPwdOpen = true;
      this.$nextTick(() => {
        this.resetForm("resetPwdForm");
      });
    },
    cancelResetPwd() {
      this.resetPwdOpen = false;
      this.resetPwdForm = {
        userId: undefined,
        userName: undefined,
        password: undefined
      };
      this.resetForm("resetPwdForm");
    },
    submitResetPwd() {
      this.$refs["resetPwdForm"].validate(valid => {
        if (!valid) return;
        resetUserPwd(this.resetPwdForm.userId, this.resetPwdForm.password).then(() => {
          this.$modal.msgSuccess("修改成功，新密码是：" + this.resetPwdForm.password);
          this.cancelResetPwd();
        });
      });
    },
    handleAuthRole(row) {
      const userId = row.userId;
      this.$router.push("/system/user-auth/role/" + userId);
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.userId != undefined) {
            updateUser(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addUser(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleDelete(row) {
      const userIds = row.userId || this.ids;
      this.$modal.confirm('是否确认删除当前用户数据项？').then(function() {
        return delUser(userIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleExport() {
      this.download('system/user/export', {
        ...this.queryParams
      }, `用户管理_${parseTime(new Date().getTime(), '{y}-{m}-{d}') }.xlsx`)
    },
    handleImport() {
      this.upload.title = "用户导入";
      this.upload.open = true;
    },
    importTemplate() {
      this.download('system/user/importTemplate', {
      }, `user_template_${new Date().getTime()}.xlsx`)
    },
    handleFileUploadProgress() {
      this.upload.isUploading = true;
    },
    handleFileSuccess(response) {
      this.upload.open = false;
      this.upload.isUploading = false;
      this.$refs.upload.clearFiles();
      this.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
      this.getList();
    },
    submitFileForm() {
      this.$refs.upload.submit();
    }
  }
};
</script>

<style scoped>
.user-page.nco-settings-container {
  height: calc(100vh - 4rem);
  min-height: calc(100vh - 4rem);
}

.user-page .nco-settings-container-content {
  flex: 1 1 auto;
  min-height: 0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.user-layout {
  position: relative;
  display: flex;
  align-items: stretch;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  width: 100%;
  background: #fff;
}

.user-layout::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 17.5rem;
  z-index: 1;
  width: 1px;
  background: #e8e8e8;
  transform: scaleX(0.5);
  transform-origin: center;
  pointer-events: none;
}

.nco-station-left-tree {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 0 0 17.5rem;
  width: 17.5rem;
  min-width: 17.5rem;
  max-width: 17.5rem;
  align-self: stretch;
  min-height: 0;
  margin-right: 1.25rem;
  padding: 0 0.5rem 0 0;
  border: 0;
  background: #fff;
}

.nco-station-left-tree .tree-searcher {
  position: relative;
  width: 100%;
  margin: 0;
  box-sizing: border-box;
}

.nco-station-left-tree .tree-searcher ::v-deep .el-input__inner {
  height: 2rem;
  line-height: 2rem;
  padding-right: 2rem;
  border: 0;
  border-radius: 0.25rem;
  background: rgb(243, 243, 243);
  box-shadow: none;
  color: rgba(0, 0, 0, 0.85);
}

.nco-station-left-tree .tree-searcher ::v-deep .el-input__inner::placeholder {
  color: rgba(0, 0, 0, 0.45);
}

.nco-station-left-tree .tree-searcher ::v-deep .el-input__inner::-webkit-input-placeholder {
  color: rgba(0, 0, 0, 0.45);
}

.nco-station-left-tree .tree-searcher ::v-deep .el-input__inner::-moz-placeholder {
  color: rgba(0, 0, 0, 0.45);
}

.nco-station-left-tree .tree-searcher ::v-deep .el-input__inner:hover,
.nco-station-left-tree .tree-searcher ::v-deep .el-input__inner:focus {
  background: rgb(243, 243, 243);
}

.nco-station-left-tree .tree-searcher ::v-deep .el-input__suffix {
  right: 1.75rem;
}

.nco-station-left-tree .tree-searcher__icon {
  position: absolute;
  top: 50%;
  right: 0.5rem;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  margin-top: -0.5rem;
  color: rgba(0, 0, 0, 0.85);
  pointer-events: none;
}

.nco-station-left-tree .tree-searcher__icon svg {
  display: block;
  width: 1rem;
  height: 1rem;
}

.nco-station-left-tree .tree-content-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 0.5rem 0 0;
  overflow: auto;
}

.nco-station-left-tree .station-tree {
  background: #fff;
}

.nco-station-left-tree .station-tree.is-empty ::v-deep .el-tree__empty-block {
  display: none;
}

.nco-station-left-tree .station-tree__empty {
  padding-top: 2.5rem;
}

.nco-station-left-tree .station-tree ::v-deep .el-tree-node__content {
  height: 2rem;
  color: rgba(0, 0, 0, 0.85);
}

.nco-station-left-tree .station-tree ::v-deep .el-tree-node__expand-icon {
  color: rgba(0, 0, 0, 0.85);
  font-size: 12px;
}

.nco-station-left-tree .station-tree ::v-deep .el-tree-node__expand-icon.is-leaf {
  color: transparent !important;
  cursor: default;
}

.nco-station-left-tree .station-tree ::v-deep .el-tree-node__content:hover {
  background: #f5f5f5;
}

.nco-station-left-tree .station-tree ::v-deep .el-tree-node.is-current > .el-tree-node__content {
  background: #0a59f7;
  color: #fff;
}

.nco-station-left-tree .station-tree ::v-deep .el-tree-node.is-current > .el-tree-node__content .el-tree-node__expand-icon:not(.is-leaf) {
  color: #fff;
}

.nco-station-left-tree .station-tree ::v-deep .el-tree-node.is-current > .el-tree-node__content .station-tree__node-icon {
  filter: brightness(0) invert(1);
}

.station-tree__node {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  overflow: hidden;
}

.station-tree__node-icon {
  width: 1rem;
  height: 1rem;
  margin-right: 0.35rem;
  flex-shrink: 0;
  object-fit: contain;
}

.station-tree__node-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-main-panel {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: #fff;
  overflow: hidden;
}

.user-main-panel ::v-deep .el-table__empty-block {
  position: sticky;
  left: 0;
  z-index: 1;
  width: 100% !important;
  max-width: 100%;
  height: auto !important;
  min-height: 160px;
  box-sizing: border-box;
}

.user-main-panel ::v-deep .el-table__body-wrapper {
  height: auto !important;
}

.user-main-panel .ems-list-search .el-form-item {
  margin-bottom: 0;
}

.user-main-panel .user-list-search {
  margin-bottom: 0;
}

.user-main-panel .user-list-search__primary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.user-main-panel .user-list-search__item {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
}

.user-main-panel .ems-list-search--advanced {
  margin-top: 12px;
}

.user-main-panel .ems-list-search--advanced .el-form-item {
  margin-bottom: 0;
}

.user-main-panel .ems-list-search__control {
  width: 11rem;
}

.user-main-panel .ems-list-search__daterange {
  width: calc(11rem * 2 + 90px + 16px);
}

.user-main-panel .expand-trigger {
  padding-left: 4px;
  padding-right: 4px;
  color: #0a59f7;
  font-size: 14px;
}

.user-main-panel .expand-trigger:hover,
.user-main-panel .expand-trigger:focus {
  color: #0747c7;
}

.user-main-panel .ems-list-search__actions .el-button + .el-button {
  margin-left: 8px;
}

/* PC：用户状态在第一行；展开区里的笔记本状态隐藏 */
.user-main-panel .user-list-search__status--pc {
  display: inline-flex;
}

.user-main-panel .user-list-search__status--nb {
  display: none;
}

.user-main-panel .user-list-search__advanced-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0 16px;
}

.user-main-panel .user-list-search__advanced-row .user-list-search__item {
  margin-right: 0;
}

/* 笔记本：展开后创建时间与用户状态同一行，缩小日期宽度 */
@media (max-width: 1599px) {
  .user-main-panel .user-list-search__status--pc {
    display: none;
  }

  .user-main-panel .user-list-search__status--nb {
    display: inline-flex;
  }

  .user-main-panel .ems-list-search__daterange {
    width: 16rem;
  }
}

.user-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 32px 0 16px;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.user-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  gap: 1rem;
  min-width: 0;
}

.user-toolbar__left {
  min-width: 0;
  flex: 1 1 auto;
}

.user-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}

.user-toolbar__right .el-button + .el-button {
  margin-left: 1rem;
}

.user-toolbar__right .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}

.user-toolbar__right .el-button--primary:hover,
.user-toolbar__right .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
}

@media (max-width: 1280px) {
  .user-layout {
    flex-direction: column;
  }

  .user-layout::before {
    display: none;
  }

  .nco-station-left-tree {
    flex: none;
    width: 100%;
    min-width: 0;
    max-width: none;
    min-height: auto;
    margin-right: 0;
    margin-bottom: 1rem;
    padding-right: 0;
    border-bottom: 1px solid #d1d1d1;
  }

  .nco-station-left-tree .tree-content-wrapper {
    max-height: 16rem;
  }

  .user-toolbar {
    flex-wrap: wrap;
  }
}
</style>

<style>
.user-form-dialog .el-dialog__title,
.user-reset-pwd-dialog .el-dialog__title,
.user-import-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.user-form-dialog .el-dialog__header,
.user-reset-pwd-dialog .el-dialog__header,
.user-import-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.user-form-dialog .el-form-item__label,
.user-reset-pwd-dialog .el-form-item__label,
.user-import-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}
</style>
