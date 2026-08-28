<template>
  <div class="app-container platform-user-page nco-settings-container">
    <div class="new-style-menu-title">平台用户管理</div>
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
        <el-form-item label="用户名称" prop="userName">
          <el-input
            v-model="queryParams.userName"
            placeholder="请输入用户名称"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="手机号码" prop="userPhone">
          <el-input
            v-model="queryParams.userPhone"
            placeholder="请输入手机号码"
            clearable
            class="ems-list-search__control"
            @keyup.enter.native="handleQuery"
          />
        </el-form-item>
        <el-form-item label="用户状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择用户状态"
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
        <el-form-item class="ems-list-search__actions">
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="pu-divider" role="separator" />

      <div class="pu-toolbar">
        <div class="pu-toolbar__left" />
        <div class="pu-toolbar__right">
          <el-button plain :disabled="single" @click="handleUpdate" v-hasPermi="['system:user:edit']">修改</el-button>
          <el-button plain :disabled="multiple" @click="handleDelete" v-hasPermi="['system:user:remove']">删除</el-button>
          <el-button type="primary" @click="handleAdd" v-hasPermi="['system:user:add']">新增</el-button>
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
            <el-table-column label="序号" align="center" width="60">
              <template slot-scope="scope">
                {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="用户名称" align="center" prop="userName" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="用户昵称" align="center" prop="nickName" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="手机号码" align="center" prop="userPhone" width="120" />
            <el-table-column label="平台套餐" align="center" min-width="140">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.packageId" size="small">{{ getPackageName(scope.row.packageId) }}</el-tag>
                <span v-else style="color:#999">未分配</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" align="center" prop="status" width="100">
              <template slot-scope="scope">
                <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status" />
              </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
            <el-table-column label="操作" align="center" width="180" fixed="right" class-name="small-padding fixed-width ems-list-table__ops">
              <template slot-scope="scope">
                <el-tooltip content="修改" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button type="text" icon="el-icon-edit" class="ems-list-table__ops-btn" @click="handleUpdate(scope.row)" v-hasPermi="['system:user:edit']" />
                </el-tooltip>
                <el-tooltip content="删除" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button type="text" icon="el-icon-delete" class="ems-list-table__ops-btn" @click="handleDelete(scope.row)" v-hasPermi="['system:user:remove']" />
                </el-tooltip>
                <el-tooltip content="重置密码" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button type="text" icon="el-icon-key" class="ems-list-table__ops-btn" @click="handleResetPwd(scope.row)" v-hasPermi="['system:user:resetPwd']" />
                </el-tooltip>
                <el-tooltip content="菜单权限" placement="top" effect="light" popper-class="ems-list-tooltip">
                  <el-button type="text" icon="el-icon-setting" class="ems-list-table__ops-btn" @click="handleMenuAuth(scope.row)" v-hasPermi="['system:user:edit']" />
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

    <!-- 添加或修改用户对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body custom-class="pu-form-dialog">
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="用户名称" prop="userName">
              <el-input v-model="form.userName" placeholder="请输入用户名称" :disabled="!!form.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户昵称" prop="nickName">
              <el-input v-model="form.nickName" placeholder="请输入用户昵称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="手机号码" prop="userPhone">
              <el-input v-model="form.userPhone" placeholder="请输入手机号码" maxlength="11" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户状态" prop="status">
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
        <el-row v-if="!form.id">
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" placeholder="请输入密码" type="password" show-password />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="平台套餐">
              <el-select v-model="form.packageId" placeholder="请选择平台套餐" clearable style="width: 100%">
                <el-option v-for="item in packageList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
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

    <!-- 菜单权限对话框 -->
    <el-dialog :title="'菜单权限 - ' + menuAuthForm.userName" :visible.sync="menuOpen" width="500px" append-to-body custom-class="pu-form-dialog">
      <el-form label-width="100px">
        <el-form-item label="菜单权限">
          <el-tree
            ref="menuTree"
            :data="menuOptions"
            show-checkbox
            node-key="id"
            empty-text="加载中..."
            :props="{ children: 'children', label: 'label' }"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="menuOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitMenuAuth">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listPlatform, getPlatform, addPlatform, updatePlatform, delPlatform, resetPlatformPwd } from "@/api/system/platform"
import { getPlatformPackageSimpleList } from "@/api/system/platformpackage"
import { userMenuTreeselect, updateUserAuthMenu } from "@/api/system/user"
import tableEmptyIcon from "@/assets/images/empty.svg"

