/**
 * 粒子背景效果 - 模拟分子布朗运动
 * 科学主题的动态粒子系统
 */

class ParticleBackground {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn(`Canvas element #${canvasId} not found`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');

        // 配置参数
        this.config = {
            particleCount: options.particleCount || 80,
            particleSize: options.particleSize || 2,
            particleColor: options.particleColor || 'rgba(102, 126, 234, 0.6)',
            lineColor: options.lineColor || 'rgba(102, 126, 234, 0.15)',
            maxDistance: options.maxDistance || 150,
            speed: options.speed || 0.5,
            interactive: options.interactive !== false,
            ...options
        };

        this.particles = [];
        this.mouse = { x: null, y: null, radius: 100 };
        this.animationId = null;

        this.init();
    }

    init() {
        this.setCanvasSize();
        this.createParticles();
        this.bindEvents();
        this.animate();
    }

    setCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.config.speed,
                vy: (Math.random() - 0.5) * this.config.speed,
                size: Math.random() * this.config.particleSize + 1
            });
        }
    }

    bindEvents() {
        // 保存事件处理器引用以便清理
        this.handleResize = () => {
            this.setCanvasSize();
            this.createParticles();
        };
        window.addEventListener('resize', this.handleResize);

        if (this.config.interactive) {
            this.handleMouseMove = (e) => {
                this.mouse.x = e.x;
                this.mouse.y = e.y;
            };
            this.handleMouseLeave = () => {
                this.mouse.x = null;
                this.mouse.y = null;
            };
            this.canvas.addEventListener('mousemove', this.handleMouseMove);
            this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
        }
    }

    drawParticle(particle) {
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fillStyle = this.config.particleColor;
        this.ctx.fill();
    }

    drawLine(p1, p2, distance) {
        const opacity = 1 - distance / this.config.maxDistance;
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.config.lineColor.replace(/[\d.]+\)$/g, `${opacity})`);
        this.ctx.lineWidth = 0.5;
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
    }

    updateParticle(particle) {
        // 边界反弹
        if (particle.x + particle.size > this.canvas.width || particle.x - particle.size < 0) {
            particle.vx = -particle.vx;
        }
        if (particle.y + particle.size > this.canvas.height || particle.y - particle.size < 0) {
            particle.vy = -particle.vy;
        }

        // 鼠标交互
        if (this.config.interactive && this.mouse.x && this.mouse.y) {
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.mouse.radius) {
                const force = (this.mouse.radius - distance) / this.mouse.radius;
                const angle = Math.atan2(dy, dx);
                particle.vx -= Math.cos(angle) * force * 0.2;
                particle.vy -= Math.sin(angle) * force * 0.2;
            }
        }

        // 更新位置
        particle.x += particle.vx;
        particle.y += particle.vy;

        // 速度衰减（模拟摩擦力）
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // 保持最小速度
        if (Math.abs(particle.vx) < 0.1) particle.vx = (Math.random() - 0.5) * this.config.speed;
        if (Math.abs(particle.vy) < 0.1) particle.vy = (Math.random() - 0.5) * this.config.speed;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 更新和绘制粒子
        this.particles.forEach(particle => {
            this.updateParticle(particle);
            this.drawParticle(particle);
        });

        // 绘制连接线
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.config.maxDistance) {
                    this.drawLine(this.particles[i], this.particles[j], distance);
                }
            }
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
        }
        if (this.config.interactive) {
            if (this.handleMouseMove) this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            if (this.handleMouseLeave) this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
        }
        this.animationId = null;
    }
}

// 获取当前主题颜色
function getThemeColors() {
    const isDark = document.documentElement.classList.contains('dark');
    return {
        particleColor: isDark ? 'rgba(100, 255, 218, 0.6)' : 'rgba(102, 126, 234, 0.6)',
        lineColor: isDark ? 'rgba(100, 255, 218, 0.15)' : 'rgba(102, 126, 234, 0.15)'
    };
}

// 生成粒子背景
function spawnParticles() {
    // 尊重用户的动画偏好设置
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    if (window.particleBackground) {
        window.particleBackground.destroy();
    }

    const colors = getThemeColors();
    window.particleBackground = new ParticleBackground('particles-canvas', {
        particleCount: 80,
        particleColor: colors.particleColor,
        lineColor: colors.lineColor,
        maxDistance: 150,
        speed: 0.5,
        interactive: true
    });
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('particles-canvas')) {
        spawnParticles();

        // 监听主题切换事件
        const themeListener = () => spawnParticles();
        window.addEventListener('theme-changed', themeListener);

        // 监听 HTML 类变化（兼容方案）
        const observer = new MutationObserver(themeListener);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        // 清理资源
        window.addEventListener('beforeunload', () => {
            window.removeEventListener('theme-changed', themeListener);
            observer.disconnect();
            if (window.particleBackground) {
                window.particleBackground.destroy();
            }
        });
    }
});
