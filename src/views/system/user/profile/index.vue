<template>
  <div class="profile-page">
    <div class="account-center pb-20 m-auto">
      <!-- 基本信息 / 个人信息 -->
      <div class="account-basicInfo-wrap pt-6 pb-4">
        <div class="account-section-header">
          <div class="account-section-header__icon">
            <img :src="basicInfoIcon" alt="">
          </div>
          <div>
            <div class="account-item-title">基本信息</div>
            <div class="account-item-description mt-2">在此管理您可以用于登录的帐号信息</div>
          </div>
        </div>
        <div class="account-section-body mt-4">
          <div class="item-wrap">
            <div class="basicInfo-item-wrap">
              <div class="basicInfo-item-label">头像</div>
              <div class="basicInfo-item-main">
                <userAvatar />
              </div>
            </div>
          </div>
          <div class="item-wrap">
            <div class="basicInfo-item-wrap">
              <div class="basicInfo-item-label">用户名称</div>
              <div class="basicInfo-item-value">{{ user.userName || '-' }}</div>
            </div>
          </div>
          <div class="item-wrap">
            <div class="basicInfo-item-wrap">
              <div class="basicInfo-item-label">手机号码</div>
              <div class="basicInfo-item-main">
                <div class="basicInfo-item-value">{{ displayPhone }}</div>
                <div class="account-info-auxiliary-text">作为验证方式，用于您登录、找回密码等</div>
              </div>
            </div>
          </div>
          <div class="item-wrap">
            <div class="basicInfo-item-wrap">
              <div class="basicInfo-item-label">用户邮箱</div>
              <div class="basicInfo-item-main">
                <div class="basicInfo-item-value">{{ user.email || '-' }}</div>
                <div class="account-info-auxiliary-text">作为联系方式，用于业务沟通</div>
              </div>
            </div>
          </div>
          <div class="item-wrap">
            <div class="basicInfo-item-wrap">
              <div class="basicInfo-item-label">所属部门</div>
              <div class="basicInfo-item-value">{{ deptDisplay }}</div>
            </div>
          </div>
          <div class="item-wrap">
            <div class="basicInfo-item-wrap">
              <div class="basicInfo-item-label">所属角色</div>
              <div class="basicInfo-item-value">{{ roleGroup || '-' }}</div>
            </div>
          </div>
          <div class="item-wrap">
            <div class="basicInfo-item-wrap">
              <div class="basicInfo-item-label">创建日期</div>
              <div class="basicInfo-item-value">{{ user.createTime || '-' }}</div>
            </div>
          </div>
          <div class="item-wrap item-wrap--last">
            <div class="basicInfo-item-wrap basicInfo-item-wrap--action">
              <div class="basicInfo-item-left">
                <div class="basicInfo-item-label">基本资料</div>
                <div class="basicInfo-item-value">{{ profileSummary }}</div>
              </div>
              <div class="basicInfo-item-handle" @click="openProfileDialog">修改</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 安全设置 -->
      <div class="account-basicInfo-wrap mt-4 pt-6 pb-4">
        <div class="account-section-header">
          <div class="account-section-header__icon">
            <img :src="securitySettingIcon" alt="">
          </div>
          <div>
            <div class="account-item-title">安全设置</div>
            <div class="account-item-description mt-2">有助于确保您帐号安全设置的设置和建议</div>
          </div>
        </div>
        <div class="account-section-body mt-4">
          <div class="item-wrap item-wrap--last">
            <div class="basicInfo-item-wrap basicInfo-item-wrap--action">
              <div class="basicInfo-item-left">
                <div class="basicInfo-item-label">登录密码</div>
                <div class="basicInfo-item-value">定期修改密码有助于保护帐号安全</div>
              </div>
              <div class="basicInfo-item-handle" @click="openPwdDialog">修改</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      title="基本资料"
      :visible.sync="profileOpen"
      width="520px"
      append-to-body
      custom-class="profile-form-dialog"
      @closed="onProfileDialogClosed"
    >
      <userInfo
        v-if="profileOpen"
        ref="userInfoForm"
        :user="user"
        dialog-mode
        @success="onProfileSuccess"
      />
      <div slot="footer" class="dialog-footer">
        <el-button @click="profileOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitProfile">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="修改密码"
      :visible.sync="pwdOpen"
      width="520px"
      append-to-body
      custom-class="profile-form-dialog"
    >
      <resetPwd
        v-if="pwdOpen"
        ref="resetPwdForm"
        dialog-mode
        @success="onPwdSuccess"
      />
      <div slot="footer" class="dialog-footer">
        <el-button @click="pwdOpen = false">取 消</el-button>
        <el-button type="primary" @click="submitPwd">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import userAvatar from "./userAvatar"
import userInfo from "./userInfo"
import resetPwd from "./resetPwd"
import { getUserProfile } from "@/api/system/user"
import basicInfoIcon from "@/assets/images/basicInfoIcon.svg"
import securitySettingIcon from "@/assets/images/securitySettingIcon.svg"

