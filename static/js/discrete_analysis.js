// Discrete Dynamical Systems Analysis
class DiscreteSystemAnalyzer {
    constructor() {
        this.currentMap = 'logistic';
        this.currentSystemType = 'nonlinear';
        this.parameters = {};
        this.dimension = 1;
        this.isLoading = false;

        this.mapConfigs = {
            // 非线性映射
            logistic: {
                name: 'Logistic映射',
                type: 'nonlinear',
                dimension: 1,
                params: {
                    r: { value: 3.8, min: 0, max: 4, step: 0.01, label: 'r (参数)' }
                },
                initialCondition: 0.5,
                description: 'x_{n+1} = r·x_n·(1-x_n)',
                features: {
                    cobweb: true,
                    bifurcation: true,
                    returnMap: true
                },
                examples: {
                    stable: { r: 2.5 },
                    chaos: { r: 3.8 },
                    period2: { r: 3.2 }
                }
            },
            henon: {
                name: 'Hénon映射',
                type: 'nonlinear',
                dimension: 2,
                params: {
                    a: { value: 1.4, min: 0.8, max: 1.4, step: 0.01, label: 'a (参数)' },
                    b: { value: 0.3, min: 0, max: 1, step: 0.01, label: 'b (参数)' }
                },
                initialCondition: [0.1, 0.1],
                description: 'x_{n+1} = 1 - a·x_n² + y_n; y_{n+1} = b·x_n',
                features: {
                    cobweb: false,
                    bifurcation: true,
                    returnMap: true
                }
            },
            tent: {
                name: 'Tent映射',
                type: 'nonlinear',
                dimension: 1,
                params: {
                    mu: { value: 2.0, min: 0, max: 2, step: 0.01, label: 'μ (参数)' }
                },
                initialCondition: 0.3,
                description: 'x_{n+1} = μ·min(x_n, 1-x_n)',
                features: {
                    cobweb: true,
                    bifurcation: true,
                    returnMap: true
                }
            },
            sine: {
                name: 'Sine映射',
                type: 'nonlinear',
                dimension: 1,
                params: {
                    r: { value: 1.0, min: 0, max: 1, step: 0.01, label: 'r (参数)' }
                },
                initialCondition: 0.5,
                description: 'x_{n+1} = r·sin(π·x_n)',
                features: {
                    cobweb: true,
                    bifurcation: true,
                    returnMap: true
                }
            },
            // 线性映射
            linear_2d: {
                name: '二维线性映射',
                type: 'linear',
                dimension: 2,
                params: {
                    a11: { value: 0.8, min: -2, max: 2, step: 0.01, label: 'a₁₁' },
                    a12: { value: 0.2, min: -2, max: 2, step: 0.01, label: 'a₁₂' },
                    a21: { value: 0.1, min: -2, max: 2, step: 0.01, label: 'a₂₁' },
                    a22: { value: 0.9, min: -2, max: 2, step: 0.01, label: 'a₂₂' }
                },
                initialCondition: [0.1, 0.1],
                description: 'x_{n+1} = A·x_n',
                features: {
                    cobweb: false,
                    bifurcation: false,  // 线性映射的分岔图意义不大
                    returnMap: true
                }
            },
            linear_1d: {
                name: '一维线性映射',
                type: 'linear',
                dimension: 1,
                params: {
                    a: { value: 0.8, min: -3, max: 3, step: 0.01, label: 'a (系数)' },
                    b: { value: 0.1, min: -2, max: 2, step: 0.01, label: 'b (常数)' }
                },
                initialCondition: 0.5,
                description: 'x_{n+1} = a·x_n + b',
                features: {
                    cobweb: true,
                    bifurcation: false,  // 线性映射的分岔图意义不大
                    returnMap: true
                }
            },
            rotation_2d: {
                name: '旋转映射',
                type: 'linear',
                dimension: 2,
                params: {
                    theta: { value: 0.3, min: 0, max: 6.28318, step: 0.01, label: 'θ (角度)' },
                    r: { value: 0.95, min: 0.1, max: 1.5, step: 0.01, label: 'r (缩放)' }
                },
                initialCondition: [1.0, 0.0],
                description: '旋转矩阵 R(θ) × 缩放',
                features: {
                    cobweb: false,
                    bifurcation: false,  // 旋转映射的分岔图意义不大
                    returnMap: true
                }
            }
        };

        this.init();
    }

