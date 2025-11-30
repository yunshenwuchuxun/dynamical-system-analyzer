// 轨迹动画页面JavaScript
class TrajectoryAnimator {
    constructor() {
        this.canvas = document.getElementById('trajectoryCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentMatrix = this.loadMatrixFromStorage() || [[0, 1], [-1, 0]];
        this.trajectories = [];
        this.animationId = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.animationSpeed = 5;
        this.timeSpan = 10;
        this.isRealTime = false;
        this.trajectoryColors = [
            '#FF3E82', '#00D4FF', '#7B68EE', '#00FF87', '#FFB347',
            '#FF6B9D', '#40E0D0', '#DA70D6', '#32CD32', '#FFA500'
        ];

        this.setupCanvas();
        this.initializeEventListeners();
        this.setMatrixInputs();
        this.setupMatrixSliders();
        this.drawGrid();
    }

    loadMatrixFromStorage() {
        const stored = localStorage.getItem('currentMatrix');
        return stored ? JSON.parse(stored) : null;
    }

    setupCanvas() {
        // 设置高DPI显示
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        // 设置坐标系
        this.canvasWidth = rect.width;
        this.canvasHeight = rect.height;
        this.centerX = this.canvasWidth / 2;
        this.centerY = this.canvasHeight / 2;
        this.scale = Math.min(this.canvasWidth, this.canvasHeight) / 8; // 8个单位的范围
    }

    initializeEventListeners() {
        // 矩阵输入
        ['a11', 'a12', 'a21', 'a22'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.updateMatrix();
            });
        });

        // 初始点输入
        document.getElementById('addPointBtn').addEventListener('click', () => {
            this.addTrajectory();
        });

        // 动画控制
        document.getElementById('playBtn').addEventListener('click', () => {
            this.startAnimation();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pauseAnimation();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetAnimation();
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearTrajectories();
        });

        // 参数控制
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = this.animationSpeed;
        });

        document.getElementById('timeSpan').addEventListener('change', (e) => {
            this.timeSpan = parseFloat(e.target.value) || 10;
        });

        // 实时更新按钮
        document.getElementById('realTimeBtn').addEventListener('click', () => {
            this.toggleRealTimeMode();
        });

        // 画布点击添加轨迹
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // 转换到数学坐标
            const mathX = (x - this.centerX) / this.scale;
            const mathY = -(y - this.centerY) / this.scale; // Y轴翻转

            document.getElementById('x0').value = mathX.toFixed(2);
            document.getElementById('y0').value = mathY.toFixed(2);
            this.addTrajectory();
        });
    }

    setMatrixInputs() {
        if (this.currentMatrix) {
            document.getElementById('a11').value = this.currentMatrix[0][0];
            document.getElementById('a12').value = this.currentMatrix[0][1];
            document.getElementById('a21').value = this.currentMatrix[1][0];
            document.getElementById('a22').value = this.currentMatrix[1][1];
        }
    }

    setupMatrixSliders() {
        const sliders = ['a11', 'a12', 'a21', 'a22'];

        sliders.forEach(id => {
            const slider = document.getElementById(id + 'Slider');
            const valueSpan = document.getElementById(id + 'Value');
            const input = document.getElementById(id);

            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueSpan.textContent = value.toFixed(1);
                input.value = value;
                this.updateMatrix();

                if (this.isRealTime) {
                    this.updateRealTimeTrajectories();
                }
            });
        });
    }

    toggleRealTimeMode() {
        this.isRealTime = !this.isRealTime;
        const btn = document.getElementById('realTimeBtn');

        if (this.isRealTime) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-pause"></i> 停止实时';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> 实时更新';
        }
    }

    updateRealTimeTrajectories() {
        if (this.trajectories.length > 0) {
            this.recalculateAllTrajectories();
            this.redraw();
        }
    }

    async recalculateAllTrajectories() {
        for (let trajectory of this.trajectories) {
            try {
                const response = await fetch('/api/compute_trajectory', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        matrix: this.currentMatrix,
                        initial_point: trajectory.initial_point,
                        t_span: [0, this.timeSpan]
                    })
                });

                const data = await response.json();
                if (data.success) {
                    trajectory.x = data.trajectory.x;
                    trajectory.y = data.trajectory.y;
                    trajectory.time = data.trajectory.time;
                }
            } catch (error) {
                console.error('重新计算轨迹失败:', error);
            }
        }
    }

    updateMatrix() {
        this.currentMatrix = [
            [parseFloat(document.getElementById('a11').value) || 0,
             parseFloat(document.getElementById('a12').value) || 0],
            [parseFloat(document.getElementById('a21').value) || 0,
             parseFloat(document.getElementById('a22').value) || 0]
        ];
        localStorage.setItem('currentMatrix', JSON.stringify(this.currentMatrix));
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    async addTrajectory() {
        this.updateMatrix();

        const x0 = parseFloat(document.getElementById('x0').value) || 0;
        const y0 = parseFloat(document.getElementById('y0').value) || 0;

        this.showLoading();

        try {
            const response = await fetch('/api/compute_trajectory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    matrix: this.currentMatrix,
                    initial_point: [x0, y0],
                    t_span: [0, this.timeSpan]
                })
            });

            const data = await response.json();

            if (data.success) {
                const trajectory = {
                    ...data.trajectory,
                    color: this.trajectoryColors[this.trajectories.length % this.trajectoryColors.length],
                    id: Date.now(),
                    visible: true
                };

                this.trajectories.push(trajectory);
                this.updateTrajectoryList();
                this.redraw();
            } else {
                alert('计算轨迹失败: ' + data.error);
            }
        } catch (error) {
            alert('网络错误: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    updateTrajectoryList() {
        const container = document.getElementById('trajectoryList');

        if (this.trajectories.length === 0) {
            container.innerHTML = '<p class="no-trajectories">暂无轨迹，点击"添加轨迹"开始</p>';
            return;
        }

        let html = '';
        this.trajectories.forEach((traj, index) => {
            html += `
                <div class="trajectory-item" style="border-left: 4px solid ${traj.color}">
                    <div class="trajectory-info">
                        <strong>轨迹 ${index + 1}</strong><br>
                        初始点: (${traj.initial_point[0].toFixed(2)}, ${traj.initial_point[1].toFixed(2)})<br>
                        <small>点数: ${traj.x.length}</small>
                    </div>
                    <div class="trajectory-controls">
                        <button data-action="toggle" data-id="${traj.id}"
                                class="toggle-btn ${traj.visible ? 'visible' : 'hidden'}">
                            <i class="fas ${traj.visible ? 'fa-eye' : 'fa-eye-slash'}"></i>
                        </button>
                        <button data-action="remove" data-id="${traj.id}"
                                class="remove-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // 添加事件委托处理器
        this.setupTrajectoryListEventHandlers();
    }

    setupTrajectoryListEventHandlers() {
        const container = document.getElementById('trajectoryList');

        // 移除之前的事件监听器（如果有的话）
        container.removeEventListener('click', this.handleTrajectoryListClick);

        // 添加新的事件监听器
        this.handleTrajectoryListClick = (e) => {
            const button = e.target.closest('button[data-action]');
            if (!button) return;

            const action = button.getAttribute('data-action');
            const id = parseInt(button.getAttribute('data-id'));

            if (action === 'toggle') {
                this.toggleTrajectory(id);
            } else if (action === 'remove') {
                this.removeTrajectory(id);
            }
        };

        container.addEventListener('click', this.handleTrajectoryListClick);
    }

    toggleTrajectory(id) {
        // 确保id类型匹配，支持字符串和数字类型
        const targetId = typeof id === 'string' ? parseInt(id) : id;
        const trajectory = this.trajectories.find(t => t.id === targetId);
        if (trajectory) {
            trajectory.visible = !trajectory.visible;
            this.updateTrajectoryList();
            this.redraw();
        }
    }

    removeTrajectory(id) {
        // 确保id类型匹配，支持字符串和数字类型
        const targetId = typeof id === 'string' ? parseInt(id) : id;
        console.log('Removing trajectory with ID:', id, 'converted to:', targetId);
        console.log('Current trajectories:', this.trajectories.map(t => t.id));

        this.trajectories = this.trajectories.filter(t => t.id !== targetId);
        console.log('Trajectories after removal:', this.trajectories.map(t => t.id));

        this.updateTrajectoryList();
        this.redraw();
    }

    clearTrajectories() {
        this.trajectories = [];
        this.updateTrajectoryList();
        this.pauseAnimation();
        this.resetAnimation();
        this.redraw();
    }

    startAnimation() {
        if (this.trajectories.length === 0) {
            alert('请先添加至少一条轨迹');
            return;
        }

        this.isPlaying = true;
        document.getElementById('playBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;

        this.animate();
    }

    pauseAnimation() {
        this.isPlaying = false;
        document.getElementById('playBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    resetAnimation() {
        this.pauseAnimation();
        this.currentTime = 0;
        this.updateCurrentPointInfo(0, 0, 0);
        this.redraw();
    }

    animate() {
        if (!this.isPlaying) return;

        this.currentTime += 0.016 * this.animationSpeed; // 假设60fps

        if (this.currentTime >= this.timeSpan) {
            this.currentTime = this.timeSpan;
            this.pauseAnimation();
        }

        this.redraw();

        if (this.isPlaying) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    worldToCanvas(x, y) {
        return {
            x: this.centerX + x * this.scale,
            y: this.centerY - y * this.scale // Y轴翻转
        };
    }

    drawGrid() {
        // 绘制渐变背景
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, Math.max(this.canvasWidth, this.canvasHeight) / 2
        );
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#0f0f23');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // 绘制次要网格线
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;

        for (let i = -8; i <= 8; i += 0.5) {
            if (i === 0 || Math.abs(i % 1) < 0.001) continue; // 跳过主要网格线

            const pos = this.worldToCanvas(i, 0);
            // 垂直线
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, 0);
            this.ctx.lineTo(pos.x, this.canvasHeight);
            this.ctx.stroke();

            const posY = this.worldToCanvas(0, i);
            // 水平线
            this.ctx.beginPath();
            this.ctx.moveTo(0, posY.y);
            this.ctx.lineTo(this.canvasWidth, posY.y);
            this.ctx.stroke();
        }

        // 绘制主要网格线
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;

        for (let i = -4; i <= 4; i++) {
            if (i === 0) continue; // 坐标轴单独绘制

            const pos = this.worldToCanvas(i, 0);
            // 垂直线
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, 0);
            this.ctx.lineTo(pos.x, this.canvasHeight);
            this.ctx.stroke();

            // 水平线
            const posY = this.worldToCanvas(0, i);
            this.ctx.beginPath();
            this.ctx.moveTo(0, posY.y);
            this.ctx.lineTo(this.canvasWidth, posY.y);
            this.ctx.stroke();
        }

        // 绘制坐标轴
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 2;

        // X轴
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.centerY);
        this.ctx.lineTo(this.canvasWidth, this.centerY);
        this.ctx.stroke();

        // Y轴
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, 0);
        this.ctx.lineTo(this.centerX, this.canvasHeight);
        this.ctx.stroke();

        // 绘制原点
        this.ctx.fillStyle = '#FF3E82';
        this.ctx.shadowColor = '#FF3E82';
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // 绘制刻度标签
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px Roboto';
        this.ctx.textAlign = 'center';

        for (let i = -3; i <= 3; i++) {
            if (i === 0) continue;

            const pos = this.worldToCanvas(i, 0);
            this.ctx.fillText(i.toString(), pos.x, this.centerY + 20);

            const posY = this.worldToCanvas(0, i);
            this.ctx.fillText(i.toString(), this.centerX - 20, posY.y + 5);
        }
    }

    drawTrajectories() {
        this.trajectories.forEach(trajectory => {
            if (!trajectory.visible) return;

            this.ctx.strokeStyle = trajectory.color;
            this.ctx.lineWidth = 2;

            // 绘制完整轨迹（淡色）
            this.ctx.globalAlpha = 0.2;
            this.ctx.strokeStyle = trajectory.color;
            this.ctx.lineWidth = 2;
            this.ctx.shadowColor = trajectory.color;
            this.ctx.shadowBlur = 3;
            this.ctx.beginPath();

            for (let i = 0; i < trajectory.x.length; i++) {
                const pos = this.worldToCanvas(trajectory.x[i], trajectory.y[i]);

                if (i === 0) {
                    this.ctx.moveTo(pos.x, pos.y);
                } else {
                    this.ctx.lineTo(pos.x, pos.y);
                }
            }

            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            // 绘制动画轨迹（实色）
            this.ctx.globalAlpha = 1.0;

            const maxIndex = Math.floor((this.currentTime / this.timeSpan) * (trajectory.x.length - 1));

            if (maxIndex > 0) {
                this.ctx.beginPath();

                for (let i = 0; i <= maxIndex; i++) {
                    const pos = this.worldToCanvas(trajectory.x[i], trajectory.y[i]);

                    if (i === 0) {
                        this.ctx.moveTo(pos.x, pos.y);
                    } else {
                        this.ctx.lineTo(pos.x, pos.y);
                    }
                }

                this.ctx.stroke();

                // 绘制当前点
                if (maxIndex < trajectory.x.length) {
                    const currentPos = this.worldToCanvas(
                        trajectory.x[maxIndex],
                        trajectory.y[maxIndex]
                    );

                    // 绘制当前点圆圈
                    this.ctx.fillStyle = trajectory.color;
                    this.ctx.shadowColor = trajectory.color;
                    this.ctx.shadowBlur = 15;
                    this.ctx.beginPath();
                    this.ctx.arc(currentPos.x, currentPos.y, 8, 0, Math.PI * 2);
                    this.ctx.fill();

                    // 绘制内圈
                    this.ctx.shadowBlur = 0;
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(currentPos.x, currentPos.y, 4, 0, Math.PI * 2);
                    this.ctx.fill();

                    // 绘制方向箭头
                    this.drawDirectionArrow(trajectory, maxIndex, currentPos);

                    // 更新当前点信息（只显示第一条轨迹的）
                    if (trajectory === this.trajectories[0]) {
                        this.updateCurrentPointInfo(
                            trajectory.x[maxIndex],
                            trajectory.y[maxIndex],
                            this.currentTime
                        );
                    }
                }
            }

            // 绘制初始点
            const initialPos = this.worldToCanvas(
                trajectory.initial_point[0],
                trajectory.initial_point[1]
            );

            this.ctx.fillStyle = trajectory.color;
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(initialPos.x, initialPos.y, 8, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        });
    }

    updateCurrentPointInfo(x, y, t) {
        document.getElementById('currentCoords').textContent = `(${x.toFixed(3)}, ${y.toFixed(3)})`;
        document.getElementById('currentTime').textContent = t.toFixed(2);
    }

    drawDirectionArrow(trajectory, currentIndex, currentPos) {
        // 计算速度向量方向
        let dx, dy;

        if (currentIndex < trajectory.x.length - 1) {
            // 使用下一个点计算方向
            dx = trajectory.x[currentIndex + 1] - trajectory.x[currentIndex];
            dy = trajectory.y[currentIndex + 1] - trajectory.y[currentIndex];
        } else if (currentIndex > 0) {
            // 在末尾时使用前一个点计算方向
            dx = trajectory.x[currentIndex] - trajectory.x[currentIndex - 1];
            dy = trajectory.y[currentIndex] - trajectory.y[currentIndex - 1];
        } else {
            // 单点情况，使用向量场计算
            const point = [trajectory.x[currentIndex], trajectory.y[currentIndex]];
            const velocity = this.vectorField(point);
            dx = velocity[0];
            dy = velocity[1];
        }

        // 归一化方向向量
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        if (magnitude > 0.001) {
            dx /= magnitude;
            dy /= magnitude;

            // 箭头参数
            const arrowLength = 20;
            const arrowHeadLength = 8;
            const arrowHeadWidth = 6;

            // 计算箭头终点（画布坐标）
            const endX = currentPos.x + dx * arrowLength;
            const endY = currentPos.y - dy * arrowLength; // Y轴翻转

            // 设置箭头样式
            this.ctx.strokeStyle = trajectory.color;
            this.ctx.fillStyle = trajectory.color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.8;

            // 绘制箭头主体
            this.ctx.beginPath();
            this.ctx.moveTo(currentPos.x, currentPos.y);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();

            // 计算箭头头部的角度
            const angle = Math.atan2(-dy, dx); // Y轴翻转

            // 绘制箭头头部
            this.ctx.beginPath();
            this.ctx.moveTo(endX, endY);
            this.ctx.lineTo(
                endX - arrowHeadLength * Math.cos(angle - Math.PI / 6),
                endY + arrowHeadLength * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.lineTo(
                endX - arrowHeadLength * Math.cos(angle + Math.PI / 6),
                endY + arrowHeadLength * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.globalAlpha = 1.0;
        }
    }

    vectorField(point) {
        // 计算向量场值: dx/dt = Ax
        const x = point[0];
        const y = point[1];

        return [
            this.currentMatrix[0][0] * x + this.currentMatrix[0][1] * y,
            this.currentMatrix[1][0] * x + this.currentMatrix[1][1] * y
        ];
    }

    redraw() {
        // 绘制网格（包含背景）
        this.drawGrid();

        // 绘制轨迹
        this.drawTrajectories();
    }
}

// 全局变量,供HTML中的按钮调用
let trajectoryAnimator;

// 页面加载完成后初始化
(function() {
    function init() {
        trajectoryAnimator = new TrajectoryAnimator();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();