export default {
  name: "Profile",
  components: { userAvatar, userInfo, resetPwd },
  data() {
    return {
      user: {},
      roleGroup: "",
      postGroup: "",
      basicInfoIcon,
      securitySettingIcon,
      profileOpen: false,
      pwdOpen: false
    }
  },
  computed: {
    displayPhone() {
      const phone = this.user.phonenumber
      if (!phone) {
        return "-"
      }
      if (String(phone).length >= 7) {
        return String(phone).replace(/(\d{3})\d{4}(\d+)/, "$1****$2")
      }
      return phone
    },
    deptDisplay() {
      if (this.user.dept && this.user.dept.deptName) {
        return this.postGroup ? `${this.user.dept.deptName} / ${this.postGroup}` : this.user.dept.deptName
      }
      return this.postGroup || "-"
    },
    profileSummary() {
      const parts = []
      if (this.user.nickName) {
        parts.push(this.user.nickName)
      }
      if (this.user.sex === "0") {
        parts.push("男")
      } else if (this.user.sex === "1") {
        parts.push("女")
      }
      if (this.user.email) {
        parts.push(this.user.email)
      }
      return parts.length ? parts.join(" · ") : "完善昵称、手机、邮箱等信息"
    }
  },
  created() {
    this.getUser()
  },
  methods: {
    getUser() {
      getUserProfile().then(response => {
        this.user = response.data || {}
        this.roleGroup = response.roleGroup || ""
        this.postGroup = response.postGroup || ""
      })
    },
    openProfileDialog() {
      this.profileOpen = true
    },
    openPwdDialog() {
      this.pwdOpen = true
    },
    submitProfile() {
      this.$refs.userInfoForm && this.$refs.userInfoForm.submit()
    },
    submitPwd() {
      this.$refs.resetPwdForm && this.$refs.resetPwdForm.submit()
    },
    onProfileSuccess() {
      this.profileOpen = false
      this.getUser()
    },
    onProfileDialogClosed() {},
    onPwdSuccess() {
      this.pwdOpen = false
    }
  }
}
</script>

<style scoped>
.profile-page {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  margin: 0;
  padding: 56px 16px 0;
  box-sizing: border-box;
  overflow: auto;
  background-color: rgb(245, 245, 245);
}

.account-center {
  max-width: 60rem;
  width: 100%;
}

.pb-20 {
  padding-bottom: 5rem;
}

.m-auto {
  margin-left: auto;
  margin-right: auto;
}

.mt-4 {
  margin-top: 1rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.pt-6 {
  padding-top: 1.5rem;
}

.pb-4 {
  padding-bottom: 1rem;
}

.account-basicInfo-wrap {
  background: #fff;
  border-radius: 8px;
}

.account-section-header {
  display: flex;
  padding-left: 2rem;
  padding-right: 2rem;
  align-items: flex-start;
}

.account-section-header__icon {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.account-section-header__icon img {
  width: 40px;
  height: 40px;
  display: block;
}

.account-item-title {
  font-size: 16px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.9);
  line-height: 1.4;
}

.account-item-description {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.4;
}

.account-section-body {
  width: 100%;
}

.item-wrap {
  padding-left: 2rem;
  padding-right: 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.item-wrap--last {
  border-bottom: none;
}

.basicInfo-item-wrap {
  display: flex;
  align-items: center;
  padding-top: 0.875rem;
  padding-bottom: 0.875rem;
  min-height: 3.25rem;
  box-sizing: border-box;
}

.basicInfo-item-wrap--action {
  justify-content: space-between;
}

.basicInfo-item-left {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.basicInfo-item-label {
  width: 12.5rem;
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.9);
  font-size: 14px;
  line-height: 1.5;
}

.basicInfo-item-value {
  color: rgba(0, 0, 0, 0.9);
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
}

.basicInfo-item-main {
  min-width: 0;
  flex: 1;
}

.account-info-auxiliary-text {
  margin-top: 0.25rem;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  line-height: 1.4;
}

.basicInfo-item-handle {
  width: 5rem;
  flex-shrink: 0;
  text-align: center;
  color: #0a59f7;
  font-size: 14px;
  cursor: pointer;
  user-select: none;
}

.basicInfo-item-handle:hover {
  color: #0747c7;
}

.account-basicInfo-wrap ::v-deep .user-info-head {
  width: 48px;
  height: 48px;
}

.account-basicInfo-wrap ::v-deep .img-circle {
  width: 48px !important;
  height: 48px !important;
  display: block;
}

.account-basicInfo-wrap ::v-deep .user-info-head:hover:after {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: 18px;
  border-radius: 50%;
}
</style>

<style>
.profile-form-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.85);
  line-height: 1.4;
}

.profile-form-dialog .el-dialog__header {
  padding: 16px 24px;
  border-bottom: 1px solid rgb(240, 240, 240);
}

.profile-form-dialog .el-form-item__label {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  font-weight: 400;
}
</style>
