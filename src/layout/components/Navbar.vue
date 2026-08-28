<template>
  <div class="navbar">
    <div class="navbar-left">
      <div class="navbar-line"></div>
      <el-tooltip content="首页" effect="dark" placement="bottom">
        <div class="navbar-home" @click="openHome">
          <img :src="homeIcon" class="navbar-home__icon" alt="首页">
        </div>
      </el-tooltip>
    </div>

    <div class="navbar-center"></div>

    <div class="right-menu">
      <template v-if="device!=='mobile'">
        <search id="header-search" class="right-menu-item"/>

        <Witos-git id="Witos-git" class="right-menu-item hover-effect"/>

        <el-tooltip content="个人博客" effect="dark" placement="bottom">
          <Witos-blog id="Witos-blog" class="right-menu-item hover-effect"/>
        </el-tooltip>

        <el-tooltip content="文档地址" effect="dark" placement="bottom">
          <Witos-doc id="Witos-doc" class="right-menu-item hover-effect"/>
        </el-tooltip>
      </template>

      <el-dropdown
        class="avatar-container right-menu-item hover-effect"
        trigger="click"
        placement="bottom-end"
        :popper-options="{ modifiers: { offset: { offset: '0, -10' } } }"
      >
        <div class="user-avatar">{{ avatarLetter }}</div>
        <el-dropdown-menu slot="dropdown" class="ems-user-dropdown">
          <div class="ems-user-dropdown__header">
            <span class="user-avatar user-avatar--lg">{{ avatarLetter }}</span>
            <span class="ems-user-dropdown__name">{{ name }}</span>
          </div>
          <div class="ems-user-dropdown__divider" />
          <router-link to="/user/profile" class="ems-user-dropdown__item">
            账号中心
          </router-link>
          <div class="ems-user-dropdown__divider" />
          <div class="ems-user-dropdown__item" @click="logout">退出登录</div>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import WitosGit from '@/components/Witos/Git'
import WitosDoc from '@/components/Witos/Doc'
import WitosBlog from '@/components/Witos/Blog'
import Search from '@/components/HeaderSearch'
import homeIcon from '@/assets/images/home.svg'

export default {
  components: {
    WitosGit,
    WitosDoc,
    WitosBlog,
    Search
  },
  data() {
    return {
      homeIcon
    }
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'avatar',
      'device',
      'name'
    ]),
    ...mapState({
      needTagsView: state => state.settings.tagsView,
    }),
    avatarLetter() {
      const n = (this.name || '').trim()
      if (!n) {
        return 'U'
      }
      return n.charAt(0).toUpperCase()
    },
    setting: {
      get () {
        return this.$store.state.settings.showSettings
      },
      set (val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'showSettings',
          value: val
        })
      }
    },
    topNav: {
      get () {
        return this.$store.state.settings.topNav
      }
    }
  },
  methods: {
    toggleSideBar () {
      this.$store.dispatch('app/toggleSideBar')
    },
    openHome () {
      const { href } = this.$router.resolve({ path: '/' })
      window.open(href, '_blank')
    },
    async logout () {
      this.$confirm('确定注销并退出系统吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$store.dispatch('LogOut').then(() => {
          location.href = '/';
        })
      }).catch(() => {
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 4rem; /* 根字号 14px→56px；16px（约 80% 缩放）→64px */
  overflow: visible;
  position: relative;
  background: transparent;
  display: flex;
  align-items: center;
  border-bottom: none;
  box-sizing: border-box;

  .navbar-left {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .navbar-center {
    margin-left: 10px;
    flex: 1;
    display: flex;
    align-items: center;
    height: 100%;
    overflow: hidden;
    min-width: 0;
  }

  .right-menu {
    display: flex;
    align-items: center;
    height: 100%;
    line-height: 1;
    flex-shrink: 0;

    &:focus {
      outline: none;
    }

    // el-tooltip 包裹层也参与竖向居中
    ::v-deep .el-tooltip {
      display: inline-flex;
      align-items: center;
      height: 100%;
    }

    .right-menu-item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 11px;
      height: 100%;
      font-size: 24px;
      color: #5a5e66;
      line-height: 1;
      vertical-align: middle;

      &.hover-effect {
        cursor: pointer;

        &:hover {
          background: transparent;
        }
      }

      // 右侧图标：悬停变蓝，无背景
      &:not(.avatar-container) {
        ::v-deep img {
          transition: filter 0.15s ease;
        }

        &:hover ::v-deep img {
          filter: brightness(0) saturate(100%) invert(28%) sepia(98%) saturate(2466%) hue-rotate(212deg) brightness(98%) contrast(101%);
        }
      }
    }

    .avatar-container {
      margin-right: 16px;
      display: inline-flex;
      align-items: center;
      height: 100%;
      padding: 0 12px;
    }
  }

  .user-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #0a59f7;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    line-height: 24px;
    text-align: center;
    cursor: pointer;
    user-select: none;
    display: inline-block;
    flex-shrink: 0;
  }

  .navbar-line{
    background: #111a2c1a;
    display: inline-block;
    height: 1rem;
    margin-right: 1.35rem;
    vertical-align: middle;
    width: 1px;
  }

  .navbar-home {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    line-height: 1;
    opacity: 0.9;

    &:hover {
      opacity: 1;
    }
  }

  .navbar-home__icon {
    width: 24px;
    height: 24px;
    display: block;
    margin-left: 21px;
  }
}
</style>

<style lang="scss">
.ems-user-dropdown.el-dropdown-menu {
  min-width: 220px;
  padding: 0;
  margin-top: 0 !important;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.ems-user-dropdown .popper__arrow {
  display: none;
}

.ems-user-dropdown__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.ems-user-dropdown .user-avatar--lg {
  width: 40px;
  height: 40px;
  line-height: 40px;
  font-size: 16px;
  background: #0a59f7;
  color: #fff;
  border-radius: 50%;
  text-align: center;
  font-weight: 600;
  display: inline-block;
  flex-shrink: 0;
}

.ems-user-dropdown__name {
  font-size: 14px;
  font-weight: 600;
  color: #000000d9;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ems-user-dropdown__divider {
  height: 1px;
  background: #f0f0f0;
  margin: 0;
}

.ems-user-dropdown__item {
  display: block;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 22px;
  color: #000000d9;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

.ems-user-dropdown__item:hover {
  background: #f5f5f5;
  color: #000000d9;
}
</style>
