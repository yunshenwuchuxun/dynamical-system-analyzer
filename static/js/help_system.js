// Help system: tooltips, guided tour, contextual help, and error toasts
(function() {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  // Toast system
  function ensureToastContainer() {
    let c = document.querySelector('.toast-container');
    if (!c) {
      c = document.createElement('div');
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function closeToast(el) {
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 200);
  }

  function showToastInternal({ type = 'info', title = '', message = '', suggestions = [] } = {}) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
      info: '<i class="fas fa-info-circle"></i>',
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-exclamation-circle"></i>'
    };

    toast.innerHTML = `
      <div class="toast-icon">${iconMap[type] || iconMap.info}</div>
      <div class="toast-body">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
        ${Array.isArray(suggestions) && suggestions.length ? `
          <ul class="toast-suggestions">
            ${suggestions.map(s => `<li>${s}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
      <button class="toast-close" aria-label="关闭" title="关闭">×</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => closeToast(toast));

    container.appendChild(toast);
    setTimeout(() => closeToast(toast), 8000);
  }

  window.showToast = function(message, opts = {}) {
    const { type = 'info', title = '' } = opts;
    showToastInternal({ type, title, message, suggestions: opts.suggestions || [] });
  };

  window.showError = function(title, message, suggestions = []) {
    showToastInternal({ type: 'error', title, message, suggestions });
  };

  // Tooltips via tippy.js
  function attachTip(selector, content, options = {}) {
    const el = document.querySelector(selector);
    if (!el || !window.tippy) return;
    window.tippy(el, Object.assign({
      content,
      theme: 'light',
      placement: 'top',
      delay: [200, 0],
      allowHTML: true,
      interactive: true
    }, options));
  }

  function initTooltips() {
    // Index page
    attachTip('#a11', '矩阵 A 的 a₁₁（与 a₂₂ 一起决定迹 tr = a₁₁ + a₂₂）');
    attachTip('#a12', 'a₁₂ 影响旋转/剪切，会改变相图的方向');
    attachTip('#a21', 'a₂₁ 与 a₁₂共同决定耦合强度');
    attachTip('#a22', '与 a₁₁ 一起决定稳定性（行列式和迹）');
    attachTip('#analyzeBtn', '点击分析系统，计算特征值/特征向量并推导数学结论');

    // Phase portrait page
    attachTip('#generatePortraitBtn', '根据当前矩阵生成相图');
    attachTip('#gridDensity', '控制向量场的采样密度（越大越细致）');

    // Trajectory page
    attachTip('#addPointBtn', '添加一个初始点并绘制其运动轨迹');
    attachTip('#playBtn', '开始动画');
    attachTip('#pauseBtn', '暂停动画');
    attachTip('#resetBtn', '重置当前轨迹');
    attachTip('#speedSlider', '调整动画播放速度');

    // Text generator
    attachTip('#descriptionInput', '用自然语言描述目标相图，例如：稳定螺旋、鞍点、椭圆轨迹');
    attachTip('#generateBtn', '根据描述自动生成系统矩阵与可视化');

    // Nonlinear analysis
    attachTip('#dxdtInput', '输入 dx/dt 的表达式，例如 -y + x*(1-x^2-y^2)');
    attachTip('#dydtInput', '输入 dy/dt 的表达式');
    attachTip('#analyzeNonlinearBtn', '分析非线性系统的平衡点、类型与相图');

    // Enhanced phase portrait
    attachTip('#a11-slider', '拖动调整 a₁₁，同时观察相图和指标');
    attachTip('#toggleNullclines', '开启/关闭零倾线，辅助分析稳定性');

    // Chaos analysis
    attachTip('#generateAttractor', '生成选定奇异吸引子的轨迹');
    attachTip('#animateTrajectory', '播放/演示 3D 轨迹动画');
  }

  // Guided tour via intro.js
  function startGuidedTour() {
    if (!window.introJs) return;

    const steps = [];

    const nav = document.querySelector('.navigation');
    if (nav) steps.push({ element: nav, intro: '通过导航进入不同功能页面：相图、轨迹、智能生成等。' });

    const matrixSection = document.querySelector('.matrix-input-section, .matrix-input-compact');
    if (matrixSection) steps.push({ element: matrixSection, intro: '这里设置系统矩阵 A 的四个元素，决定系统的动力学行为。' });

    const preset = document.querySelector('.preset-buttons, .preset-buttons-enhanced, .preset-equation-buttons');
    if (preset) steps.push({ element: preset, intro: '快速选择经典系统作为起点。' });

    const primaryAction = document.querySelector('#analyzeBtn, #generatePortraitBtn, #generateBtn, #analyzeNonlinearBtn, #generateAttractor');
    if (primaryAction) steps.push({ element: primaryAction, intro: '点击开始分析或生成可视化。' });

    const results = document.querySelector('#resultsSection, #portraitContainer, #visualizationSection, .enhanced-visualization, .chaos-visualization');
    if (results) steps.push({ element: results, intro: '在这里查看相图、轨迹、分岔分析、3D 吸引子等结果。' });

    const tips = document.querySelector('#startTourBtn');
    if (tips) steps.push({ element: tips, intro: '随时点击这里再次打开新手引导。' });

    const intro = window.introJs();
    intro.setOptions({
      steps,
      nextLabel: '下一步',
      prevLabel: '上一步',
      skipLabel: '跳过',
      doneLabel: '完成',
      hidePrev: false,
      hideNext: false
    });
    intro.start();
  }

  function autoRunTourOnce() {
    try {
      const key = 'hasSeenTour';
      if (localStorage.getItem(key) !== '1') {
        // Give a moment for layout to settle
        setTimeout(() => startGuidedTour(), 600);
        localStorage.setItem(key, '1');
      }
    } catch (_) {}
  }

  function bindManualStart() {
    const btn = document.getElementById('startTourBtn');
    if (btn) btn.addEventListener('click', () => startGuidedTour());
  }

  function installGlobalErrorHandlers() {
    window.addEventListener('error', (e) => {
      if (!e || !e.message) return;
      if (window.showError) window.showError('脚本错误', e.message, ['打开控制台查看更多细节(F12)']);
    });
    window.addEventListener('unhandledrejection', (e) => {
      const msg = (e && (e.reason && (e.reason.message || e.reason.toString()))) || '未知异步错误';
      if (window.showError) window.showError('异步错误', msg, ['请稍后重试']);
    });
  }

  ready(() => {
    try { initTooltips(); } catch (_) {}
    bindManualStart();
    installGlobalErrorHandlers();
    autoRunTourOnce();
  });
})();
