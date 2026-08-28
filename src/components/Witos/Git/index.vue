<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <img :src="gitIcon" class="ems-icon" alt="源码地址">
    <el-dropdown-menu slot="dropdown" class="ems-git-dropdown">
      <el-dropdown-item command="front">
        <i class="el-icon-monitor" /> web端
      </el-dropdown-item>
      <el-dropdown-item command="back">
        <i class="el-icon-s-platform" /> cloud端
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
import gitIcon from '@/assets/images/git.svg'

export default {
  name: 'WitosGit',
  data() {
    return {
      gitIcon,
      urls: {
        front: 'https://github.com/roinli/govpp-admin',
        back: 'https://github.com/roinli/govpp-cloud'
      }
    }
  },
  methods: {
    handleCommand(command) {
      window.open(this.urls[command])
    }
  }
}
</script>

<style scoped>
.ems-icon {
  width: 21px;
  height: 21px;
  cursor: pointer;
  display: block;
}
</style>
