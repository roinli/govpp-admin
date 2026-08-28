<template>
  <div :class="classObj" class="app-wrapper" :style="{'--current-color': theme}">
    <div v-if="device==='mobile'&&sidebar.opened" class="drawer-bg" @click="handleClickOutside" />

    <div class="navbar-wrap fixed-header">
      <logo v-if="showLogo" :collapse="false" />
      <navbar />
    </div>

    <sidebar v-if="!sidebar.hide" class="sidebar-container" />

    <div :class="{hasTagsView:needTagsView,sidebarHide:sidebar.hide}" class="main-container">
      <el-scrollbar>
        <app-main />
        <right-panel>
          <settings />
        </right-panel>
      </el-scrollbar>
    </div>
  </div>
</template>

<script>
import RightPanel from '@/components/RightPanel'
import { AppMain, Navbar, Settings, Sidebar, TagsView } from './components'
import Logo from './components/Sidebar/Logo'
import ResizeMixin from './mixin/ResizeHandler'
import { mapState } from 'vuex'
import variables from '@/assets/styles/variables.scss'

export default {
  name: 'Layout',
  components: {
    AppMain,
    Navbar,
    RightPanel,
    Settings,
    Sidebar,
    TagsView,
    Logo
  },
  mixins: [ResizeMixin],
  computed: {
    ...mapState({
      theme: state => state.settings.theme,
      sideTheme: state => state.settings.sideTheme,
      sidebar: state => state.app.sidebar,
      device: state => state.app.device,
      needTagsView: state => state.settings.tagsView,
      fixedHeader: state => state.settings.fixedHeader,
      showLogo: state => state.settings.sidebarLogo
    }),
    classObj() {
      return {
        hideSidebar: !this.sidebar.opened,
        openSidebar: this.sidebar.opened,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === 'mobile'
      }
    },
    variables() {
      return variables
    }
  },
  methods: {
    handleClickOutside() {
      this.$store.dispatch('app/closeSideBar', { withoutAnimation: false })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@/assets/styles/mixin.scss';
@import '~@/assets/styles/variables.scss';

.app-wrapper {
  @include clearfix;
  position: relative;
  height: 100%;
  width: 100%;

  .el-scrollbar {
    height: 100%;
  }

  ::v-deep .el-scrollbar__bar.is-vertical {
    z-index: 10;
  }

  ::v-deep .el-scrollbar__wrap {
    overflow-x: hidden;
  }

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.navbar-wrap.fixed-header {
  display: flex;
  align-items: stretch;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 4rem; /* 14px→56px；16px→64px */
  background: #fff;
  box-shadow: none;
  overflow: visible;
  z-index: 1002;
}

.navbar-wrap.fixed-header ::v-deep .navbar {
  flex: 1;
  min-width: 0;
  box-shadow: 0 1px 2px 0 #0000000d;
}

.navbar-wrap.fixed-header ::v-deep .sidebar-logo-container {
  box-shadow: none;
  position: relative;
  z-index: 1;
}
</style>
