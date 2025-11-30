// Chaos Analysis and Strange Attractors Visualization
class ChaosAnalyzer {
    constructor() {
        this.currentAttractor = 'lorenz';
        this.parameters = {};
        this.trajectoryData = [];
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.animationId = null;
        this.isAnimating = false;
        
        this.attractorConfigs = {
            lorenz: {
                name: '洛伦兹吸引子',
                params: {
                    sigma: { value: 10, min: 5, max: 20, step: 0.1, label: 'σ (sigma)' },
                    rho: { value: 28, min: 10, max: 50, step: 0.1, label: 'ρ (rho)' },
                    beta: { value: 8/3, min: 1, max: 5, step: 0.1, label: 'β (beta)' }
                },
                equations: (x, y, z, params) => {
                    const dx = params.sigma * (y - x);
                    const dy = x * (params.rho - z) - y;
                    const dz = x * y - params.beta * z;
                    return [dx, dy, dz];
                },
                initialConditions: [1, 1, 1],
                scale: 0.5,
                poincareDefaults: { plane: 'z', value: 27, min: 0, max: 50, step: 0.5 }
            },
            rossler: {
                name: 'Rössler吸引子',
                params: {
                    a: { value: 0.2, min: 0.1, max: 0.5, step: 0.01, label: 'a' },
                    b: { value: 0.2, min: 0.1, max: 0.5, step: 0.01, label: 'b' },
                    c: { value: 5.7, min: 3, max: 10, step: 0.1, label: 'c' }
                },
                equations: (x, y, z, params) => {
                    const dx = -y - z;
                    const dy = x + params.a * y;
                    const dz = params.b + z * (x - params.c);
                    return [dx, dy, dz];
                },
                initialConditions: [1, 1, 1],
                scale: 0.1,
                poincareDefaults: { plane: 'z', value: 0, min: -5, max: 5, step: 0.2 }
            },
            chua: {
                name: '蔡氏电路',
                params: {
                    alpha: { value: 15.6, min: 10, max: 20, step: 0.1, label: 'α (alpha)' },
                    beta: { value: 28, min: 20, max: 35, step: 0.1, label: 'β (beta)' },
                    m0: { value: -1.143, min: -2, max: 0, step: 0.001, label: 'm₀' },
                    m1: { value: -0.714, min: -1, max: 0, step: 0.001, label: 'm₁' }
                },
                equations: (x, y, z, params) => {
                    const f = params.m1 * x + 0.5 * (params.m0 - params.m1) * (Math.abs(x + 1) - Math.abs(x - 1));
                    const dx = params.alpha * (y - x - f);
                    const dy = x - y + z;
                    const dz = -params.beta * y;
                    return [dx, dy, dz];
                },
                initialConditions: [0.1, 0.1, 0.1],
                scale: 0.5,
                poincareDefaults: { plane: 'x', value: 0, min: -5, max: 5, step: 0.2 }
            },
            thomas: {
                name: 'Thomas吸引子',
                params: {
                    b: { value: 0.208186, min: 0.1, max: 0.3, step: 0.001, label: 'b' }
                },
                equations: (x, y, z, params) => {
                    const dx = Math.sin(y) - params.b * x;
                    const dy = Math.sin(z) - params.b * y;
                    const dz = Math.sin(x) - params.b * z;
                    return [dx, dy, dz];
                },
                initialConditions: [0.1, 0, 0],
                scale: 0.3,
                poincareDefaults: { plane: 'x', value: 0, min: -2, max: 2, step: 0.1 }
            }
        };
        
        this.initializeEventListeners();
        this.initializeThreeJS();
        this.setupAttractor('lorenz');
        this.setupEducationalTabs();
    }

