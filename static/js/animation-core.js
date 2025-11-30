/**
 * 动画核心控制器 - 统一初始化和管理所有动画效果
 * 集成粒子背景、3D倾斜、按钮波纹、计数器等
 */

(function() {
    'use strict';

    const state = {
        reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        particlesEnabled: false,
        tiltEnabled: false,
        rippleEnabled: false,
        countersEnabled: false
    };

    /**
     * 监听用户是否偏好减少动画
     */
    function prefersReducedMotionListener(e) {
        state.reduced = e.matches;
        if (state.reduced) {
            teardown();
        } else {
            init();
        }
    }

    /**
     * 初始化所有动画效果
     */
    function init() {
        if (state.reduced) return;
        initParticles();
        initTilt();
        initRipples();
        initCounters();
        initTabIndicator();
    }

    /**
     * 清理动画资源
     */
    function teardown() {
        if (window.particleBackground) {
            window.particleBackground.destroy();
        }
    }

    /**
     * 确保粒子画布存在
     */
    function ensureCanvas() {
        let canvas = document.getElementById('particles-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'particles-canvas';
            canvas.setAttribute('aria-hidden', 'true');
            document.body.prepend(canvas);
        }
        return canvas;
    }

    /**
     * 初始化粒子背景
     */
    function initParticles() {
        const root = document.documentElement;
        const wantsParticles = root.dataset.anim?.includes('particles');
        if (!wantsParticles) return;

        ensureCanvas();
        state.particlesEnabled = true;

        // 调用 particles.js 提供的 spawnParticles 函数
        if (typeof spawnParticles === 'function') {
            spawnParticles();
        } else if (typeof ParticleBackground === 'undefined') {
            console.warn('ParticleBackground is not available; load static/js/particles.js before animation-core.js');
        }
    }

    /**
     * 初始化卡片3D倾斜效果
     */
    function initTilt() {
        const cards = document.querySelectorAll('.card-3d-tilt');
        if (!cards.length) return;

        state.tiltEnabled = true;
        const maxTilt = 10;

        cards.forEach(card => {
            let frame;

            card.addEventListener('pointermove', (e) => {
                if (frame) cancelAnimationFrame(frame);

                frame = requestAnimationFrame(() => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;

                    const rx = ((y - centerY) / rect.height) * -maxTilt;
                    const ry = ((x - centerX) / rect.width) * maxTilt;

                    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
                });
            });

            card.addEventListener('pointerleave', () => {
                if (frame) cancelAnimationFrame(frame);
                card.style.transform = '';
            });
        });
    }

    /**
     * 初始化按钮波纹效果
     */
    function initRipples() {
        const buttons = document.querySelectorAll('.btn-ripple');
        if (!buttons.length) return;

        state.rippleEnabled = true;

        buttons.forEach(btn => {
            // 确保按钮有相对定位
            if (getComputedStyle(btn).position === 'static') {
                btn.style.position = 'relative';
            }
            btn.style.overflow = 'hidden';

            btn.addEventListener('click', (e) => {
                // 移除旧波纹
                const oldRipple = btn.querySelector('.ripple-effect');
                if (oldRipple) oldRipple.remove();

                // 创建新波纹
                const ripple = document.createElement('span');
                ripple.className = 'ripple-effect';

                const rect = btn.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);

                ripple.style.width = ripple.style.height = `${size}px`;
                ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
                ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

                btn.appendChild(ripple);

                // 动画结束后移除
                ripple.addEventListener('animationend', () => ripple.remove());
            });
        });
    }

    /**
     * 初始化数值计数动画
     */
    function initCounters() {
        const counters = document.querySelectorAll('[data-counter]');
        if (!counters.length) return;

        state.countersEnabled = true;

        counters.forEach(el => {
            const target = Number(el.dataset.counter);
            const duration = Math.min(1200, Number(el.dataset.counterDuration) || 800);
            const digits = Number(el.dataset.counterDigits) || 2;
            const startValue = Number(el.textContent) || 0;

            if (isNaN(target)) return;

            const start = performance.now();

            function tick(now) {
                const progress = Math.min(1, (now - start) / duration);
                const value = startValue + (target - startValue) * easeOutQuad(progress);

                el.textContent = value.toFixed(digits);

                if (progress < 1) {
                    requestAnimationFrame(tick);
                }
            }

            requestAnimationFrame(tick);
        });
    }

    /**
     * 缓动函数
     */
    function easeOutQuad(t) {
        return t * (2 - t);
    }

    /**
     * 初始化导航标签指示器
     */
    function initTabIndicator() {
        const tabContainers = document.querySelectorAll('.top-nav-tabs');

        tabContainers.forEach(container => {
            const tabs = container.querySelectorAll('.top-nav-tab');
            const activeTab = container.querySelector('.active');

            if (!activeTab || tabs.length === 0) return;

            // 创建指示器
            let indicator = container.querySelector('.tab-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'tab-indicator';
                container.style.position = 'relative';
                container.appendChild(indicator);
            }

            // 更新指示器位置
            const updateIndicator = (tab) => {
                const rect = tab.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                indicator.style.width = `${rect.width}px`;
                indicator.style.left = `${rect.left - containerRect.left}px`;
            };

            // 初始位置
            updateIndicator(activeTab);

            // 监听窗口大小变化
            window.addEventListener('resize', () => {
                const currentActive = container.querySelector('.active');
                if (currentActive) updateIndicator(currentActive);
            });
        });
    }

    /**
     * 主题变化回调
     */
    function onThemeChanged() {
        if (state.reduced) return;

        // 粒子背景会自动处理主题变化
        // 这里可以添加其他需要响应主题的动画
    }

    /**
     * 页面可见性变化处理
     */
    function onVisibilityChange() {
        if (document.hidden && window.particleBackground) {
            window.particleBackground.destroy();
        } else if (!document.hidden && state.particlesEnabled && typeof spawnParticles === 'function') {
            spawnParticles();
        }
    }

    /**
     * 启动动画系统
     */
    function boot() {
        // 监听动画偏好设置变化
        const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
        mql.addEventListener('change', prefersReducedMotionListener);

        // 监听页面可见性
        document.addEventListener('visibilitychange', onVisibilityChange);

        // 监听主题变化
        window.addEventListener('theme-changed', onThemeChanged);

        // 初始化动画
        init();

        console.log('🎨 Animation Core initialized', {
            reduced: state.reduced,
            particles: state.particlesEnabled,
            tilt: state.tiltEnabled,
            ripple: state.rippleEnabled,
            counters: state.countersEnabled
        });
    }

    // 在 DOM 准备好后启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

    // 导出全局接口
    window.AnimationCore = {
        init,
        teardown,
        state: () => ({ ...state })
    };
})();