export default {
  name: "PlatformUser",
  dicts: ['sys_normal_disable'],
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      total: 0,
      userList: [],
      title: "",
      open: false,
      menuOpen: false,
      menuOptions: [],
      menuAuthForm: {},
      packageList: [],
      tableEmptyIcon,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userName: null,
        userPhone: null,
        status: null
      },
      form: {},
      rules: {
        userName: [
          { required: true, message: "用户名称不能为空", trigger: "blur" }
        ],
        nickName: [
          { required: true, message: "用户昵称不能为空", trigger: "blur" }
        ],
        password: [
          { required: true, message: "密码不能为空", trigger: "blur" },
          { min: 5, max: 20, message: "用户密码长度必须介于 5 和 20 之间", trigger: "blur" }
        ],
        phonenumber: [
          {
            pattern: /^((0\d{2,3}-\d{7,8})|(1[34578]\d{9}))$/,
            message: "请输入正确的手机号码",
            trigger: "blur"
          }
        ]
      }
    }
  },
  created() {
    this.getList()
    this.getPackageList()
  },
  methods: {
    getList() {
      this.loading = true
      listPlatform(this.queryParams).then(response => {
        this.userList = response.data || []
        this.total = response.total || 0
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },
    getPackageList() {
      getPlatformPackageSimpleList().then(response => {
        this.packageList = response.data || []
      })
    },
    getPackageName(packageId) {
      let name = ''
      for (const item of this.packageList) {
        if (item.id === parseInt(packageId)) {
          name = item.name
        }
      }
      return name
    },
    reset() {
      this.form = {
        id: null,
        userId: null,
        userName: null,
        nickName: null,
        password: null,
        userPhone: null,
        status: "0",
        packageId: null,
        remark: null
      }
      this.resetForm("form")
    },
    cancel() {
      this.open = false
      this.reset()
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm("queryForm")
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    handleAdd() {
      this.reset()
      this.getPackageList()
      this.open = true
      this.title = "新增平台用户"
    },
    handleUpdate(row) {
      this.reset()
      this.getPackageList()
      const id = row.id || this.ids[0]
      getPlatform(id).then(response => {
        this.form = response.data
        this.open = true
        this.title = "修改平台用户"
      })
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updatePlatform(this.form).then(() => {
              this.$modal.msgSuccess("修改成功")
              this.open = false
              this.getList()
            })
          } else {
            addPlatform(this.form).then(() => {
              this.$modal.msgSuccess("新增成功")
              this.open = false
              this.getList()
            })
          }
        }
      })
    },
    handleDelete(row) {
      const ids = row.id || this.ids
      this.$modal.confirm('是否确认删除当前用户？').then(function() {
        return delPlatform(ids)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess("删除成功")
      }).catch(() => {})
    },
    handleResetPwd(row) {
      this.$prompt('请输入"' + row.userName + '"的新密码', "重置密码", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /^.{5,20}$/,
        inputErrorMessage: "用户密码长度必须介于 5 和 20 之间"
      }).then(({ value }) => {
        resetPlatformPwd({ userId: row.userId, password: value }).then(() => {
          this.$modal.msgSuccess("修改成功")
        })
      }).catch(() => {})
    },
    /** 菜单权限 */
    handleMenuAuth(row) {
      this.menuAuthForm = { userId: row.userId, userName: row.userName }
      userMenuTreeselect(row.userId).then(response => {
        this.menuOptions = response.data.menus || []
        const checkedKeys = response.data.checkedKeys || []
        this.menuOpen = true
        this.$nextTick(() => {
          this.$refs.menuTree.setCheckedKeys(checkedKeys)
        })
      })
    },
    submitMenuAuth() {
      const menuIds = this.$refs.menuTree.getCheckedKeys()
      const halfCheckedKeys = this.$refs.menuTree.getHalfCheckedKeys()
      const allIds = [...menuIds, ...halfCheckedKeys]
      updateUserAuthMenu({ userId: this.menuAuthForm.userId, menuIds: allIds }).then(() => {
        this.$modal.msgSuccess("菜单权限配置成功")
        this.menuOpen = false
      })
    }
  }
}
</script>

<style scoped>
.platform-user-page .ems-list-search .el-form-item {
  margin-bottom: 0;
}
.platform-user-page .ems-list-search__control {
  width: 11rem;
}
.pu-divider {
  display: block;
  clear: both;
  width: 100%;
  height: 0;
  margin: 16px 0;
  border: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.pu-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.pu-toolbar__left { flex: 1 1 auto; }
.pu-toolbar__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
}
.pu-toolbar__right .el-button + .el-button { margin-left: 1rem; }
.pu-toolbar__right .el-button--primary {
  background-color: #0a59f7;
  border-color: #0a59f7;
}
.pu-toolbar__right .el-button--primary:hover,
.pu-toolbar__right .el-button--primary:focus {
  background-color: #0747c7;
  border-color: #0747c7;
}
</style>

<style>
.pu-form-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}
.pu-form-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}
.pu-form-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}
</style>
