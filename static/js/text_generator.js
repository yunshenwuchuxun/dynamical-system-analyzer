// 智能相图生成器JavaScript
class TextToPhasePortraitGenerator {
    constructor() {
        this.currentMatrix = null;
        this.trajectories = [];
        this.animationId = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.animationSpeed = 5;
        this.timeSpan = 10;
        this.canvas = null;
        this.ctx = null;
        this.canvasWidth = 500;
        this.canvasHeight = 400;
        this.centerX = 250;
        this.centerY = 200;
        this.scale = 50; // 像素每单位
        this.canvasInitialized = false; // 防止重复初始化

        this.initializeEventListeners();
        this.setupCanvas();
        this.trajectoryColors = [
            '#FF3E82', '#00D4FF', '#7B68EE', '#00FF87', '#FFB347',
            '#FF6B9D', '#40E0D0', '#DA70D6', '#32CD32', '#FFA500'
        ];
    }

    initializeEventListeners() {
        // 示例按钮点击 (支持新旧两种类名)
        document.querySelectorAll('.example-btn, .example-btn-compact').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.getAttribute('data-text');
                document.getElementById('descriptionInput').value = text;
            });
        });

        // 生成按钮
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateFromText();
        });

        // 测试按钮 (可选，如果存在才绑定)
        const testBtn = document.getElementById('testBtn');
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.runTest('harmonic');
            });
        }

        const testSpiralBtn = document.getElementById('testSpiralBtn');
        if (testSpiralBtn) {
            testSpiralBtn.addEventListener('click', () => {
                this.runTest('spiral');
            });
        }

        const testSaddleBtn = document.getElementById('testSaddleBtn');
        if (testSaddleBtn) {
            testSaddleBtn.addEventListener('click', () => {
                this.runTest('saddle');
            });
        }

        const testUnstableBtn = document.getElementById('testUnstableBtn');
        if (testUnstableBtn) {
            testUnstableBtn.addEventListener('click', () => {
                this.runTest('unstable');
            });
        }

        const testTiltedEllipticalBtn = document.getElementById('testTiltedEllipticalBtn');
        if (testTiltedEllipticalBtn) {
            testTiltedEllipticalBtn.addEventListener('click', () => {
                this.runTest('tilted_elliptical');
            });
        }

        // 动画控制按钮
        document.getElementById('playBtn').addEventListener('click', () => {
            this.startAnimation();
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pauseAnimation();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetAnimation();
        });

        document.getElementById('generatePointsBtn').addEventListener('click', () => {
            this.generateInitialPoints();
        });

        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAll();
        });

        // 速度控制
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = this.animationSpeed;
        });

        // 操作按钮
        document.getElementById('regenerateBtn').addEventListener('click', () => {
            this.generateFromText();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportResults();
        });

        document.getElementById('shareBtn').addEventListener('click', () => {
            this.shareResults();
        });

        // 矩阵编辑功能
        document.getElementById('editMatrixBtn').addEventListener('click', () => {
            this.enterEditMode();
        });

        document.getElementById('saveMatrixBtn').addEventListener('click', () => {
            this.saveMatrixEdit();
        });

        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            this.exitEditMode();
        });

        document.getElementById('randomizeBtn').addEventListener('click', () => {
            this.randomizeMatrix();
        });

        // 手动添加初始点
        document.getElementById('addManualPointBtn').addEventListener('click', () => {
            this.addManualPoint();
        });

        // Enter键添加点
        ['manualX', 'manualY'].forEach(id => {
            document.getElementById(id).addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addManualPoint();
                }
            });
        });
    }

    setupCanvas() {
        this.canvas = document.getElementById('trajectoryCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');

            // 固定canvas尺寸，避免重复扩大
            this.canvasWidth = 500;
            this.canvasHeight = 400;

            // 只在初始化时设置canvas尺寸，避免重复设置
            if (!this.canvasInitialized) {
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

                this.canvasInitialized = true;
                console.log(`Canvas initialized: ${this.canvasWidth}x${this.canvasHeight}, dpr: ${dpr}`);
            }

            // 更新中心点和缩放
            this.centerX = this.canvasWidth / 2;
            this.centerY = this.canvasHeight / 2;
            this.scale = Math.min(this.canvasWidth, this.canvasHeight) / 10;

            this.drawGrid();
        } else {
            console.error('Canvas element not found!');
        }
    }

    showLoading(text = '正在分析您的描述...') {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    async generateFromText() {
        const description = document.getElementById('descriptionInput').value.trim();
        
        if (!description) {
            alert('请输入相图描述');
            return;
        }

        this.showLoading('正在分析您的描述...');

        try {
            // 调用后端API生成矩阵
            const response = await fetch('/api/text_to_matrix', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: description
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentMatrix = data.matrix;
                this.displayGeneratedMatrix(data.matrix, data.explanation);
                
                // 生成相图
                this.showLoading('正在生成相图...');
                await this.generatePhasePortrait();
                
                // 生成初始轨迹点
                this.showLoading('正在生成初始轨迹...');
                await this.generateInitialPoints();
                
                // 显示结果区域
                this.showVisualizationSection();
            } else {
                alert('生成失败: ' + data.error);
            }
        } catch (error) {
            alert('网络错误: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    displayGeneratedMatrix(matrix, explanation) {
        // 显示矩阵
        const matrixElements = document.querySelectorAll('#matrixDisplay .matrix-element');
        matrixElements[0].textContent = matrix[0][0].toFixed(2);
        matrixElements[1].textContent = matrix[0][1].toFixed(2);
        matrixElements[2].textContent = matrix[1][0].toFixed(2);
        matrixElements[3].textContent = matrix[1][1].toFixed(2);

        // 显示解释
        document.getElementById('matrixDescription').innerHTML = `
            <div class="explanation">
                <h4><i class="fas fa-lightbulb"></i> 系统解释：</h4>
                <p>${explanation}</p>
            </div>
        `;

        // 显示矩阵区域
        document.getElementById('generatedMatrixSection').style.display = 'block';
    }

    async generatePhasePortrait() {
        try {
            const response = await fetch('/api/generate_phase_portrait', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    matrix: this.currentMatrix,
                    x_range: [-3, 3],
                    y_range: [-3, 3],
                    grid_size: 20
                })
            });

            const data = await response.json();

            if (data.success) {
                this.displayPhasePortrait(data.image);
                await this.updateSystemInfo();
            } else {
                console.error('生成相图失败:', data.error);
            }
        } catch (error) {
            console.error('生成相图错误:', error);
        }
    }

    displayPhasePortrait(imageBase64) {
        const container = document.getElementById('portraitContainer');
        // 固定图像显示尺寸，防止累积变大
        container.innerHTML = `<img src="data:image/png;base64,${imageBase64}" alt="相图" style="width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto;">`;
    }

    async updateSystemInfo() {
        try {
            const response = await fetch('/api/analyze_system', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    matrix: this.currentMatrix
                })
            });

            const data = await response.json();

            if (data.success) {
                const systemInfo = this.analyzeSystemType(data.eigenvalues);

                // 显示特征值
                const eigenvaluesText = data.eigenvalues.map(ev => ev.formatted).join(', ');
                document.getElementById('eigenvaluesInfo').textContent = eigenvaluesText;

                // 显示系统类型和稳定性
                document.getElementById('systemTypeInfo').textContent = systemInfo.type;
                document.getElementById('stabilityInfo').textContent = systemInfo.stability;

                // 显示信息面板
                document.getElementById('systemInfo').style.display = 'block';
            }
        } catch (error) {
            console.error('更新系统信息失败:', error);
        }
    }

    analyzeSystemType(eigenvalues) {
        const ev1 = eigenvalues[0];
        const ev2 = eigenvalues[1];

        // 判断特征值类型
        const hasComplexEigenvalues = ev1.imag !== 0 || ev2.imag !== 0;
        const realParts = [ev1.real, ev2.real];
        const maxReal = Math.max(...realParts);
        const minReal = Math.min(...realParts);

        let type, stability;

        if (hasComplexEigenvalues) {
            if (Math.abs(ev1.real) < 1e-10) {
                type = '中心点';
                stability = '中性稳定';
            } else if (ev1.real < 0) {
                type = '稳定焦点/螺旋点';
                stability = '渐近稳定';
            } else {
                type = '不稳定焦点/螺旋点';
                stability = '不稳定';
            }
        } else {
            // 实特征值
            if (maxReal < 0) {
                type = '稳定节点';
                stability = '渐近稳定';
            } else if (minReal > 0) {
                type = '不稳定节点';
                stability = '不稳定';
            } else {
                type = '鞍点';
                stability = '不稳定';
            }
        }

        return { type, stability };
    }

    async generateInitialPoints() {
        if (!this.currentMatrix) {
            alert('请先生成矩阵');
            return;
        }

        this.showLoading('正在生成智能初始点...');

        try {
            // 清空现有轨迹
            this.trajectories = [];
            console.log('Cleared existing trajectories');

            // 根据系统类型生成合适的初始点
            const initialPoints = this.generateSmartInitialPoints();
            console.log('Generated initial points:', initialPoints);

            let successCount = 0;
            let totalPoints = initialPoints.length;

            for (let point of initialPoints) {
                console.log(`Processing point ${successCount + 1}/${totalPoints}: (${point[0]}, ${point[1]})`);
                const success = await this.addTrajectory(point[0], point[1]);
                if (success) {
                    successCount++;
                    console.log(`Successfully added trajectory ${successCount}`);
                } else {
                    console.warn(`Failed to add trajectory for point (${point[0]}, ${point[1]})`);
                }
            }

            console.log(`Total trajectories generated: ${successCount}/${totalPoints}`);

            if (successCount === 0) {
                alert('无法生成轨迹。请检查矩阵设置或刷新页面重试。');
                return;
            }

            this.updateTrajectoryList();
            
            // 确保canvas和context正确设置
            if (!this.ctx || !this.canvas) {
                console.log('Reinitializing canvas...');
                this.setupCanvas();
            }
            
            console.log(`Generated ${this.trajectories.length} trajectories, starting redraw`);
            this.redraw();

            // 显示成功消息
            if (successCount < totalPoints) {
                alert(`生成了 ${successCount}/${totalPoints} 条轨迹。部分轨迹可能因为系统不稳定而无法完整计算。`);
            }

        } catch (error) {
            console.error('生成初始点失败:', error);
            alert('生成初始点失败: ' + error.message + '\n请查看浏览器控制台了解详细信息。');
        } finally {
            this.hideLoading();
        }
    }

    generateSmartInitialPoints() {
        // 根据矩阵特征值生成智能初始点
        const points = [];
        
        // 分析矩阵类型，生成更智能的初始点
        const det = this.currentMatrix[0][0] * this.currentMatrix[1][1] - 
                   this.currentMatrix[0][1] * this.currentMatrix[1][0];
        const trace = this.currentMatrix[0][0] + this.currentMatrix[1][1];
        
        if (det > 0 && trace < 0) {
            // 稳定焦点或节点 - 从外围开始
            points.push([2, 1], [-1, 2], [-2, -1], [1, -2]);
            points.push([1.5, 0], [0, 1.5], [-1.5, 0], [0, -1.5]);
        } else if (det > 0 && trace > 0) {
            // 不稳定焦点或节点 - 从内部开始
            points.push([0.5, 0.3], [-0.3, 0.5], [-0.5, -0.3], [0.3, -0.5]);
            points.push([0.8, 0], [0, 0.8], [-0.8, 0], [0, -0.8]);
        } else if (det < 0) {
            // 鞍点 - 沿特征方向
            points.push([1, 0.5], [-1, -0.5], [0.5, 1], [-0.5, -1]);
            points.push([2, 0], [0, 2], [-2, 0], [0, -2]);
        } else {
            // 其他情况 - 默认分布
            points.push([1.5, 1], [-1, 1.5], [-1.5, -1], [1, -1.5]);
            points.push([2, 0], [0, 2], [-2, 0], [0, -2]);
        }

        return points;
    }

    async addTrajectory(x0, y0) {
        console.log(`Attempting to add trajectory for point (${x0}, ${y0})`);
        
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

            console.log('Response status:', response.status);

            if (!response.ok) {
                console.error('HTTP error:', response.status, response.statusText);
                // 如果API失败，生成模拟轨迹
                return this.generateLocalTrajectory(x0, y0);
            }

            const data = await response.json();
            console.log('API response:', data);

            if (data.success && data.trajectory) {
                const trajectory = {
                    ...data.trajectory,
                    color: this.trajectoryColors[this.trajectories.length % this.trajectoryColors.length],
                    id: Date.now() + Math.random(),
                    visible: true
                };

                this.trajectories.push(trajectory);
                console.log(`Added trajectory with ${trajectory.x.length} points, color: ${trajectory.color}`);
                return true;
            } else {
                console.error('Server returned error:', data.error || 'Unknown error');
                // 如果服务器返回错误，生成模拟轨迹
                return this.generateLocalTrajectory(x0, y0);
            }
        } catch (error) {
            console.error('计算轨迹失败:', error);
            console.log('Generating local trajectory as fallback...');
            // 网络错误时，生成本地模拟轨迹
            return this.generateLocalTrajectory(x0, y0);
        }
    }

    generateLocalTrajectory(x0, y0) {
        console.log(`Generating local trajectory for (${x0}, ${y0})`);
        
        try {
            const numPoints = 200;
            const dt = this.timeSpan / numPoints;
            
            const trajectory = {
                x: [x0],
                y: [y0],
                time: [0],
                initial_point: [x0, y0],
                color: this.trajectoryColors[this.trajectories.length % this.trajectoryColors.length],
                id: Date.now() + Math.random(),
                visible: true
            };

            // 使用欧拉方法数值积分
            let x = x0, y = y0;
            for (let i = 1; i < numPoints; i++) {
                const t = i * dt;
                
                // 计算导数 dx/dt = Ax
                const dx_dt = this.currentMatrix[0][0] * x + this.currentMatrix[0][1] * y;
                const dy_dt = this.currentMatrix[1][0] * x + this.currentMatrix[1][1] * y;
                
                // 欧拉步长
                x += dx_dt * dt;
                y += dy_dt * dt;
                
                trajectory.x.push(x);
                trajectory.y.push(y);
                trajectory.time.push(t);
                
                // 防止轨迹发散到无限大
                if (Math.abs(x) > 100 || Math.abs(y) > 100) {
                    console.log(`Trajectory diverged at t=${t}, stopping calculation`);
                    break;
                }
            }

            this.trajectories.push(trajectory);
            console.log(`Generated local trajectory with ${trajectory.x.length} points, color: ${trajectory.color}`);
            return true;
            
        } catch (error) {
            console.error('Local trajectory generation failed:', error);
            return false;
        }
    }

    updateTrajectoryList() {
        const container = document.getElementById('trajectoryList');

        if (this.trajectories.length === 0) {
            container.innerHTML = '<p class="no-trajectories">暂无轨迹，点击"智能生成"开始</p>';
            return;
        }

        let html = '';
        this.trajectories.forEach((traj, index) => {
            html += `
                <div class="trajectory-item-compact" style="border-left: 4px solid ${traj.color}">
                    <div class="trajectory-info">
                        <span class="trajectory-label">轨迹 ${index + 1}</span>
                        <span class="trajectory-coords">(${traj.initial_point[0].toFixed(1)}, ${traj.initial_point[1].toFixed(1)})</span>
                        <span class="trajectory-points">${traj.x.length} 点</span>
                    </div>
                    <div class="trajectory-controls">
                        <button class="trajectory-btn visibility-btn ${traj.visible ? 'visible' : 'hidden'}" 
                                onclick="textGenerator.toggleTrajectoryVisibility('${traj.id}')"
                                title="${traj.visible ? '隐藏轨迹' : '显示轨迹'}">
                            <i class="fas ${traj.visible ? 'fa-eye' : 'fa-eye-slash'}"></i>
                        </button>
                        <button class="trajectory-btn delete-btn" 
                                onclick="textGenerator.removeTrajectory('${traj.id}')"
                                title="删除轨迹">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    toggleTrajectoryVisibility(id) {
        // 支持字符串和数字类型ID的匹配
        const trajectory = this.trajectories.find(t => String(t.id) === String(id));
        if (trajectory) {
            trajectory.visible = !trajectory.visible;
            console.log(`Toggled trajectory ${id} visibility: ${trajectory.visible}`);

            this.updateTrajectoryList();
            this.redraw();
        } else {
            console.warn(`Trajectory with id ${id} not found`);
        }
    }

    removeTrajectory(id) {
        // 支持字符串和数字类型ID的匹配
        const trajectory = this.trajectories.find(t => String(t.id) === String(id));
        if (trajectory) {
            this.trajectories = this.trajectories.filter(t => String(t.id) !== String(id));
            console.log(`Removed trajectory ${id}: (${trajectory.initial_point[0]}, ${trajectory.initial_point[1]})`);

            this.updateTrajectoryList();
            this.redraw();

            // 如果删除后没有轨迹了，停止动画
            if (this.trajectories.length === 0) {
                this.pauseAnimation();
                this.resetAnimation();
            }
        } else {
            console.warn(`Trajectory with id ${id} not found`);
        }
    }

    showVisualizationSection() {
        document.getElementById('visualizationSection').style.display = 'block';
        document.getElementById('actionButtons').style.display = 'flex';

        // 如果canvas还没有初始化，则初始化一次
        if (!this.canvasInitialized || !this.canvas || !this.ctx) {
            console.log('Initializing canvas for visualization...');
            this.setupCanvas();
        } else {
            console.log('Canvas already initialized, only redrawing...');
            this.redraw();
        }
    }

    // 动画控制方法
    startAnimation() {
        if (this.trajectories.length === 0) {
            alert('请先生成轨迹');
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

    // Canvas绘制方法
    worldToCanvas(x, y) {
        return {
            x: this.centerX + x * this.scale,
            y: this.centerY - y * this.scale // Y轴翻转
        };
    }

    drawGrid() {
        if (!this.ctx) return;

        // 清除画布
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // 绘制网格线
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;

        for (let i = -5; i <= 5; i++) {
            if (i === 0) continue;

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
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawTrajectories() {
        if (!this.ctx) {
            console.error('Canvas context is null!');
            return;
        }

        if (this.trajectories.length === 0) {
            console.log('No trajectories to draw');
            return;
        }

        console.log(`Drawing ${this.trajectories.length} trajectories`);

        this.trajectories.forEach((trajectory, index) => {
            if (!trajectory || !trajectory.x || !trajectory.y) {
                console.warn(`Trajectory ${index} is invalid:`, trajectory);
                return;
            }

            if (trajectory.visible !== undefined && !trajectory.visible) {
                return;
            }

            console.log(`Drawing trajectory ${index}: ${trajectory.x.length} points, color: ${trajectory.color}`);

            // 绘制完整轨迹（淡色）
            this.ctx.globalAlpha = 0.4;
            this.ctx.strokeStyle = trajectory.color || '#FF3E82';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();

            let validPoints = 0;
            for (let i = 0; i < trajectory.x.length; i++) {
                const pos = this.worldToCanvas(trajectory.x[i], trajectory.y[i]);
                
                // 检查坐标是否有效
                if (isNaN(pos.x) || isNaN(pos.y)) {
                    continue;
                }

                if (validPoints === 0) {
                    this.ctx.moveTo(pos.x, pos.y);
                } else {
                    this.ctx.lineTo(pos.x, pos.y);
                }
                validPoints++;
            }
            
            if (validPoints > 1) {
                this.ctx.stroke();
            }

            // 绘制动画轨迹（实色）
            this.ctx.globalAlpha = 1.0;
            const maxIndex = Math.floor((this.currentTime / this.timeSpan) * (trajectory.x.length - 1));

            if (maxIndex > 0) {
                this.ctx.strokeStyle = trajectory.color || '#FF3E82';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();

                validPoints = 0;
                for (let i = 0; i <= maxIndex; i++) {
                    const pos = this.worldToCanvas(trajectory.x[i], trajectory.y[i]);
                    
                    if (isNaN(pos.x) || isNaN(pos.y)) {
                        continue;
                    }

                    if (validPoints === 0) {
                        this.ctx.moveTo(pos.x, pos.y);
                    } else {
                        this.ctx.lineTo(pos.x, pos.y);
                    }
                    validPoints++;
                }
                
                if (validPoints > 1) {
                    this.ctx.stroke();
                }

                // 绘制当前点
                if (maxIndex < trajectory.x.length && 
                    !isNaN(trajectory.x[maxIndex]) && !isNaN(trajectory.y[maxIndex])) {
                    
                    const currentPos = this.worldToCanvas(
                        trajectory.x[maxIndex],
                        trajectory.y[maxIndex]
                    );

                    if (!isNaN(currentPos.x) && !isNaN(currentPos.y)) {
                        this.ctx.fillStyle = trajectory.color || '#FF3E82';
                        this.ctx.beginPath();
                        this.ctx.arc(currentPos.x, currentPos.y, 8, 0, Math.PI * 2);
                        this.ctx.fill();

                        // 添加白色边框
                        this.ctx.strokeStyle = '#fff';
                        this.ctx.lineWidth = 2;
                        this.ctx.stroke();

                        // 更新当前点信息（只显示第一条轨迹的）
                        if (index === 0) {
                            this.updateCurrentPointInfo(
                                trajectory.x[maxIndex],
                                trajectory.y[maxIndex],
                                this.currentTime
                            );
                        }
                    }
                }
            }

            // 绘制初始点
            if (trajectory.initial_point && trajectory.initial_point.length >= 2) {
                const initialPos = this.worldToCanvas(
                    trajectory.initial_point[0],
                    trajectory.initial_point[1]
                );

                if (!isNaN(initialPos.x) && !isNaN(initialPos.y)) {
                    this.ctx.fillStyle = trajectory.color || '#FF3E82';
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(initialPos.x, initialPos.y, 6, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                }
            }
        });

        // 重置透明度
        this.ctx.globalAlpha = 1.0;
    }

    updateCurrentPointInfo(x, y, t) {
        document.getElementById('currentCoords').textContent = `(${x.toFixed(3)}, ${y.toFixed(3)})`;
        document.getElementById('currentTime').textContent = t.toFixed(2);
    }

    redraw() {
        if (!this.ctx) {
            console.error('Cannot redraw: context is null, initializing canvas...');
            this.setupCanvas();
            if (!this.ctx) {
                console.error('Failed to initialize canvas context');
                return;
            }
        }

        console.log('Redrawing canvas...');
        try {
            this.drawGrid();
            this.drawTrajectories();
            console.log('Canvas redraw completed');
        } catch (error) {
            console.error('Error during redraw:', error);
        }
    }

    // 导出和分享功能
    exportResults() {
        const results = {
            description: document.getElementById('descriptionInput').value,
            matrix: this.currentMatrix,
            trajectories: this.trajectories.map(t => ({
                initial_point: t.initial_point,
                color: t.color
            }))
        };

        const dataStr = JSON.stringify(results, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'phase_portrait_results.json';
        link.click();
    }

    shareResults() {
        const description = document.getElementById('descriptionInput').value;
        const matrix = this.currentMatrix;
        
        const shareData = {
            title: '动力学系统相图分析结果',
            text: `描述: ${description}\n矩阵: [${matrix[0]}, ${matrix[1]}]`,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // 回退到复制到剪贴板
            navigator.clipboard.writeText(shareData.text).then(() => {
                alert('结果已复制到剪贴板');
            });
        }
    }

    // 矩阵编辑功能
    enterEditMode() {
        if (!this.currentMatrix) {
            alert('请先生成矩阵');
            return;
        }

        // 显示编辑模式，隐藏显示模式
        document.getElementById('matrixDisplayMode').style.display = 'none';
        document.getElementById('matrixEditMode').style.display = 'block';

        // 填充当前矩阵值到编辑框
        document.getElementById('editA11').value = this.currentMatrix[0][0].toFixed(3);
        document.getElementById('editA12').value = this.currentMatrix[0][1].toFixed(3);
        document.getElementById('editA21').value = this.currentMatrix[1][0].toFixed(3);
        document.getElementById('editA22').value = this.currentMatrix[1][1].toFixed(3);

        // 切换按钮显示
        document.getElementById('editMatrixBtn').style.display = 'none';
        document.getElementById('saveMatrixBtn').style.display = 'flex';
        document.getElementById('cancelEditBtn').style.display = 'flex';
        document.getElementById('randomizeBtn').style.display = 'none';
    }

    async saveMatrixEdit() {
        try {
            // 获取编辑的值
            const newMatrix = [
                [parseFloat(document.getElementById('editA11').value) || 0,
                 parseFloat(document.getElementById('editA12').value) || 0],
                [parseFloat(document.getElementById('editA21').value) || 0,
                 parseFloat(document.getElementById('editA22').value) || 0]
            ];

            // 更新当前矩阵
            this.currentMatrix = newMatrix;

            // 更新显示
            this.displayGeneratedMatrix(newMatrix, '用户手动编辑的矩阵');

            // 退出编辑模式
            this.exitEditMode();

            // 重新生成相图和轨迹
            this.showLoading('正在更新相图...');
            await this.generatePhasePortrait();
            
            this.showLoading('正在更新轨迹...');
            await this.generateInitialPoints();

        } catch (error) {
            alert('保存失败: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    exitEditMode() {
        // 显示显示模式，隐藏编辑模式
        document.getElementById('matrixDisplayMode').style.display = 'block';
        document.getElementById('matrixEditMode').style.display = 'none';

        // 切换按钮显示
        document.getElementById('editMatrixBtn').style.display = 'flex';
        document.getElementById('saveMatrixBtn').style.display = 'none';
        document.getElementById('cancelEditBtn').style.display = 'none';
        document.getElementById('randomizeBtn').style.display = 'flex';
    }

    async randomizeMatrix() {
        if (!this.currentMatrix) {
            alert('请先生成矩阵');
            return;
        }

        try {
            this.showLoading('正在随机调整矩阵...');

            // 在当前矩阵基础上添加随机扰动
            const perturbation = 0.3; // 扰动强度
            const newMatrix = [
                [this.currentMatrix[0][0] + (Math.random() - 0.5) * perturbation,
                 this.currentMatrix[0][1] + (Math.random() - 0.5) * perturbation],
                [this.currentMatrix[1][0] + (Math.random() - 0.5) * perturbation,
                 this.currentMatrix[1][1] + (Math.random() - 0.5) * perturbation]
            ];

            // 更新当前矩阵
            this.currentMatrix = newMatrix;

            // 更新显示
            this.displayGeneratedMatrix(newMatrix, '基于原矩阵的随机调整版本');

            // 重新生成相图和轨迹
            await this.generatePhasePortrait();
            await this.generateInitialPoints();

        } catch (error) {
            alert('随机调整失败: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

     async runTest(testType = 'harmonic') {
         console.log(`Running test function for type: ${testType}`);
         
         try {
             this.showLoading(`正在运行${this.getTestTypeName(testType)}测试...`);
             
             // 根据测试类型设置不同的矩阵
             const testConfig = this.getTestConfiguration(testType);
             this.currentMatrix = testConfig.matrix;
             
             console.log('Test matrix set:', this.currentMatrix);
             
             // 显示矩阵
             this.displayGeneratedMatrix(this.currentMatrix, testConfig.description);
             
             // 直接生成本地轨迹，跳过API调用
             console.log('Generating test trajectories locally...');
             this.trajectories = []; // 清空轨迹
             
             // 根据系统类型使用不同的测试点
             const testPoints = testConfig.testPoints;
             
             for (let point of testPoints) {
                 console.log(`Generating local trajectory for test point (${point[0]}, ${point[1]})`);
                 const success = this.generateLocalTrajectory(point[0], point[1]);
                 console.log(`Test point (${point[0]}, ${point[1]}): ${success ? 'success' : 'failed'}`);
             }
             
             console.log(`Test completed: ${this.trajectories.length} trajectories generated`);
             
             // 显示结果
             this.showVisualizationSection();
             this.updateTrajectoryList();
             
             // 尝试生成相图（如果API可用）
             try {
                 console.log('Attempting to generate phase portrait...');
                 await this.generatePhasePortrait();
             } catch (error) {
                 console.log('Phase portrait generation failed, but continuing with trajectories:', error);
             }
             
             // 确保canvas正确设置
             setTimeout(() => {
                 if (!this.ctx) {
                     this.setupCanvas();
                 }
                 this.redraw();
                 console.log('Test visualization complete');
             }, 300);
             
             alert(`${testConfig.name}测试完成！\n生成了 ${this.trajectories.length} 条轨迹。\n${testConfig.expectedBehavior}\n点击播放按钮查看动画效果。`);
             
         } catch (error) {
             console.error('Test failed:', error);
             alert('测试失败: ' + error.message + '\n请查看浏览器控制台了解详细信息。');
         } finally {
             this.hideLoading();
         }
     }

     getTestTypeName(testType) {
         const names = {
             'harmonic': '简谐振动',
             'spiral': '稳定螺旋',
             'saddle': '鞍点',
             'unstable': '不稳定节点',
             'tilted_elliptical': '倾斜椭圆'
         };
         return names[testType] || '未知类型';
     }

     getTestConfiguration(testType) {
         const configs = {
             'harmonic': {
                 name: '简谐振动',
                 matrix: [[0, 1], [-1, 0]],
                 description: '测试矩阵：简谐振动系统 - 轨迹应该是椭圆形闭合曲线',
                 testPoints: [[1, 0], [0, 1], [-1, 0], [0, -1], [1.5, 0.5], [0.5, 1.2]],
                 expectedBehavior: '轨迹应该是椭圆形的闭合轨道，表现为周期性运动。'
             },
             'spiral': {
                 name: '稳定螺旋',
                 matrix: [[-0.5, 1], [-1, -0.5]],
                 description: '测试矩阵：稳定螺旋系统 - 轨迹应该向内螺旋收敛',
                 testPoints: [[2, 1], [-1, 2], [-2, -1], [1, -2], [1.5, 0], [0, 1.5]],
                 expectedBehavior: '轨迹应该呈螺旋状向原点收敛，最终稳定在原点。'
             },
             'tilted_elliptical': {
                 name: '倾斜椭圆',
                 matrix: [[0.3, 1.2], [-0.8, 0.3]],
                 description: '测试矩阵：倾斜椭圆系统 - 轨迹应该是倾斜的椭圆闭合曲线',
                 testPoints: [[1, 0.5], [0.8, 1], [-1, -0.5], [-0.8, -1], [1.2, 0.3], [0.5, 1.5]],
                 expectedBehavior: '轨迹应该是相对坐标轴倾斜的椭圆形闭合轨道。'
             },
             'saddle': {
                 name: '鞍点',
                 matrix: [[1, 0], [0, -1]],
                 description: '测试矩阵：鞍点系统 - 某些方向稳定，某些方向不稳定',
                 testPoints: [[1, 0.1], [-1, 0.1], [0.1, 1], [0.1, -1], [1, 1], [-1, -1]],
                 expectedBehavior: '轨迹在X方向发散，Y方向收敛，形成马鞍形状。'
             },
             'unstable': {
                 name: '不稳定节点',
                 matrix: [[1, 0], [0, 1.5]],
                 description: '测试矩阵：不稳定节点系统 - 所有轨迹向外发散',
                 testPoints: [[0.5, 0.3], [-0.3, 0.5], [-0.5, -0.3], [0.3, -0.5], [0.2, 0.2]],
                 expectedBehavior: '所有轨迹都会从原点向外发散，呈放射状分布。'
             }
         };

         return configs[testType] || configs['harmonic'];
     }

     clearAll() {
         console.log('Clearing all data...');

         // 停止动画
         this.pauseAnimation();

         // 清空轨迹
         this.trajectories = [];

         // 重置时间
         this.currentTime = 0;

         // 清空输入框
         document.getElementById('descriptionInput').value = '';
         if (document.getElementById('manualX')) {
             document.getElementById('manualX').value = '';
         }
         if (document.getElementById('manualY')) {
             document.getElementById('manualY').value = '';
         }

         // 隐藏结果区域
         document.getElementById('generatedMatrixSection').style.display = 'none';
         document.getElementById('visualizationSection').style.display = 'none';
         document.getElementById('actionButtons').style.display = 'none';

         // 重置矩阵
         this.currentMatrix = null;

         // 重置canvas初始化状态
         this.canvasInitialized = false;

         // 更新轨迹列表
         this.updateTrajectoryList();

         // 清空画布
         if (this.ctx) {
             this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
             this.drawGrid();
         }

         // 重置当前点信息
         this.updateCurrentPointInfo(0, 0, 0);

         console.log('All data cleared successfully');

         // 显示确认消息
         alert('已清除所有数据！\n您可以重新开始输入描述或选择测试矩阵。');
     }

    async addManualPoint() {
        if (!this.currentMatrix) {
            alert('请先生成矩阵');
            return;
        }

        const x = parseFloat(document.getElementById('manualX').value);
        const y = parseFloat(document.getElementById('manualY').value);

        if (isNaN(x) || isNaN(y)) {
            alert('请输入有效的坐标值');
            return;
        }

        try {
            this.showLoading('正在添加轨迹...');
            
            const success = await this.addTrajectory(x, y);
            
            if (success) {
                // 清空输入框
                document.getElementById('manualX').value = '';
                document.getElementById('manualY').value = '';
                
                this.updateTrajectoryList();
                
                // 确保canvas和context正确设置
                if (!this.ctx || !this.canvas) {
                    this.setupCanvas();
                }
                
                console.log(`Manual point added, total trajectories: ${this.trajectories.length}`);
                this.redraw();
            } else {
                alert('添加轨迹失败');
            }
        } catch (error) {
            alert('添加轨迹失败: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }
}

// 全局变量,供HTML onclick调用
let textGenerator;

// 页面加载完成后初始化
(function() {
    function init() {
        textGenerator = new TextToPhasePortraitGenerator();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