    init() {
        console.log('Initializing DiscreteSystemAnalyzer...');
        this.setupEventListeners();
        this.selectMap('logistic');
        this.updateParameterInputs();
        this.setupTabs();
        console.log('Initialization complete.');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        // System type tabs
        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const systemType = tab.dataset.type;
                this.switchSystemType(systemType);
            });
        });

        // Map selection
        document.querySelectorAll('.map-card').forEach(card => {
            card.addEventListener('click', () => {
                const mapType = card.dataset.map;
                this.selectMap(mapType);
            });
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Action buttons - 修复所有按钮
        const buttons = [
            { id: 'generateTrajectoryBtn', method: 'generateTrajectory' },
            { id: 'analyzeSystemBtn', method: 'analyzeSystem' },
            { id: 'generateCobwebBtn', method: 'generateCobwebPlot' },
            { id: 'generateBifurcationBtn', method: 'generateBifurcationDiagram' },
            { id: 'generateReturnMapBtn', method: 'generateReturnMap' },
            { id: 'generatePhasePortraitBtn', method: 'generatePhasePortrait' }
        ];

        buttons.forEach(({ id, method }) => {
            const btn = document.getElementById(id);
            console.log(`Checking button ${id}:`, !!btn);

            if (btn) {
                btn.addEventListener('click', (e) => {
                    console.log(`${id} clicked, calling ${method}`);
                    e.preventDefault();
                    this[method]();
                });
                console.log(`Event listener added for ${id}`);
            } else {
                console.error(`Button ${id} not found!`);
            }
        });

        // Test buttons
        document.querySelectorAll('.test-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const testType = btn.dataset.test;
                this.runTest(testType);
            });
        });

        // Parameter change listeners
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('param-input')) {
                this.updateParameters();
            }
        });

        // Bifurcation parameter change listener
        const paramNameSelect = document.getElementById('paramName');
        if (paramNameSelect) {
            paramNameSelect.addEventListener('change', () => {
                this.updateBifurcationRangeOnParamChange();
            });
        }

        // Modal close
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.hideError();
        });

        document.getElementById('closeErrorBtn').addEventListener('click', () => {
            this.hideError();
        });

        // Educational panel toggle
        document.getElementById('toggleEducationBtn').addEventListener('click', () => {
            this.toggleEducationPanel();
        });

        // Educational tabs
        document.querySelectorAll('.edu-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.eduTab;
                this.switchEducationTab(tabName);
            });
        });

        // 配置管理按钮
        const exportBtn = document.getElementById('exportConfigBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportConfiguration();
            });
        }

        const importBtn = document.getElementById('importConfigBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                document.getElementById('configFileInput').click();
            });
        }

        const fileInput = document.getElementById('configFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        this.importConfiguration(event.target.result);
                    };
                    reader.readAsText(file);
                    // 重置文件输入，允许重复选择同一文件
                    e.target.value = '';
                }
            });
        }

        const shareBtn = document.getElementById('shareConfigBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareConfiguration();
            });
        }
    }

    toggleEducationPanel() {
        const content = document.getElementById('educationContent');
        const button = document.getElementById('toggleEducationBtn');
        const icon = button.querySelector('i');

        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.className = 'fas fa-chevron-up';
            button.innerHTML = '<i class="fas fa-chevron-up"></i> 收起学习内容';
        } else {
            content.style.display = 'none';
            icon.className = 'fas fa-chevron-down';
            button.innerHTML = '<i class="fas fa-chevron-down"></i> 展开学习内容';
        }
    }

    switchEducationTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.edu-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-edu-tab="${tabName}"]`).classList.add('active');

        // Update panels
        document.querySelectorAll('.edu-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(`${tabName}Panel`).classList.add('active');
    }

    switchSystemType(systemType) {
        this.currentSystemType = systemType;

        // Update tab appearance
        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-type="${systemType}"]`).classList.add('active');

        // Show/hide map categories with smooth transition
        document.querySelectorAll('.map-category').forEach(category => {
            category.classList.remove('active');
        });

        // Wait for fade out, then show new category
        setTimeout(() => {
            document.getElementById(`${systemType}-maps`).classList.add('active');
        }, 150);

        // Select first map of the new type
        const firstMap = document.querySelector(`#${systemType}-maps .map-card[data-map]`);
        if (firstMap) {
            this.selectMap(firstMap.dataset.map);
        }

        // Update available analysis tools based on system type
        this.updateAnalysisToolsAvailability(systemType);
    }

    updateAnalysisToolsAvailability(systemType) {
        const cobwebTab = document.querySelector('[data-tab="cobweb"]');
        const bifurcationTab = document.querySelector('[data-tab="bifurcation"]');

        if (systemType === 'linear') {
            // Linear systems have different analysis needs
            cobwebTab.style.display = 'none';
            // Switch to trajectory tab if currently on cobweb
            if (document.getElementById('cobweb-tab').classList.contains('active')) {
                this.switchTab('trajectory');
            }
        } else {
            cobwebTab.style.display = 'block';
        }
    }

    selectMap(mapType) {
        this.currentMap = mapType;
        this.dimension = this.mapConfigs[mapType].dimension;

        // Update UI
        document.querySelectorAll('.map-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-map="${mapType}"]`).classList.add('active');

        this.updateParameterInputs();
        this.updateInitialConditionInputs();
        this.updateBifurcationParams();
        this.updatePhasePortraitAvailability();
        this.updateCobwebAvailability();
        this.updateBifurcationAvailability();
        this.updateReturnMapAvailability();
    }

    updateParameterInputs() {
        const config = this.mapConfigs[this.currentMap];
        const container = document.getElementById('parameterInputs');

        container.innerHTML = '';

        Object.entries(config.params).forEach(([key, param]) => {
            const div = document.createElement('div');
            div.className = 'input-group';
            div.innerHTML = `
                <label for="${key}Input">${param.label}:</label>
                <input type="number"
                       id="${key}Input"
                       class="param-input"
                       data-param="${key}"
                       value="${param.value}"
                       min="${param.min}"
                       max="${param.max}"
                       step="${param.step}">
                <span class="param-range">[${param.min}, ${param.max}]</span>
            `;
            container.appendChild(div);
        });

        this.updateParameters();
    }

    updateInitialConditionInputs() {
        const config = this.mapConfigs[this.currentMap];
        const x0Input = document.getElementById('x0Input');
        const y0Group = document.getElementById('y0Group');

        if (config.dimension === 1) {
            x0Input.value = config.initialCondition;
            y0Group.style.display = 'none';
        } else {
            x0Input.value = config.initialCondition[0];
            document.getElementById('y0Input').value = config.initialCondition[1];
            y0Group.style.display = 'block';
        }
    }

    updateBifurcationParams() {
        const config = this.mapConfigs[this.currentMap];
        const paramSelect = document.getElementById('paramName');

        paramSelect.innerHTML = '';
        Object.keys(config.params).forEach(param => {
            const option = document.createElement('option');
            option.value = param;
            option.textContent = param;
            paramSelect.appendChild(option);
        });

        // Update range defaults
        const firstParam = Object.keys(config.params)[0];
        if (firstParam) {
            const paramConfig = config.params[firstParam];
            document.getElementById('paramMin').value = paramConfig.min;
            document.getElementById('paramMax').value = paramConfig.max;
        }
    }

    updateBifurcationRangeOnParamChange() {
        const config = this.mapConfigs[this.currentMap];
        const paramName = document.getElementById('paramName').value;

        if (config.params[paramName]) {
            const paramConfig = config.params[paramName];
            document.getElementById('paramMin').value = paramConfig.min;
            document.getElementById('paramMax').value = paramConfig.max;
        }
    }

    updatePhasePortraitAvailability() {
        const phasePortraitBtn = document.getElementById('generatePhasePortraitBtn');
        const phasePortraitTab = document.querySelector('[data-tab="phase-portrait"]');

        if (this.dimension === 2) {
            phasePortraitBtn.disabled = false;
            phasePortraitTab.style.display = 'block';
        } else {
            phasePortraitBtn.disabled = true;
            phasePortraitTab.style.display = 'none';

            // Switch to trajectory tab if currently on phase portrait
            if (document.getElementById('phase-portrait-tab').classList.contains('active')) {
                this.switchTab('trajectory');
            }
        }
    }

    updateCobwebAvailability() {
        const config = this.mapConfigs[this.currentMap];
        const cobwebBtn = document.getElementById('generateCobwebBtn');
        const cobwebTab = document.querySelector('[data-tab="cobweb"]');

        const isAvailable = config.features && config.features.cobweb;

        if (cobwebBtn) cobwebBtn.disabled = !isAvailable;
        if (cobwebTab) cobwebTab.style.display = isAvailable ? 'block' : 'none';

        // Switch to trajectory tab if currently on cobweb and it's now unavailable
        if (!isAvailable && document.getElementById('cobweb-tab') &&
            document.getElementById('cobweb-tab').classList.contains('active')) {
            this.switchTab('trajectory');
        }
    }

    updateBifurcationAvailability() {
        const config = this.mapConfigs[this.currentMap];
        const bifurcationBtn = document.getElementById('generateBifurcationBtn');
        const bifurcationTab = document.querySelector('[data-tab="bifurcation"]');

        const isAvailable = config.features && config.features.bifurcation;

        if (bifurcationBtn) bifurcationBtn.disabled = !isAvailable;
        if (bifurcationTab) bifurcationTab.style.display = isAvailable ? 'block' : 'none';

        // Switch to trajectory tab if currently on bifurcation and it's now unavailable
        if (!isAvailable && document.getElementById('bifurcation-tab') &&
            document.getElementById('bifurcation-tab').classList.contains('active')) {
            this.switchTab('trajectory');
        }
    }

    updateReturnMapAvailability() {
        const config = this.mapConfigs[this.currentMap];
        const returnMapBtn = document.getElementById('generateReturnMapBtn');
        const returnMapTab = document.querySelector('[data-tab="return-map"]');

        const isAvailable = config.features && config.features.returnMap;

        if (returnMapBtn) returnMapBtn.disabled = !isAvailable;
        if (returnMapTab) returnMapTab.style.display = isAvailable ? 'block' : 'none';

        // Switch to trajectory tab if currently on return map and it's now unavailable
        if (!isAvailable && document.getElementById('return-map-tab') &&
            document.getElementById('return-map-tab').classList.contains('active')) {
            this.switchTab('trajectory');
        }
    }

    updateParameters() {
        const config = this.mapConfigs[this.currentMap];
        this.parameters = {};

        Object.keys(config.params).forEach(key => {
            const input = document.getElementById(`${key}Input`);
            if (input) {
                this.parameters[key] = parseFloat(input.value);
            }
        });

        // For linear 2D map, format matrix
        if (this.currentMap === 'linear_2d') {
            this.parameters.a = [
                [this.parameters.a11, this.parameters.a12],
                [this.parameters.a21, this.parameters.a22]
            ];
        }
    }

    getInitialCondition() {
        if (this.dimension === 1) {
            return parseFloat(document.getElementById('x0Input').value);
        } else {
            return [
                parseFloat(document.getElementById('x0Input').value),
                parseFloat(document.getElementById('y0Input').value)
            ];
        }
    }

    setupTabs() {
        // Initially show trajectory tab
        this.switchTab('trajectory');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    showLoading(message = '正在计算...') {
        this.isLoading = true;
        const overlay = document.getElementById('loadingOverlay');
        overlay.querySelector('p').textContent = message;
        overlay.style.display = 'flex';
    }

    hideLoading() {
        this.isLoading = false;
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorModal').style.display = 'flex';
    }

    hideError() {
        document.getElementById('errorModal').style.display = 'none';
    }

    async generateTrajectory() {
        console.log('generateTrajectory called');
        if (this.isLoading) {
            console.log('Already loading, skipping...');
            return;
        }

        // Ensure parameters are updated
        this.updateParameters();
        console.log('Current map:', this.currentMap);
        console.log('Parameters:', this.parameters);
        console.log('Initial condition:', this.getInitialCondition());

        this.showLoading('生成轨迹中...');

        try {
            const requestData = {
                map_type: this.currentMap,
                parameters: this.parameters,
                x0: this.getInitialCondition(),
                n_steps: parseInt(document.getElementById('nStepsInput').value)
            };

            console.log('Sending request:', requestData);
            const response = await fetch('/api/generate_discrete_trajectory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            console.log('Response result:', result);

            if (result.success) {
                this.plotTrajectory(result.trajectory);
            } else {
                this.showError(result.error || '生成轨迹失败');
            }
        } catch (error) {
            console.error('Error generating trajectory:', error);
            this.showError('网络错误: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    plotTrajectory(trajectory) {
        console.log('============ plotTrajectory START ============');
        console.log('plotTrajectory called with:', trajectory);
        console.log('Trajectory length:', trajectory.length);
        console.log('Current dimension:', this.dimension);
        console.log('Plotly available:', typeof Plotly !== 'undefined');
        console.log('Container exists:', !!document.getElementById('trajectoryPlot'));

        // 数据验证
        if (!trajectory || trajectory.length === 0) {
            console.error('ERROR: 轨迹数据为空');
            this.showError('轨迹数据为空');
            return;
        }

        // 公共Plotly配置
        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        };

        const traces = [];

        // 根据维度和数据结构处理
        if (this.dimension === 1) {
            // 一维系统 - 数据应该是简单数组 [x0, x1, x2, ...]
            traces.push({
                x: Array.from({length: trajectory.length}, (_, i) => i),
                y: trajectory,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'x(n)',
                line: { color: '#00ff88', width: 3 },
                marker: { size: 6, color: '#00ff88' }
            });
        } else if (this.dimension === 2) {
            // 二维系统 - 数据应该是嵌套数组 [[x0,y0], [x1,y1], ...]
            // 检查第一个元素是否为数组
            const isNestedArray = Array.isArray(trajectory[0]);

            if (!isNestedArray) {
                this.showError('2D系统数据格式错误：期望嵌套数组');
                return;
            }

            // x轨迹
            traces.push({
                x: Array.from({length: trajectory.length}, (_, i) => i),
                y: trajectory.map(p => p[0]),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'x(n)',
                line: { color: '#00ff88', width: 3 },
                marker: { size: 6, color: '#00ff88' }
            });

            // y轨迹
            traces.push({
                x: Array.from({length: trajectory.length}, (_, i) => i),
                y: trajectory.map(p => p[1]),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'y(n)',
                line: { color: '#ff6b6b', width: 3 },
                marker: { size: 6, color: '#ff6b6b' }
            });
        }

        const layout = {
            title: {
                text: '轨迹时间序列',
                font: { color: '#e0e0e0', size: 16 }
            },
            xaxis: {
                title: {
                    text: '迭代次数 n',
                    font: { color: '#e0e0e0' }
                },
                tickfont: { color: '#e0e0e0' },
                gridcolor: 'rgba(255,255,255,0.1)'
            },
            yaxis: {
                title: {
                    text: this.dimension === 1 ? 'x(n)' : '值',
                    font: { color: '#e0e0e0' }
                },
                tickfont: { color: '#e0e0e0' },
                gridcolor: 'rgba(255,255,255,0.1)'
            },
            plot_bgcolor: '#1a1a2e',
            paper_bgcolor: '#16213e',
            font: { color: '#e0e0e0' },
            legend: {
                font: { color: '#e0e0e0' },
                x: 1,
                y: 1,
                xanchor: 'right',
                yanchor: 'top',
                bgcolor: 'rgba(26, 26, 46, 0.8)',
                bordercolor: '#e0e0e0',
                borderwidth: 1
            },
            width: null,
            height: 450,
            autosize: true,
            margin: {
                l: 60,
                r: 120,
                t: 60,
                b: 60
            }
        };

        console.log('About to call Plotly.newPlot with:');
        console.log('- Container: trajectoryPlot');
        console.log('- Traces:', traces);
        console.log('- Layout:', layout);

        try {
            Plotly.newPlot('trajectoryPlot', traces, layout, config);
            console.log('✓ Plotly.newPlot executed successfully');

            // 检查容器的实际渲染状态
            const container = document.getElementById('trajectoryPlot');
            const rect = container.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(container);

            console.log('Container debug info:');
            console.log('- Dimensions:', {
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left
            });
            console.log('- Computed style:', {
                display: computedStyle.display,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity,
                position: computedStyle.position,
                zIndex: computedStyle.zIndex
            });
            console.log('- Children count:', container.children.length);
            console.log('- Has Plotly plot:', container.querySelector('.js-plotly-plot') !== null);

            // 强制重新调整大小
            setTimeout(() => {
                console.log('Resizing plot...');
                Plotly.Plots.resize('trajectoryPlot');
                console.log('✓ Plot resized');

                // 再次检查尺寸
                const newRect = container.getBoundingClientRect();
                console.log('After resize - Dimensions:', {
                    width: newRect.width,
                    height: newRect.height
                });
            }, 100);

            console.log('============ plotTrajectory END (SUCCESS) ============');
        } catch (error) {
            console.error('✗ Plotly.newPlot failed:', error);
            console.error('Error stack:', error.stack);
            this.showError('绘图失败: ' + error.message);
            console.log('============ plotTrajectory END (FAILED) ============');
        }
    }

    async analyzeSystem() {
        if (this.isLoading) return;

        this.showLoading('分析系统中...');

        try {
            const response = await fetch('/api/analyze_discrete_system', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    map_type: this.currentMap,
                    parameters: this.parameters
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            if (result.success) {
                this.displayAnalysisResults(result);
            } else {
                this.showError(result.error || '系统分析失败');
            }
        } catch (error) {
            this.showError('网络错误: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    displayAnalysisResults(results) {
        const container = document.getElementById('analysisContent');
        let html = '';

        // Fixed points
        if (results.fixed_points && results.fixed_points.length > 0) {
            html += '<div class="analysis-section">';
            html += '<h5><i class="fas fa-dot-circle"></i> 固定点</h5>';
            html += '<ul>';
            results.fixed_points.forEach(fp => {
                // 处理1D和2D固定点
                if (Array.isArray(fp)) {
                    // 2D固定点
                    html += `<li>x* = (${fp[0].toFixed(4)}, ${fp[1].toFixed(4)})</li>`;
                } else {
                    // 1D固定点
                    html += `<li>x* = ${fp.toFixed(4)}</li>`;
                }
            });
            html += '</ul>';
            html += '</div>';
        }

        // Stability analysis
        if (results.stability_analysis && results.stability_analysis.length > 0) {
            html += '<div class="analysis-section">';
            html += '<h5><i class="fas fa-balance-scale"></i> 稳定性分析</h5>';
            results.stability_analysis.forEach(stability => {
                const color = stability.stability === '稳定' ? 'green' :
                             stability.stability === '不稳定' ? 'red' : 'orange';
                html += `<div class="stability-item">`;

                // 处理1D和2D固定点
                let fpStr = '';
                if (Array.isArray(stability.fixed_point)) {
                    // 2D固定点
                    fpStr = `(${stability.fixed_point[0].toFixed(4)}, ${stability.fixed_point[1].toFixed(4)})`;
                } else {
                    // 1D固定点
                    fpStr = stability.fixed_point.toFixed(4);
                }

                html += `<span>固定点 ${fpStr}: </span>`;
                html += `<span style="color: ${color}; font-weight: bold;">${stability.stability}</span>`;

                // 对于2D系统，显示最大特征值；对于1D系统，显示乘子
                if (stability.max_eigenvalue !== undefined) {
                    html += `<span> (最大特征值: ${stability.max_eigenvalue.toFixed(4)})</span>`;
                } else if (stability.multiplier !== undefined && stability.multiplier !== null) {
                    html += `<span> (乘子: ${stability.multiplier.toFixed(4)})</span>`;
                }

                html += `</div>`;
            });
            html += '</div>';
        }

        // Periodic orbits
        if (results.periodic_orbits && Object.keys(results.periodic_orbits).length > 0) {
            html += '<div class="analysis-section">';
            html += '<h5><i class="fas fa-sync"></i> 周期轨道</h5>';
            Object.entries(results.periodic_orbits).forEach(([period, orbits]) => {
                html += `<div class="periodic-orbit">`;
                html += `<strong>${period}周期轨道:</strong> 发现 ${orbits.length} 个<br>`;
                orbits.slice(0, 3).forEach((orbit, idx) => {
                    html += `&nbsp;&nbsp;轨道${idx + 1}: [${orbit.map(x => x.toFixed(3)).join(', ')}]<br>`;
                });
                if (orbits.length > 3) {
                    html += `&nbsp;&nbsp;... 还有 ${orbits.length - 3} 个<br>`;
                }
                html += `</div>`;
            });
            html += '</div>';
        }

        // Lyapunov analysis
        if (results.lyapunov_analysis) {
            const lyap = results.lyapunov_analysis;
            html += '<div class="analysis-section">';
            html += '<h5><i class="fas fa-chart-line"></i> Lyapunov指数</h5>';
            const color = lyap.is_chaotic ? 'red' : 'green';
            html += `<div class="lyapunov-result">`;

            // 如果有多个Lyapunov指数（2D系统），显示所有
            if (lyap.lyapunov_exponents && lyap.lyapunov_exponents.length > 1) {
                html += `<span>λ₁ = ${lyap.lyapunov_exponents[0].toFixed(6)}</span><br>`;
                html += `<span>λ₂ = ${lyap.lyapunov_exponents[1].toFixed(6)}</span><br>`;
                html += `<span>最大: λ = ${lyap.lyapunov_exponent.toFixed(6)}</span><br>`;
            } else {
                // 1D系统只显示一个
                html += `<span>λ = ${lyap.lyapunov_exponent ? lyap.lyapunov_exponent.toFixed(6) : 'N/A'}</span><br>`;
            }

            html += `<span style="color: ${color}; font-weight: bold;">`;
            html += `${lyap.is_chaotic ? '混沌系统' : '规则系统'}</span><br>`;
            html += `<small>${lyap.convergence_info || ''}</small>`;
            html += `</div>`;
            html += '</div>';
        }

        container.innerHTML = html;
        document.getElementById('analysisResults').style.display = 'block';
    }

    async generateCobwebPlot() {
        console.log('generateCobwebPlot called');
        if (this.isLoading || this.dimension !== 1) {
            console.log('Skipping cobweb plot - loading:', this.isLoading, 'dimension:', this.dimension);
            return;
        }

        // Ensure latest parameters/initial condition (trajectory already does this)
        this.updateParameters();
        const x0 = this.getInitialCondition();

        this.showLoading('生成蛛网图中...');

        try {
            const response = await fetch('/api/generate_cobweb_plot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    map_type: this.currentMap,
                    parameters: this.parameters,
                    x0,
                    n_steps: parseInt(document.getElementById('cobwebSteps').value)
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            if (result.success) {
                this.plotCobweb(result);
            } else {
                this.showError(result.error || '生成蛛网图失败');
            }
        } catch (error) {
            this.showError('网络错误: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    plotCobweb(data) {
        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        };

        const traces = [];

        // Map function
        traces.push({
            x: data.map_function.x,
            y: data.map_function.y,
            type: 'scatter',
            mode: 'lines',
            name: 'f(x)',
            line: { color: '#00ff88', width: 4 }
        });

        // Identity line
        traces.push({
            x: data.identity_line.x,
            y: data.identity_line.y,
            type: 'scatter',
            mode: 'lines',
            name: 'y = x',
            line: { color: '#ffd700', width: 3, dash: 'dash' }
        });

        // Cobweb lines
        traces.push({
            x: data.cobweb_data.x_points,
            y: data.cobweb_data.y_points,
            type: 'scatter',
            mode: 'lines',
            name: '蛛网轨迹',
            line: { color: '#ff6b6b', width: 3 }
        });

        const layout = {
            title: {
                text: '蛛网图可视化',
                font: { color: '#e0e0e0', size: 16 }
            },
            xaxis: {
                title: {
                    text: 'x_n',
                    font: { color: '#e0e0e0' }
                },
                tickfont: { color: '#e0e0e0' },
                gridcolor: 'rgba(255,255,255,0.1)'
            },
            yaxis: {
                title: {
                    text: 'x_{n+1}',
                    font: { color: '#e0e0e0' }
                },
                tickfont: { color: '#e0e0e0' },
                gridcolor: 'rgba(255,255,255,0.1)'
            },
            plot_bgcolor: '#1a1a2e',
            paper_bgcolor: '#16213e',
            font: { color: '#e0e0e0' },
            legend: {
                font: { color: '#e0e0e0' },
                x: 1,
                y: 1,
                xanchor: 'right',
                yanchor: 'top',
                bgcolor: 'rgba(26, 26, 46, 0.8)',
                bordercolor: '#e0e0e0',
                borderwidth: 1
            },
            width: null,
            height: 450,
            autosize: true,
            margin: {
                l: 60,
                r: 120,
                t: 60,
                b: 60
            }
        };

        Plotly.newPlot('cobwebPlot', traces, layout, config);
        setTimeout(() => {
            Plotly.Plots.resize('cobwebPlot');
        }, 100);
    }

    async generateBifurcationDiagram() {
        console.log('generateBifurcationDiagram called');
        if (this.isLoading) {
            console.log('Already loading, skipping bifurcation diagram');
            return;
        }

        // Sync parameters before request (align with trajectory flow)
        this.updateParameters();
        const x0 = this.getInitialCondition();

        // 参数范围验证
        let paramMin = parseFloat(document.getElementById('paramMin').value);
        let paramMax = parseFloat(document.getElementById('paramMax').value);

        // 检查参数是否有效
        if (isNaN(paramMin) || isNaN(paramMax)) {
            this.showError('参数范围必须是有效的数字');
            return;
        }

        // 如果最小值大于最大值，自动交换并警告用户
        if (paramMin > paramMax) {
            this.showError('参数最小值不能大于最大值，已自动交换');
            [paramMin, paramMax] = [paramMax, paramMin];
            document.getElementById('paramMin').value = paramMin;
            document.getElementById('paramMax').value = paramMax;
            return;
        }

        // 检查范围是否过小
        if (Math.abs(paramMax - paramMin) < 1e-6) {
            this.showError('参数范围过小，请增大范围');
            return;
        }

        this.showLoading('生成分岔图中...');

        try {
            const paramName = document.getElementById('paramName').value;

            const response = await fetch('/api/generate_bifurcation_diagram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    map_type: this.currentMap,
                    parameters: this.parameters,
                    param_name: paramName,
                    param_range: [paramMin, paramMax],
                    param_steps: 800,
                    x0
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            if (result.success) {
                this.plotBifurcationDiagram(result);
            } else {
                this.showError(result.error || '生成分岔图失败');
            }
        } catch (error) {
            this.showError('网络错误: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    plotBifurcationDiagram(data) {
        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        };

        const x = [];
        const y = [];

        data.bifurcation_data.forEach(point => {
            point.points.forEach(value => {
                x.push(point.parameter);
                y.push(value);  // Backend already extracts x[0] for 2D systems
            });
        });

        // 数据点过多时进行采样以避免WebGL上下文丢失
        const maxPoints = 50000;
        let sampledX = x;
        let sampledY = y;

        if (x.length > maxPoints) {
            const step = Math.ceil(x.length / maxPoints);
            sampledX = x.filter((_, i) => i % step === 0);
            sampledY = y.filter((_, i) => i % step === 0);
            console.log(`Bifurcation data sampled: ${x.length} -> ${sampledX.length} points`);
        }

        const trace = {
            x: sampledX,
            y: sampledY,
            type: 'scatter',  // 改用普通scatter而非scattergl
            mode: 'markers',
            marker: {
                size: 1,  // 减小点的大小
                color: '#00ff88',
                opacity: 0.6
            },
            name: '分岔点'
        };

        const layout = {
            title: {
                text: `分岔图 - ${data.param_name}参数`,
                font: { color: '#e0e0e0', size: 16 }
            },
            xaxis: {
                title: {
                    text: data.param_name,
                    font: { color: '#e0e0e0' }
                },
                tickfont: { color: '#e0e0e0' },
                gridcolor: 'rgba(255,255,255,0.1)'
            },
            yaxis: {
                title: {
                    text: 'x',
                    font: { color: '#e0e0e0' }
                },
                tickfont: { color: '#e0e0e0' },
                gridcolor: 'rgba(255,255,255,0.1)'
            },
            plot_bgcolor: '#1a1a2e',
            paper_bgcolor: '#16213e',
            font: { color: '#e0e0e0' },
            legend: {
                font: { color: '#e0e0e0' },
                x: 1,
                y: 1,
                xanchor: 'right',
                yanchor: 'top',
                bgcolor: 'rgba(26, 26, 46, 0.8)',
                bordercolor: '#e0e0e0',
                borderwidth: 1
            },
            showlegend: false,
            width: null,
            height: 450,
            autosize: true,
            margin: {
                l: 60,
                r: 80,
                t: 60,
                b: 60
            }
        };

        Plotly.newPlot('bifurcationPlot', [trace], layout, config);
        setTimeout(() => {
            Plotly.Plots.resize('bifurcationPlot');
        }, 100);
    }

    async generateReturnMap() {
        console.log('generateReturnMap called');
        if (this.isLoading) {
            console.log('Already loading, skipping return map');
            return;
        }

        // Keep parameters/IC fresh like trajectory
        this.updateParameters();
        const x0 = this.getInitialCondition();

        this.showLoading('生成返回映射中...');

        try {
            const response = await fetch('/api/generate_return_map', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    map_type: this.currentMap,
                    parameters: this.parameters,
                    x0,
                    n_steps: 300,
                    delay: parseInt(document.getElementById('delayInput').value)
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            if (result.success) {
                this.plotReturnMap(result.return_map_data);
            } else {
                this.showError(result.error || '生成返回映射失败');
            }
        } catch (error) {
            this.showError('网络错误: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    plotReturnMap(data) {
        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        };

        const trace = {
            x: data.x_n,
            y: data.x_n_plus_delay,
            type: 'scatter',  // 改用普通scatter避免WebGL上下文丢失
            mode: 'markers',
            marker: {
                size: 3,  // 稍微减小点的大小
                color: '#ff6b6b',
                opacity: 0.7
            },
            name: `延迟 ${data.delay}`
        };

        const layout = {
            title: {
                text: `返回映射 (延迟 = ${data.delay})`,
                font: { color: '#e0e0e0', size: 16 }
            },
            xaxis: {
                title: {
                    text: 'x_n',
                    font: { color: '#e0e0e0' }
                },
                tickfont: { color: '#e0e0e0' },
                gridcolor: 'rgba(255,255,255,0.1)'
            },
            yaxis: {
                title: {
                    text: `x_{n+${data.delay}}`,
                    font: { color: '#e0e0e0' }
                },
                tickfont: { color: '#e0e0e0' },
                gridcolor: 'rgba(255,255,255,0.1)'
            },
            plot_bgcolor: '#1a1a2e',
            paper_bgcolor: '#16213e',
            font: { color: '#e0e0e0' },
            legend: {
                font: { color: '#e0e0e0' },
                x: 1,
                y: 1,
                xanchor: 'right',
                yanchor: 'top',
                bgcolor: 'rgba(26, 26, 46, 0.8)',
                bordercolor: '#e0e0e0',
                borderwidth: 1
            },
            showlegend: false,
            width: null,
            height: 450,
            autosize: true,
            margin: {
                l: 60,
                r: 80,
                t: 60,
                b: 60
            }
        };

        Plotly.newPlot('returnMapPlot', [trace], layout, config);
        setTimeout(() => {
            Plotly.Plots.resize('returnMapPlot');
        }, 100);
    }

    async generatePhasePortrait() {
        console.log('generatePhasePortrait called');
        if (this.isLoading || this.dimension !== 2) {
            console.log('Skipping phase portrait - loading:', this.isLoading, 'dimension:', this.dimension);
            return;
        }

        this.showLoading('生成相图中...');

        try {
            const response = await fetch('/api/discrete_phase_portrait', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    map_type: this.currentMap,
                    parameters: this.parameters,
                    x0: this.getInitialCondition(),
                    n_steps: parseInt(document.getElementById('nStepsInput').value)
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            if (result.success) {
                this.plotPhasePortrait(result.trajectory);
            } else {
                this.showError(result.error || '生成相图失败');
            }
        } catch (error) {
            this.showError('网络错误: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    plotPhasePortrait(trajectory) {
        console.log('plotPhasePortrait called with:', trajectory);

        // 数据验证
        if (!trajectory || !trajectory.x || !trajectory.y) {
            this.showError('相图数据格式错误');
            return;
        }

        if (trajectory.x.length === 0 || trajectory.y.length === 0) {
            this.showError('相图数据为空');
            return;
        }

        if (trajectory.x.length !== trajectory.y.length) {
            this.showError('相图x和y数据长度不一致');
            return;
        }

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        };

        const trace = {
            x: trajectory.x,
            y: trajectory.y,
            type: 'scatter',  // 改用普通scatter避免WebGL上下文丢失
            mode: 'markers',
            marker: {
                size: 2,  // 减小点的大小
                color: Array.from({length: trajectory.x.length}, (_, i) => i),
                colorscale: 'Viridis',
                showscale: true,
                colorbar: {
                    title: '时间步'
                }
            },
            name: '轨迹'
        };

        const layout = {
            title: {
                text: '2D相图',
                font: { color: '#e0e0e0', size: 16 }
            },
            xaxis: {
                title: {
                    text: 'x',
                    font: { color: '#e0e0e0' }
                },
                tickfont: { color: '#e0e0e0' },
                gridcolor: 'rgba(255,255,255,0.1)'
            },
            yaxis: {
                title: {
                    text: 'y',
                    font: { color: '#e0e0e0' }
                },
                tickfont: { color: '#e0e0e0' },
                gridcolor: 'rgba(255,255,255,0.1)'
            },
            plot_bgcolor: '#1a1a2e',
            paper_bgcolor: '#16213e',
            font: { color: '#e0e0e0' },
            legend: {
                font: { color: '#e0e0e0' },
                x: 1,
                y: 1,
                xanchor: 'right',
                yanchor: 'top',
                bgcolor: 'rgba(26, 26, 46, 0.8)',
                bordercolor: '#e0e0e0',
                borderwidth: 1
            },
            showlegend: false,
            width: null,
            height: 450,
            autosize: true,
            margin: {
                l: 60,
                r: 80,
                t: 60,
                b: 60
            }
        };

        Plotly.newPlot('phasePortraitPlot', [trace], layout, config);
        setTimeout(() => {
            Plotly.Plots.resize('phasePortraitPlot');
        }, 100);
    }

    runTest(testType) {
        switch (testType) {
            case 'logistic-chaos':
                this.selectMap('logistic');
                document.getElementById('rInput').value = 3.8;
                document.getElementById('x0Input').value = 0.5;
                document.getElementById('nStepsInput').value = 200;
                this.updateParameters();
                this.generateTrajectory();
                break;

            case 'period-doubling':
                this.selectMap('logistic');
                document.getElementById('rInput').value = 3.2;
                document.getElementById('x0Input').value = 0.5;
                document.getElementById('nStepsInput').value = 100;
                this.updateParameters();
                this.generateTrajectory();
                break;

            case 'henon-attractor':
                this.selectMap('henon');
                document.getElementById('aInput').value = 1.4;
                document.getElementById('bInput').value = 0.3;
                document.getElementById('x0Input').value = 0.1;
                document.getElementById('y0Input').value = 0.1;
                document.getElementById('nStepsInput').value = 1000;
                this.updateParameters();
                this.switchTab('phase-portrait');
                this.generatePhasePortrait();
                break;

            case 'tent-chaos':
                this.selectMap('tent');
                document.getElementById('muInput').value = 2.0;
                document.getElementById('x0Input').value = 0.3;
                document.getElementById('nStepsInput').value = 150;
                this.updateParameters();
                this.generateTrajectory();
                break;

            case 'linear-stable':
                this.switchSystemType('linear');
                this.selectMap('linear_2d');
                document.getElementById('a11Input').value = 0.8;
                document.getElementById('a12Input').value = 0.1;
                document.getElementById('a21Input').value = -0.1;
                document.getElementById('a22Input').value = 0.9;
                document.getElementById('x0Input').value = 1.0;
                document.getElementById('y0Input').value = 0.5;
                document.getElementById('nStepsInput').value = 50;
                this.updateParameters();
                this.switchTab('phase-portrait');
                this.generatePhasePortrait();
                break;

            case 'rotation-map':
                this.switchSystemType('linear');
                this.selectMap('rotation_2d');
                document.getElementById('thetaInput').value = 0.3;
                document.getElementById('rInput').value = 0.95;
                document.getElementById('x0Input').value = 1.0;
                document.getElementById('y0Input').value = 0.0;
                document.getElementById('nStepsInput').value = 100;
                this.updateParameters();
                this.switchTab('phase-portrait');
                this.generatePhasePortrait();
                break;
        }
    }

    // Add parameter example functions for enhanced interactivity
    loadParameterExample(mapType, exampleName) {
        const config = this.mapConfigs[mapType];
        if (!config.examples || !config.examples[exampleName]) return;

        const example = config.examples[exampleName];
        Object.entries(example).forEach(([param, value]) => {
            const input = document.getElementById(`${param}Input`);
            if (input) {
                input.value = value;
            }
        });
        this.updateParameters();

        // 自动刷新当前活动的图表
        this.refreshCurrentPlot();
    }

    // 刷新当前活动tab的图表
    refreshCurrentPlot() {
        const activeTab = document.querySelector('.tab-pane.active');
        if (!activeTab) return;

        const tabId = activeTab.id;

        // 防止在loading状态下重复刷新
        if (this.isLoading) {
            console.log('Already loading, skipping refresh');
            return;
        }

        // 根据当前活动的tab刷新相应的图表
        switch(tabId) {
            case 'trajectory-tab':
                this.generateTrajectory();
                break;
            case 'cobweb-tab':
                if (this.dimension === 1) {
                    this.generateCobwebPlot();
                } else {
                    console.log('Cobweb plot only available for 1D systems');
                }
                break;
            case 'bifurcation-tab':
                const config = this.mapConfigs[this.currentMap];
                if (config.features && config.features.bifurcation) {
                    this.generateBifurcationDiagram();
                } else {
                    console.log('Bifurcation diagram not available for this map');
                }
                break;
            case 'return-map-tab':
                this.generateReturnMap();
                break;
            case 'phase-portrait-tab':
                if (this.dimension === 2) {
                    this.generatePhasePortrait();
                } else {
                    console.log('Phase portrait only available for 2D systems');
                }
                break;
        }
    }

    // 导出当前配置（包含所有参数和分岔设置）
    exportConfiguration() {
        // 更新参数确保是最新的
        this.updateParameters();

        const config = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            mapType: this.currentMap,
            systemType: this.currentSystemType,
            parameters: this.parameters,
            initialCondition: this.getInitialCondition(),
            iterations: parseInt(document.getElementById('nStepsInput').value),
            bifurcation: {
                paramName: document.getElementById('paramName').value,
                paramMin: parseFloat(document.getElementById('paramMin').value),
                paramMax: parseFloat(document.getElementById('paramMax').value)
            },
            cobwebSteps: parseInt(document.getElementById('cobwebSteps').value),
            delay: parseInt(document.getElementById('delayInput').value)
        };

        // 转换为JSON字符串
        const configJson = JSON.stringify(config, null, 2);

        // 创建下载链接
        const blob = new Blob([configJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `discrete_system_config_${this.currentMap}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('Configuration exported:', config);
        return config;
    }

    // 导入配置
    importConfiguration(configJson) {
        try {
            const config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson;

            // 验证配置版本
            if (!config.version || config.version !== '1.0') {
                throw new Error('不支持的配置文件版本');
            }

            // 切换到对应的系统类型
            if (config.systemType) {
                this.switchSystemType(config.systemType);
            }

            // 选择对应的映射
            if (config.mapType) {
                this.selectMap(config.mapType);
            }

            // 恢复参数
            if (config.parameters) {
                Object.entries(config.parameters).forEach(([key, value]) => {
                    const input = document.getElementById(`${key}Input`);
                    if (input) {
                        input.value = value;
                    }
                });
                this.updateParameters();
            }

            // 恢复初始条件
            if (config.initialCondition !== undefined) {
                if (this.dimension === 1) {
                    document.getElementById('x0Input').value = config.initialCondition;
                } else if (this.dimension === 2 && Array.isArray(config.initialCondition)) {
                    document.getElementById('x0Input').value = config.initialCondition[0];
                    document.getElementById('y0Input').value = config.initialCondition[1];
                }
            }

            // 恢复迭代次数
            if (config.iterations) {
                document.getElementById('nStepsInput').value = config.iterations;
            }

            // 恢复分岔参数
            if (config.bifurcation) {
                if (config.bifurcation.paramName) {
                    document.getElementById('paramName').value = config.bifurcation.paramName;
                }
                if (config.bifurcation.paramMin !== undefined) {
                    document.getElementById('paramMin').value = config.bifurcation.paramMin;
                }
                if (config.bifurcation.paramMax !== undefined) {
                    document.getElementById('paramMax').value = config.bifurcation.paramMax;
                }
            }

            // 恢复其他设置
            if (config.cobwebSteps) {
                document.getElementById('cobwebSteps').value = config.cobwebSteps;
            }
            if (config.delay) {
                document.getElementById('delayInput').value = config.delay;
            }

            console.log('Configuration imported successfully:', config);

            // 刷新当前图表
            this.refreshCurrentPlot();

            return true;
        } catch (error) {
            console.error('Failed to import configuration:', error);
            this.showError('配置导入失败: ' + error.message);
            return false;
        }
    }

    // 分享配置（生成可分享的URL或JSON）
    shareConfiguration() {
        const config = this.exportConfiguration();

        // 创建分享文本
        const shareText = `离散系统配置 - ${this.mapConfigs[this.currentMap].name}\n` +
                         `参数: ${JSON.stringify(config.parameters)}\n` +
                         `初始条件: ${JSON.stringify(config.initialCondition)}\n` +
                         `分岔范围: [${config.bifurcation.paramMin}, ${config.bifurcation.paramMax}]`;

        // 复制到剪贴板
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareText).then(() => {
                alert('配置已复制到剪贴板！');
            }).catch(err => {
                console.error('Failed to copy:', err);
                this.showError('复制失败，请手动复制配置');
            });
        } else {
            // 降级处理：显示文本供用户手动复制
            alert('配置信息：\n' + shareText);
        }

        return shareText;
    }
}

// Initialize when DOM is loaded
(function() {
    function init() {
        console.log('============================================');
        console.log('DOM loaded, creating DiscreteSystemAnalyzer...');
        console.log('Plotly available:', typeof Plotly !== 'undefined');
        console.log('Plotly version:', typeof Plotly !== 'undefined' ? Plotly.version : 'N/A');
        console.log('============================================');
        window.discreteAnalyzer = new DiscreteSystemAnalyzer();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();