    initializeEventListeners() {
        // Attractor selection
        document.querySelectorAll('.attractor-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const attractor = e.currentTarget.dataset.attractor;
                this.selectAttractor(attractor);
            });
        });

        // Simulation controls
        document.getElementById('dtSlider').addEventListener('input', (e) => {
            document.getElementById('dtValue').textContent = e.target.value;
        });

        document.getElementById('timeSlider').addEventListener('input', (e) => {
            document.getElementById('timeValue').textContent = e.target.value;
        });

        document.getElementById('trajCountSlider').addEventListener('input', (e) => {
            document.getElementById('trajCountValue').textContent = e.target.value;
        });

        // Action buttons
        document.getElementById('generateAttractor').addEventListener('click', () => {
            this.generateAttractor();
        });

        document.getElementById('animateTrajectory').addEventListener('click', () => {
            this.toggleAnimation();
        });

        document.getElementById('resetView').addEventListener('click', () => {
            this.resetView();
        });

        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setView(e.target.id);
            });
        });

        // Poincaré section controls
        document.getElementById('poincareSection').addEventListener('change', () => {
            this.updatePoincareMap();
        });

        document.getElementById('sectionSlider').addEventListener('input', (e) => {
            document.getElementById('sectionValue').textContent = e.target.value;
            this.updatePoincareMap();
        });

        // Precise calculation button
        document.getElementById('precisePoincare').addEventListener('click', () => {
            this.calculatePrecisePoincare();
        });

        // Analysis buttons
        document.getElementById('calculateLyapunov').addEventListener('click', () => {
            this.calculateLyapunovExponents();
        });

        document.getElementById('calculateFractal').addEventListener('click', () => {
            this.calculateFractalDimension();
        });

        // Export buttons
        document.getElementById('export3D').addEventListener('click', () => {
            this.export3DModel();
        });

        document.getElementById('exportAnimation').addEventListener('click', () => {
            this.exportAnimation();
        });

        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('exportReport').addEventListener('click', () => {
            this.exportReport();
        });
    }

    initializeThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        // Create camera
        const container = document.getElementById('attractor3D');
        const width = container.clientWidth || 600;
        const height = container.clientHeight || 400;
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(50, 50, 50);
        this.camera.lookAt(0, 0, 0); // Aim camera at origin so attractor is visible on first render

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        container.appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        this.scene.add(directionalLight);

        // Add controls (basic rotation)
        this.setupControls();

        // Register resize handlers
        this.registerResizeHandlers();

        // Start render loop
        this.animate();
    }

    resizeThreeJS() {
        const container = document.getElementById('attractor3D');
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    registerResizeHandlers() {
        window.addEventListener('resize', () => this.resizeThreeJS());
    }

    setupControls() {
        let isMouseDown = false;
        let mouseX = 0;
        let mouseY = 0;

        this.renderer.domElement.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        this.renderer.domElement.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;

            const deltaX = e.clientX - mouseX;
            const deltaY = e.clientY - mouseY;

            // Rotate camera around origin
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(this.camera.position);
            spherical.theta -= deltaX * 0.01;
            spherical.phi += deltaY * 0.01;
            spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

            this.camera.position.setFromSpherical(spherical);
            this.camera.lookAt(0, 0, 0);

            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        this.renderer.domElement.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        // Zoom with mouse wheel
        this.renderer.domElement.addEventListener('wheel', (e) => {
            const scale = e.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(scale);
            e.preventDefault();
        });
    }

    selectAttractor(attractorType) {
        // Update UI
        document.querySelectorAll('.attractor-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-attractor="${attractorType}"]`).classList.add('active');

        this.currentAttractor = attractorType;
        this.setupAttractor(attractorType);
    }

    updatePoincareSectionDefaults(defaults) {
        if (!defaults) return;

        // Update section plane selector
        const sectionSelector = document.getElementById('poincareSection');
        if (sectionSelector) {
            sectionSelector.value = defaults.plane;
        }

        // Update section value slider
        const sectionSlider = document.getElementById('sectionSlider');
        const sectionValue = document.getElementById('sectionValue');
        if (sectionSlider) {
            sectionSlider.min = defaults.min;
            sectionSlider.max = defaults.max;
            sectionSlider.step = defaults.step;
            sectionSlider.value = defaults.value;
            if (sectionValue) {
                sectionValue.textContent = defaults.value;
            }
        }
    }

    setupAttractor(attractorType) {
        const config = this.attractorConfigs[attractorType];
        this.parameters = {};

        // Setup parameter sliders
        const slidersContainer = document.getElementById('parameterSliders');
        slidersContainer.innerHTML = '';

        // Update Poincare section defaults for this attractor
        this.updatePoincareSectionDefaults(config.poincareDefaults);

        Object.entries(config.params).forEach(([key, param]) => {
            this.parameters[key] = param.value;

            const sliderGroup = document.createElement('div');
            sliderGroup.className = 'parameter-group';
            sliderGroup.innerHTML = `
                <label>${param.label}: <span id="${key}Value">${param.value}</span></label>
                <input type="range" id="${key}Slider" 
                       min="${param.min}" max="${param.max}" step="${param.step}" 
                       value="${param.value}" class="param-slider">
            `;
            slidersContainer.appendChild(sliderGroup);

            // Add event listener
            document.getElementById(`${key}Slider`).addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.parameters[key] = value;
                document.getElementById(`${key}Value`).textContent = value.toFixed(3);
            });
        });

        // Generate initial attractor
        this.generateAttractor();
    }

    generateAttractor() {
        const config = this.attractorConfigs[this.currentAttractor];
        const dt = parseFloat(document.getElementById('dtSlider').value);
        const totalTime = parseFloat(document.getElementById('timeSlider').value);
        const trajCount = parseInt(document.getElementById('trajCountSlider').value);

        // Clear previous trajectories
        this.clearScene();

        // Store all trajectories for Poincare section calculation
        const allTrajectories = [];

        // Generate multiple trajectories with slightly different initial conditions
        for (let i = 0; i < trajCount; i++) {
            const offset = i * 0.01;
            const initialConditions = config.initialConditions.map(val => val + offset);
            const trajectory = this.integrateTrajectory(config, initialConditions, dt, totalTime);
            this.addTrajectoryToScene(trajectory, i);

            // Store trajectory for Poincare calculation
            allTrajectories.push(trajectory);
        }

        // Store all trajectories (not just the first one)
        this.trajectoryData = allTrajectories;

        // Update Poincaré map
        this.updatePoincareMap();

        // Update chaos indicators
        this.updateChaosIndicators();
    }

    integrateTrajectory(config, initialConditions, dt, totalTime) {
        const points = [];
        let [x, y, z] = initialConditions;
        const steps = Math.floor(totalTime / dt);

        for (let i = 0; i < steps; i++) {
            points.push({ x, y, z, t: i * dt });

            // Runge-Kutta 4th order integration
            const k1 = config.equations(x, y, z, this.parameters);
            const k2 = config.equations(x + dt/2 * k1[0], y + dt/2 * k1[1], z + dt/2 * k1[2], this.parameters);
            const k3 = config.equations(x + dt/2 * k2[0], y + dt/2 * k2[1], z + dt/2 * k2[2], this.parameters);
            const k4 = config.equations(x + dt * k3[0], y + dt * k3[1], z + dt * k3[2], this.parameters);

            x += dt/6 * (k1[0] + 2*k2[0] + 2*k3[0] + k4[0]);
            y += dt/6 * (k1[1] + 2*k2[1] + 2*k3[1] + k4[1]);
            z += dt/6 * (k1[2] + 2*k2[2] + 2*k3[2] + k4[2]);
        }

        return points;
    }

    addTrajectoryToScene(trajectory, index) {
        const config = this.attractorConfigs[this.currentAttractor];
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        // Create color gradient
        const color1 = new THREE.Color().setHSL(index * 0.1, 0.8, 0.5);
        const color2 = new THREE.Color().setHSL(index * 0.1 + 0.3, 0.8, 0.7);

        trajectory.forEach((point, i) => {
            positions.push(
                point.x * config.scale,
                point.y * config.scale,
                point.z * config.scale
            );

            // Color gradient along trajectory
            const t = i / trajectory.length;
            const color = color1.clone().lerp(color2, t);
            colors.push(color.r, color.g, color.b);
        });

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.LineBasicMaterial({ 
            vertexColors: true,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });

        const line = new THREE.Line(geometry, material);
        this.scene.add(line);

        // Store trajectory data for analysis
        if (index === 0) {
            this.trajectoryData = trajectory;
        }
    }

    clearScene() {
        // Remove all trajectory lines
        const objectsToRemove = [];
        this.scene.traverse((child) => {
            if (child instanceof THREE.Line) {
                objectsToRemove.push(child);
            }
        });
        objectsToRemove.forEach(obj => this.scene.remove(obj));
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        if (this.isAnimating) {
            // Rotate camera around the attractor
            const time = Date.now() * 0.001;
            const radius = this.camera.position.length();
            this.camera.position.x = Math.cos(time * 0.5) * radius;
            this.camera.position.z = Math.sin(time * 0.5) * radius;
            this.camera.lookAt(0, 0, 0);
        }

        this.renderer.render(this.scene, this.camera);
    }

    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        const btn = document.getElementById('animateTrajectory');
        if (this.isAnimating) {
            btn.innerHTML = '<i class="fas fa-pause"></i> 暂停动画';
            btn.classList.add('active');
        } else {
            btn.innerHTML = '<i class="fas fa-film"></i> 动画演示';
            btn.classList.remove('active');
        }
    }

    resetView() {
        this.camera.position.set(50, 50, 50);
        this.camera.lookAt(0, 0, 0);
        this.isAnimating = false;
        document.getElementById('animateTrajectory').innerHTML = '<i class="fas fa-film"></i> 动画演示';
        document.getElementById('animateTrajectory').classList.remove('active');
    }

    setView(viewId) {
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');

        const distance = this.camera.position.length();
        
        switch(viewId) {
            case 'viewXY':
                this.camera.position.set(0, 0, distance);
                break;
            case 'viewXZ':
                this.camera.position.set(0, distance, 0);
                break;
            case 'viewYZ':
                this.camera.position.set(distance, 0, 0);
                break;
            case 'view3D':
                this.camera.position.set(distance/Math.sqrt(3), distance/Math.sqrt(3), distance/Math.sqrt(3));
                break;
        }
        this.camera.lookAt(0, 0, 0);
    }

    updatePoincareMap() {
        if (!this.trajectoryData || this.trajectoryData.length === 0) return;

        const section = document.getElementById('poincareSection').value;
        const sectionValue = parseFloat(document.getElementById('sectionSlider').value);

        // Collect intersections from all trajectories
        const allIntersections = [];
        for (const trajectory of this.trajectoryData) {
            const intersections = this.findPoincareIntersections(trajectory, section, sectionValue);
            allIntersections.push(...intersections);
        }

        this.plotPoincareMap(allIntersections, section);
    }

    findPoincareIntersections(trajectory, section, value) {
        const intersections = [];
        const tolerance = 0.1;

        for (let i = 1; i < trajectory.length; i++) {
            const prev = trajectory[i-1];
            const curr = trajectory[i];
            
            let prevVal, currVal, x, y;
            
            switch(section) {
                case 'z':
                    prevVal = prev.z;
                    currVal = curr.z;
                    if ((prevVal - value) * (currVal - value) < 0) {
                        const t = (value - prevVal) / (currVal - prevVal);
                        x = prev.x + t * (curr.x - prev.x);
                        y = prev.y + t * (curr.y - prev.y);
                        intersections.push({x, y});
                    }
                    break;
                case 'y':
                    prevVal = prev.y;
                    currVal = curr.y;
                    if ((prevVal - value) * (currVal - value) < 0) {
                        const t = (value - prevVal) / (currVal - prevVal);
                        x = prev.x + t * (curr.x - prev.x);
                        y = prev.z + t * (curr.z - prev.z);
                        intersections.push({x, y});
                    }
                    break;
                case 'x':
                    prevVal = prev.x;
                    currVal = curr.x;
                    if ((prevVal - value) * (currVal - value) < 0) {
                        const t = (value - prevVal) / (currVal - prevVal);
                        x = prev.y + t * (curr.y - prev.y);
                        y = prev.z + t * (curr.z - prev.z);
                        intersections.push({x, y});
                    }
                    break;
            }
        }

        return intersections;
    }

    plotPoincareMap(intersections, section) {
        console.log('plotPoincareMap called with:', { intersections, section, count: intersections?.length });

        const poincareMapEl = document.getElementById('poincareMap');
        const plotWidth = poincareMapEl?.clientWidth || undefined;
        const plotHeight = poincareMapEl?.clientHeight || 420;
        console.log('poincareMap element:', poincareMapEl, 'exists:', !!poincareMapEl, 'size:', plotWidth, plotHeight);

        // 检查是否有交点
        if (!intersections || intersections.length === 0) {
            // 显示空结果提示
            const layout = {
                title: `庞加莱截面 (${section} = 常数)`,
                xaxis: { title: section === 'z' ? 'x' : section === 'y' ? 'x' : 'y' },
                yaxis: { title: section === 'z' ? 'y' : section === 'y' ? 'z' : 'z' },
                showlegend: false,
                plot_bgcolor: '#1a1a1a',
                paper_bgcolor: '#2d2d2d',
                font: { color: 'white' },
                autosize: true,
                width: plotWidth,
                height: plotHeight,
                margin: { l: 45, r: 10, t: 40, b: 40 },
                annotations: [{
                    text: '未找到交点<br><br>建议:<br>1. 调整截面值<br>2. 延长积分时间<br>3. 点击"精确计算"使用后端',
                    xref: 'paper',
                    yref: 'paper',
                    x: 0.5,
                    y: 0.5,
                    showarrow: false,
                    font: {
                        size: 14,
                        color: '#ffa500'
                    },
                    align: 'center'
                }]
            };

            Plotly.newPlot('poincareMap', [], layout, {
                responsive: true,
                displayModeBar: false,
                useResizeHandler: true
            }).then(() => {
                Plotly.Plots.resize(poincareMapEl);
            });
            return;
        }

        const trace = {
            x: intersections.map(p => p.x),
            y: intersections.map(p => p.y),
            mode: 'markers',
            type: 'scatter',
            marker: {
                size: 3,
                color: 'rgba(255, 100, 100, 0.8)',
                symbol: 'circle'
            },
            name: '庞加莱截面'
        };

        console.log('Trace data:', {
            xCount: trace.x.length,
            yCount: trace.y.length,
            xSample: trace.x.slice(0, 3),
            ySample: trace.y.slice(0, 3)
        });

        const layout = {
            title: `庞加莱截面 (${section} = 常数) - ${intersections.length} 个交点`,
            xaxis: { title: section === 'z' ? 'x' : section === 'y' ? 'x' : 'y' },
            yaxis: { title: section === 'z' ? 'y' : section === 'y' ? 'z' : 'z' },
            showlegend: false,
            plot_bgcolor: '#1a1a1a',
            paper_bgcolor: '#2d2d2d',
            font: { color: 'white' },
            autosize: true,
            width: plotWidth,
            height: plotHeight,
            margin: { l: 45, r: 10, t: 40, b: 40 }
        };

        console.log('About to call Plotly.newPlot with layout:', layout);

        Plotly.newPlot('poincareMap', [trace], layout, {
            responsive: true,
            displayModeBar: false,
            useResizeHandler: true
        }).then(() => {
            Plotly.Plots.resize(poincareMapEl);
            console.log('Plotly.newPlot completed successfully');
        }).catch(err => {
            console.error('Plotly.newPlot error:', err);
        });
    }

    async calculatePrecisePoincare() {
        const statusEl = document.getElementById('poincareStatus');
        const btnEl = document.getElementById('precisePoincare');

        // 禁用按钮并显示状态
        btnEl.disabled = true;
        statusEl.textContent = '计算中...';
        statusEl.style.color = '#ffa500';

        try {
            const config = this.attractorConfigs[this.currentAttractor];
            const section = document.getElementById('poincareSection').value;
            const sectionValue = parseFloat(document.getElementById('sectionSlider').value);

            // 获取当前UI的时间参数（使用正确的ID）
            const dt = parseFloat(document.getElementById('dtSlider').value);
            const totalTime = parseFloat(document.getElementById('timeSlider').value);

            const response = await fetch('/api/poincare_section', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_type: this.currentAttractor,
                    parameters: this.parameters,
                    initial_conditions: config.initialConditions,
                    section_plane: section,
                    section_value: sectionValue,
                    dt: dt,
                    t_span: [0, totalTime]
                })
            });

            const data = await response.json();

            console.log('Poincare API Response:', data); // 调试日志
            console.log('Intersections count:', data.intersections?.length);
            console.log('First intersection:', data.intersections?.[0]);

            if (data.success) {
                // 使用后端返回的精确结果绘图
                this.plotPoincareMap(data.intersections, section);

                // 显示成功状态
                statusEl.textContent = data.message || `找到 ${data.intersections.length} 个交点（精确计算）`;
                statusEl.style.color = '#4caf50';
            } else {
                // 显示错误信息
                statusEl.textContent = data.message || '计算失败';
                statusEl.style.color = '#f44336';
                console.error('Poincare calculation error:', data.error);
            }
        } catch (error) {
            console.error('Error calculating precise Poincare section:', error);
            statusEl.textContent = '网络错误，请检查后端服务';
            statusEl.style.color = '#f44336';
        } finally {
            btnEl.disabled = false;
            // 3秒后清除状态信息
            setTimeout(() => {
                statusEl.textContent = '';
            }, 5000);
        }
    }

    async calculateLyapunovExponents() {
        const lambdaEls = [
            document.getElementById('lambda1'),
            document.getElementById('lambda2'),
            document.getElementById('lambda3'),
            document.getElementById('lambdaSum')
        ];
        lambdaEls.forEach(el => el.textContent = '计算中...');

        try {
            const config = this.attractorConfigs[this.currentAttractor];
            const response = await fetch('/api/calculate_lyapunov', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_type: this.currentAttractor,
                    parameters: this.parameters,
                    initial_conditions: config.initialConditions
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            if (!result.success || !result.lyapunov_exponents) {
                throw new Error(result.error || 'Lyapunov 指数计算失败');
            }

            const { lambda1, lambda2, lambda3, sum } = result.lyapunov_exponents;
            lambdaEls[0].textContent = lambda1.toFixed(4);
            lambdaEls[1].textContent = lambda2.toFixed(4);
            lambdaEls[2].textContent = lambda3.toFixed(4);
            lambdaEls[3].textContent = sum.toFixed(4);
            this.updateChaosIndicators(lambda1, lambda2, lambda3);
        } catch (error) {
            console.error('Lyapunov calculation error:', error);
            lambdaEls.forEach(el => el.textContent = '错误');
            alert(error.message || 'Lyapunov 指数计算失败');
        }
    }

    estimateLyapunovExponent(index) {
        // Simplified estimation based on attractor type
        const estimates = {
            lorenz: [0.9056, 0, -14.5723],
            rossler: [0.0714, 0, -5.3943],
            chua: [0.1642, 0, -1.1547],
            thomas: [0.0094, 0, -0.0188]
        };

        return estimates[this.currentAttractor][index] + (Math.random() - 0.5) * 0.1;
    }

    async calculateFractalDimension() {
        const boxEl = document.getElementById('boxDimension');
        const corrEl = document.getElementById('correlationDimension');
        boxEl.textContent = corrEl.textContent = '计算中...';

        try {
            const config = this.attractorConfigs[this.currentAttractor];
            const response = await fetch('/api/fractal_dimension', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_type: this.currentAttractor,
                    parameters: this.parameters,
                    initial_conditions: config.initialConditions
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            if (!result.success || !result.fractal_dimensions) {
                throw new Error(result.error || '分形维数计算失败');
            }

            boxEl.textContent = result.fractal_dimensions.box_dimension.toFixed(3);
            corrEl.textContent = result.fractal_dimensions.correlation_dimension.toFixed(3);
        } catch (error) {
            console.error('Fractal dimension calculation error:', error);
            boxEl.textContent = corrEl.textContent = '错误';
            alert(error.message || '分形维数计算失败');
        }
    }

    updateChaosIndicators(lambda1, lambda2, lambda3) {
        const chaosIndicator = document.getElementById('chaosIndicator');
        const periodicIndicator = document.getElementById('periodicIndicator');
        const strangeIndicator = document.getElementById('strangeIndicator');

        // Reset classes
        [chaosIndicator, periodicIndicator, strangeIndicator].forEach(indicator => {
            indicator.className = 'indicator-icon';
        });

        if (lambda1 && lambda1 > 0) {
            chaosIndicator.classList.add('active', 'chaos');
            strangeIndicator.classList.add('active', 'strange');
        } else {
            periodicIndicator.classList.add('active', 'periodic');
        }
    }

    setupEducationalTabs() {
        document.querySelectorAll('.edu-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                
                // Update active tab
                document.querySelectorAll('.edu-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');

                // Show corresponding panel
                document.querySelectorAll('.edu-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                document.getElementById(`${tabName}-panel`).classList.add('active');
            });
        });
    }

    // Export methods
    export3DModel() {
        // Placeholder for 3D model export
        alert('3D模型导出功能开发中...');
    }

    exportAnimation() {
        // Placeholder for animation export
        alert('动画导出功能开发中...');
    }

    exportData() {
        if (!this.trajectoryData.length) {
            alert('请先生成吸引子数据');
            return;
        }

        const csvContent = 'time,x,y,z\n' + 
            this.trajectoryData.map(point => 
                `${point.t},${point.x},${point.y},${point.z}`
            ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentAttractor}_attractor_data.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportReport() {
        // Placeholder for report generation
        alert('分析报告生成功能开发中...');
    }
}

// Initialize when page loads
(function() {
    function init() {
        new ChaosAnalyzer();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();