<template>
  <div class="sidebar-logo-container">
    <router-link class="sidebar-logo-link" to="/">
      <img v-if="logo" :src="logo" class="sidebar-logo" alt="">
      <h1
        class="sidebar-title"
        :style="{ color: sideTheme === 'theme-dark' ? variables.logoTitleColor : variables.logoLightTitleColor }"
      >{{ title }}</h1>
    </router-link>
  </div>
</template>

<script>
import { getInfo } from '@/api/login'
import logoImg from '@/assets/logo/logo.png'
import variables from '@/assets/styles/variables.scss'

export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    variables() {
      return variables
    },
    sideTheme() {
      return this.$store.state.settings.sideTheme
    }
  },
  data() {
    return {
      title: process.env.VUE_APP_TITLE,
      logo: logoImg
    }
  },
  created() {
    getInfo().then(res => {
      if (res.tenantName != '') {
        this.title = res.tenantName
        this.logo = logoImg
      }
    })
  },
  metaInfo() {
    return {
      title: this.title
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@/assets/styles/variables.scss';

.sidebar-logo-container {
  flex-shrink: 0;
  width: $base-sidebar-width;
  min-width: $base-sidebar-width;
  height: 4rem; /* 14px→56px；16px→64px */
  line-height: 4rem;
  background: #fff;
  box-sizing: border-box;
  padding: 0 16px 0px 32px;
  overflow: hidden;

  .sidebar-logo-link {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    overflow: hidden;

    .sidebar-logo {
      width: auto;
      height: 24px;
      vertical-align: middle;
      margin-right: 12px;
      flex-shrink: 0;
    }

    .sidebar-title {
      display: inline-block;
      margin: 0;
      color: #fff;
      font-weight: 600;
      line-height: 4rem;
      font-size: 16px;
      vertical-align: middle;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
  }
}
</style>
