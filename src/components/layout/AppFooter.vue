<template>
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-links">
        <div class="link-group">
          <h4>关于我们</h4>
          <a href="#">平台介绍</a>
          <a href="#">联系我们</a>
          <a href="#">加入我们</a>
        </div>
        <div class="link-group">
          <h4>帮助中心</h4>
          <a href="#">使用指南</a>
          <a href="#">常见问题</a>
          <a href="#">意见反馈</a>
        </div>
        <div class="link-group">
          <h4>法律声明</h4>
          <a href="#">用户协议</a>
          <a href="#">隐私政策</a>
          <a href="#">社区规范</a>
        </div>
        <div class="link-group">
          <h4>友情链接</h4>
          <a href="#">中国地质大学</a>
          <a href="#">创新创业学院</a>
          <a href="#">教务处</a>
        </div>
      </div>
      <div class="copyright">
        <p>© 2026 中国地质大学（武汉）学术社区. 坚持学术自由，促进学术交流.</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
// 底部组件逻辑
</script>

<style scoped>
.app-footer {
  background-color: #1e293b;
  color: #cbd5e1;
  padding: 40px 0 24px;
  margin-top: auto;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid #334155;
}

.link-group h4 {
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.link-group a {
  display: block;
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 10px;
  transition: color 0.2s;
}

.link-group a:hover {
  color: white;
}

.copyright {
  text-align: center;
  padding-top: 24px;
  font-size: 13px;
  color: #64748b;
}
</style>