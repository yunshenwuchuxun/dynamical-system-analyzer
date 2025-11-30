// 非线性系统分析JavaScript
class NonlinearSystemAnalyzer {
    constructor() {
        this.currentEquations = null;
        this.trajectories = [];
        this.animationId = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.animationSpeed = 5;
        this.timeSpan = 20;
        this.canvas = null;
        this.ctx = null;
        this.canvasWidth = 500;
        this.canvasHeight = 400;
        this.centerX = 250;
        this.centerY = 200;
        this.scale = 50; // 像素每单位
        this.viewRange = 5;
        this.gridDensity = 20;
        this.focusedInput = null;

        this.trajectoryColors = [
            '#FF3E82', '#00D4FF', '#7B68EE', '#00FF87', '#FFB347',
            '#FF6B9D', '#40E0D0', '#DA70D6', '#32CD32', '#FFA500'
        ];

        this.initializeEventListeners();
        this.setupCanvas();
    }

    initializeEventListeners() {
        // 跟踪当前焦点的输入框
        document.getElementById('dxdtInput').addEventListener('focus', (e) => {
            this.focusedInput = e.target;
        });
        
        document.getElementById('dydtInput').addEventListener('focus', (e) => {
            this.focusedInput = e.target;
        });

        // 数学函数按钮
        document.querySelectorAll('.func-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.insertFunction(btn.getAttribute('data-func'));
            });
        });

        // 预设方程按钮
        document.querySelectorAll('.preset-eq-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const dxdt = btn.getAttribute('data-dx');
                const dydt = btn.getAttribute('data-dy');
                document.getElementById('dxdtInput').value = dxdt;
                document.getElementById('dydtInput').value = dydt;
            });
        });

        // 分析按钮
        document.getElementById('analyzeNonlinearBtn').addEventListener('click', () => {
            this.analyzeSystem();
        });

        // 清空按钮
        document.getElementById('clearEquationsBtn').addEventListener('click', () => {
            document.getElementById('dxdtInput').value = '';
            document.getElementById('dydtInput').value = '';
            this.focusedInput = document.getElementById('dxdtInput');
            this.focusedInput.focus();
        });

        // 视图控制
        document.getElementById('gridDensitySlider').addEventListener('input', (e) => {
            this.gridDensity = parseInt(e.target.value);
            document.getElementById('gridDensityValue').textContent = this.gridDensity;
            if (this.currentEquations) {
                this.generatePhasePortrait();
            }
        });

        document.getElementById('viewRangeSlider').addEventListener('input', (e) => {
            this.viewRange = parseFloat(e.target.value);
            document.getElementById('viewRangeValue').textContent = this.viewRange;
            this.scale = Math.min(this.canvasWidth, this.canvasHeight) / (2 * this.viewRange);
            if (this.currentEquations) {
                this.generatePhasePortrait();
                this.redrawCanvas();
            }
        });

        // 动画控制
        document.getElementById('playNonlinearBtn').addEventListener('click', () => {
            this.startAnimation();
        });

        document.getElementById('pauseNonlinearBtn').addEventListener('click', () => {
            this.pauseAnimation();
        });

        document.getElementById('resetNonlinearBtn').addEventListener('click', () => {
            this.resetAnimation();
        });

        document.getElementById('clearTrajectoriesBtn').addEventListener('click', () => {
            this.clearTrajectories();
        });

        // 添加轨迹
        document.getElementById('addTrajectoryBtn').addEventListener('click', () => {
            this.addTrajectory();
        });

        // 时间控制
        document.getElementById('timeSpanSlider').addEventListener('input', (e) => {
            this.timeSpan = parseInt(e.target.value);
            document.getElementById('timeSpanValue').textContent = this.timeSpan;
        });

        document.getElementById('speedNonlinearSlider').addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            document.getElementById('speedNonlinearValue').textContent = this.animationSpeed;
        });

        // Canvas点击事件
        if (this.canvas) {
            this.canvas.addEventListener('click', (e) => {
                this.handleCanvasClick(e);
            });
        }

        // Enter键快捷键
        ['initialXNonlinear', 'initialYNonlinear'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addTrajectory();
                }
            });
        });
    }

    setupCanvas() {
        this.canvas = document.getElementById('nonlinearTrajectoryCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');

            // 设置canvas显示尺寸
            this.canvas.style.width = this.canvasWidth + 'px';
            this.canvas.style.height = this.canvasHeight + 'px';

            // 获取设备像素比
            const dpr = window.devicePixelRatio || 1;

            // 设置实际像素尺寸
            this.canvas.width = this.canvasWidth * dpr;
            this.canvas.height = this.canvasHeight * dpr;

            // 缩放上下文以匹配设备像素比
            this.ctx.scale(dpr, dpr);

            this.centerX = this.canvasWidth / 2;
            this.centerY = this.canvasHeight / 2;
            this.scale = Math.min(this.canvasWidth, this.canvasHeight) / (2 * this.viewRange);

            this.drawGrid();
        }
    }

    insertFunction(func) {
        if (!this.focusedInput) {
            this.focusedInput = document.getElementById('dxdtInput');
        }

        const start = this.focusedInput.selectionStart;
        const end = this.focusedInput.selectionEnd;
        const text = this.focusedInput.value;

        let insertText = func;
        let cursorOffset = func.length;

        // 处理特殊函数
        if (['sin', 'cos', 'tan', 'exp', 'log', 'sqrt', 'abs'].includes(func)) {
            insertText = func + '()';
            cursorOffset = func.length + 1; // 光标放在括号内
        } else if (func === '^2') {
            insertText = '^2';
        } else if (func === '^3') {
            insertText = '^3';
        } else if (func === 'pi') {
            insertText = 'pi';
        } else if (func === 'e') {
            insertText = 'e';
        }

        this.focusedInput.value = text.substring(0, start) + insertText + text.substring(end);
        this.focusedInput.focus();
        this.focusedInput.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }

    showLoading(show = true) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    async analyzeSystem() {
        const dxdt = document.getElementById('dxdtInput').value.trim();
        const dydt = document.getElementById('dydtInput').value.trim();

        if (!dxdt || !dydt) {
            alert('请输入完整的微分方程');
            return;
        }

        this.showLoading(true);

        try {
            // 分析系统
            const response = await fetch('/api/analyze_nonlinear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dx_dt: dxdt,
                    dy_dt: dydt
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentEquations = data.equations;
                this.displaySystemInfo(data);
                document.getElementById('nonlinearResultsSection').style.display = 'block';
                
                // 生成相图
                await this.generatePhasePortrait();
                
                // 清空轨迹并重新初始化画布
                this.clearTrajectories();
            } else {
                alert('分析失败: ' + data.error);
            }
        } catch (error) {
            alert('请求失败: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    displaySystemInfo(data) {
        // 显示平衡点
        const equilibriumDiv = document.getElementById('equilibriumPoints');
        if (data.equilibrium_points && data.equilibrium_points.length > 0) {
            let html = '<ul class="equilibrium-list">';
            data.equilibrium_points.forEach(ep => {
                const typeClass = ep.type.includes('稳定') ? 'eq-type-stable' :
                                  ep.type.includes('不稳定') ? 'eq-type-unstable' :
                                  'eq-type-neutral';
                html += `<li class="eq-item">
                    <span class="eq-point">${ep.formatted}</span>
                    <span class="eq-separator">-</span>
                    <span class="eq-type ${typeClass}">${ep.type}</span>
                </li>`;
            });
            html += '</ul>';
            equilibriumDiv.innerHTML = html;
        } else {
            equilibriumDiv.innerHTML = '未找到平衡点';
        }

        // 显示系统类型
        const systemTypeDiv = document.getElementById('systemTypeNonlinear');
        systemTypeDiv.innerHTML = '非线性系统';
    }

    async generatePhasePortrait() {
        if (!this.currentEquations) return;

        const portraitContainer = document.getElementById('nonlinearPortraitContainer');
        portraitContainer.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <p>正在生成相图...</p>
            </div>
        `;

        try {
            const response = await fetch('/api/generate_nonlinear_portrait', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dx_dt: this.currentEquations.dx_dt,
                    dy_dt: this.currentEquations.dy_dt,
                    view_range: this.viewRange,
                    grid_size: this.gridDensity
                })
            });

            const data = await response.json();

            if (data.success) {
                portraitContainer.innerHTML = `<img src="data:image/png;base64,${data.image}" alt="相图">`;
            } else {
                portraitContainer.innerHTML = `<div class="error">生成相图失败: ${data.error}</div>`;
            }
        } catch (error) {
            portraitContainer.innerHTML = `<div class="error">请求失败: ${error.message}</div>`;
        }
    }

    handleCanvasClick(event) {
        if (!this.currentEquations) {
            alert('请先分析系统');
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 转换为数学坐标
        const mathX = (x - this.centerX) / this.scale;
        const mathY = -(y - this.centerY) / this.scale;

        // 添加轨迹
        document.getElementById('initialXNonlinear').value = mathX.toFixed(2);
        document.getElementById('initialYNonlinear').value = mathY.toFixed(2);
        this.addTrajectory();
    }

    async addTrajectory() {
        if (!this.currentEquations) {
            alert('请先分析系统');
            return;
        }

        const x0 = parseFloat(document.getElementById('initialXNonlinear').value);
        const y0 = parseFloat(document.getElementById('initialYNonlinear').value);

        if (isNaN(x0) || isNaN(y0)) {
            alert('请输入有效的初始点坐标');
            return;
        }

        try {
            const response = await fetch('/api/compute_nonlinear_trajectory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    dx_dt: this.currentEquations.dx_dt,
                    dy_dt: this.currentEquations.dy_dt,
                    initial_point: [x0, y0],
                    t_span: [0, this.timeSpan]
                })
            });

            const data = await response.json();

            if (data.success) {
                const color = this.trajectoryColors[this.trajectories.length % this.trajectoryColors.length];
                const trajectory = {
                    ...data.trajectory,
                    color: color,
                    id: Date.now(),
                    currentIndex: 0
                };
                
                this.trajectories.push(trajectory);
                this.updateTrajectoryList();
                this.redrawCanvas();
            } else {
                alert('计算轨迹失败: ' + data.error);
            }
        } catch (error) {
            alert('请求失败: ' + error.message);
        }
    }

    updateTrajectoryList() {
        const listDiv = document.getElementById('nonlinearTrajectoryList');
        
        if (this.trajectories.length === 0) {
            listDiv.innerHTML = '<p class="no-trajectories">点击画布或使用"添加轨迹"按钮开始</p>';
            return;
        }

        let html = '';
        this.trajectories.forEach((traj, index) => {
            html += `
                <div class="trajectory-item" style="border-left: 3px solid ${traj.color}">
                    <span>轨迹 ${index + 1}: (${traj.initial_point[0].toFixed(2)}, ${traj.initial_point[1].toFixed(2)})</span>
                    <button onclick="nonlinearAnalyzer.removeTrajectory(${traj.id})" class="remove-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });
        listDiv.innerHTML = html;
    }

    removeTrajectory(id) {
        this.trajectories = this.trajectories.filter(t => t.id !== id);
        this.updateTrajectoryList();
        this.redrawCanvas();
    }

    clearTrajectories() {
        this.trajectories = [];
        this.updateTrajectoryList();
        this.redrawCanvas();
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 背景
        this.ctx.fillStyle = '#1C1C1C';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // 网格线
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        
        // 垂直线
        for (let x = -this.viewRange; x <= this.viewRange; x++) {
            const pixelX = this.centerX + x * this.scale;
            this.ctx.beginPath();
            this.ctx.moveTo(pixelX, 0);
            this.ctx.lineTo(pixelX, this.canvasHeight);
            this.ctx.stroke();
        }
        
        // 水平线
        for (let y = -this.viewRange; y <= this.viewRange; y++) {
            const pixelY = this.centerY - y * this.scale;
            this.ctx.beginPath();
            this.ctx.moveTo(0, pixelY);
            this.ctx.lineTo(this.canvasWidth, pixelY);
            this.ctx.stroke();
        }
        
        // 坐标轴
        this.ctx.strokeStyle = '#666';
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
    }

    redrawCanvas() {
        this.drawGrid();
        
        // 绘制所有轨迹
        this.trajectories.forEach(trajectory => {
            this.drawTrajectory(trajectory, trajectory.currentIndex);
        });
    }

    drawTrajectory(trajectory, endIndex) {
        if (!trajectory.x || trajectory.x.length < 2) return;
        
        this.ctx.strokeStyle = trajectory.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        const maxIndex = Math.min(endIndex, trajectory.x.length - 1);
        
        for (let i = 0; i <= maxIndex; i++) {
            const x = this.centerX + trajectory.x[i] * this.scale;
            const y = this.centerY - trajectory.y[i] * this.scale;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        
        // 绘制当前点
        if (endIndex > 0 && endIndex < trajectory.x.length) {
            const currentX = this.centerX + trajectory.x[endIndex] * this.scale;
            const currentY = this.centerY - trajectory.y[endIndex] * this.scale;
            
            this.ctx.fillStyle = trajectory.color;
            this.ctx.beginPath();
            this.ctx.arc(currentX, currentY, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        }
        
        // 绘制起点
        const startX = this.centerX + trajectory.x[0] * this.scale;
        const startY = this.centerY - trajectory.y[0] * this.scale;
        
        this.ctx.fillStyle = 'white';
        this.ctx.strokeStyle = trajectory.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(startX, startY, 5, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
    }

    startAnimation() {
        if (this.trajectories.length === 0) {
            alert('请先添加轨迹');
            return;
        }
        
        if (!this.isPlaying) {
            this.isPlaying = true;
            document.getElementById('playNonlinearBtn').disabled = true;
            document.getElementById('pauseNonlinearBtn').disabled = false;
            this.animate();
        }
    }

    pauseAnimation() {
        this.isPlaying = false;
        document.getElementById('playNonlinearBtn').disabled = false;
        document.getElementById('pauseNonlinearBtn').disabled = true;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    resetAnimation() {
        this.pauseAnimation();
        this.trajectories.forEach(trajectory => {
            trajectory.currentIndex = 0;
        });
        this.currentTime = 0;
        this.redrawCanvas();
    }

    animate() {
        if (!this.isPlaying) return;
        
        // 更新所有轨迹的当前索引
        const step = this.animationSpeed;
        let allComplete = true;
        
        this.trajectories.forEach(trajectory => {
            if (trajectory.currentIndex < trajectory.x.length - 1) {
                trajectory.currentIndex = Math.min(
                    trajectory.currentIndex + step,
                    trajectory.x.length - 1
                );
                allComplete = false;
            }
        });
        
        // 重绘
        this.redrawCanvas();
        
        // 继续动画或停止
        if (allComplete) {
            this.pauseAnimation();
        } else {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }
}

// 初始化
let nonlinearAnalyzer;
(function() {
    function init() {
        nonlinearAnalyzer = new NonlinearSystemAnalyzer();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM已经加载完成,直接初始化
        init();
    }
})();