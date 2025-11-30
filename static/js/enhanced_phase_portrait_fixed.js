// Enhanced Phase Portrait Analyzer with Interactive Features
class EnhancedPhasePortraitAnalyzer {
    constructor() {
        this.currentMatrix = [[0, 1], [-1, 0]];
        this.trajectories = [];
        this.showVectorField = true;
        this.showNullclines = true;
        this.showEigenvectors = false;
        this.isRealTimeMode = true;
        this.tutorialStep = 1;
        this.maxTutorialSteps = 3;
        this.bifurcationData = null;
        this.bifurcationSettings = {
            param: 'a11',
            min: -2,
            max: 2,
            steps: 160
        };

        this.initializeEventListeners();
        this.initializePlots();
        this.updateAnalysis();
        this.generatePhasePortrait();
        this.restoreConfigurationFromQuery();
        this.showTutorial();
    }

    initializeEventListeners() {
        // Matrix parameter sliders
        ['a11', 'a12', 'a21', 'a22'].forEach(param => {
            const slider = document.getElementById(`${param}-slider`);
            const valueDisplay = document.getElementById(`${param}-value`);
            
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueDisplay.textContent = value.toFixed(1);
                this.updateMatrixFromSliders();
                
                if (this.isRealTimeMode) {
                    this.updateAnalysis();
                    this.generatePhasePortrait();
                    this.updateEigenvaluePlot();
                }
            });
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn-enhanced').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const name = e.currentTarget.dataset.name;
                const parsed = this.parseMatrixFromDataset(e.currentTarget.dataset.matrix);
                if (!parsed) {
                    this.showInsight('配置参数解析失败，不会更新当前参数');
                    return;
                }
                this.setMatrix(parsed);
                this.showInsight(`已加载 ${name} 系统配置`);
            });
        });

        // Visualization controls
        document.getElementById('toggleVectorField').addEventListener('click', () => {
            this.showVectorField = !this.showVectorField;
            this.toggleButtonState('toggleVectorField', this.showVectorField);
            this.generatePhasePortrait();
        });

        document.getElementById('toggleNullclines').addEventListener('click', () => {
            this.showNullclines = !this.showNullclines;
            this.toggleButtonState('toggleNullclines', this.showNullclines);
            this.generatePhasePortrait();
        });

        document.getElementById('toggleEigenvectors').addEventListener('click', () => {
            this.showEigenvectors = !this.showEigenvectors;
            this.toggleButtonState('toggleEigenvectors', this.showEigenvectors);
            this.generatePhasePortrait();
        });

        document.getElementById('addTrajectory').addEventListener('click', () => {
            this.addRandomTrajectory();
        });

        document.getElementById('clearTrajectories').addEventListener('click', () => {
            this.clearTrajectories();
        });

        // Bifurcation analysis
        document.getElementById('generateBifurcation').addEventListener('click', () => {
            this.generateBifurcationDiagram();
        });

        // Export functions
        document.getElementById('exportImage').addEventListener('click', () => {
            this.exportAsImage();
        });

        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('shareConfig').addEventListener('click', () => {
            this.shareConfiguration();
        });

        // Tutorial controls
        document.getElementById('nextStep').addEventListener('click', () => {
            this.nextTutorialStep();
        });

        document.getElementById('prevStep').addEventListener('click', () => {
            this.prevTutorialStep();
        });

        document.getElementById('closeTutorial').addEventListener('click', () => {
            this.closeTutorial();
        });

        // Phase portrait click to add trajectory
        document.getElementById('phasePortraitPlot').addEventListener('click', (e) => {
            if (e.target.classList.contains('plot-container')) {
                this.addTrajectoryAtClick(e);
            }
        });
    }

    /**
     * Parse matrix string from dataset, tolerating bracketed or plain comma-separated forms.
     * Returns [[a11,a12],[a21,a22]] or null if invalid.
     */
    parseMatrixFromDataset(raw) {
        if (!raw) return null;

        let numbers = null;

        // Try JSON first (handles "[0,1,-1,0]" or "[[0,1],[-1,0]]")
        try {
            const json = JSON.parse(raw);
            if (Array.isArray(json) && json.length === 4 && json.every(v => typeof v === 'number')) {
                numbers = json;
            } else if (Array.isArray(json) && json.length === 2 &&
                       Array.isArray(json[0]) && Array.isArray(json[1]) &&
                       json[0].length === 2 && json[1].length === 2) {
                // Flatten 2x2 array and validate all elements are finite numbers
                numbers = [...json[0], ...json[1]];
                if (!numbers.every(v => typeof v === 'number' && Number.isFinite(v))) {
                    return null;
                }
            }
        } catch (_) {
            // ignore JSON parse errors and fall back
        }

        if (!numbers) {
            // Strip brackets/whitespace then split
            const cleaned = raw.replace(/[\[\]\s]/g, '');
            numbers = cleaned.split(',').map(n => parseFloat(n));
        }

        if (!Array.isArray(numbers) || numbers.length !== 4 ||
            numbers.some(n => !Number.isFinite(n))) {
            return null;
        }

        return [
            [numbers[0], numbers[1]],
            [numbers[2], numbers[3]]
        ];
    }

    initializePlots() {
        // Initialize main phase portrait plot
        const layout = {
            title: '相图',
            xaxis: { title: 'x', range: [-3, 3] },
            yaxis: { title: 'y', range: [-3, 3] },
            showlegend: false,
            plot_bgcolor: '#1a1a1a',
            paper_bgcolor: '#2d2d2d',
            font: { color: 'white' },
            margin: { l: 50, r: 50, t: 50, b: 50 },
            height: 420
        };

        this.phasePlotLayout = layout;
        this.phasePlotConfig = {
            responsive: true,
            displayModeBar: false,
            useResizeHandler: true
        };

        Plotly.newPlot('phasePortraitPlot', [], layout, this.phasePlotConfig);

        // Initialize eigenvalue trajectory plot
        this.initializeEigenvaluePlot();

        // Initialize stability map
        this.initializeStabilityMap();

        // Initialize bifurcation plot
        this.initializeBifurcationPlot();
    }

    initializeEigenvaluePlot() {
        const layout = {
            title: { text: '特征值轨迹', font: { size: 12 } },
            xaxis: { title: 'Re(λ)', titlefont: { size: 10 } },
            yaxis: { title: 'Im(λ)', titlefont: { size: 10 } },
            showlegend: false,
            plot_bgcolor: '#f8f9fa',
            paper_bgcolor: '#ffffff',
            margin: { l: 50, r: 20, t: 40, b: 50 },
            height: 240
        };

        Plotly.newPlot('eigenvaluePlot', [], layout, {
            displayModeBar: false,
            responsive: true,
            useResizeHandler: true
        });
    }

    initializeStabilityMap() {
        const layout = {
            title: { text: '稳定性区域', font: { size: 12 } },
            xaxis: { title: 'tr(A)', titlefont: { size: 10 } },
            yaxis: { title: 'det(A)', titlefont: { size: 10 } },
            showlegend: false,
            plot_bgcolor: '#f8f9fa',
            paper_bgcolor: '#ffffff',
            margin: { l: 50, r: 20, t: 40, b: 50 },
            height: 240
        };

        Plotly.newPlot('stabilityMap', this.createStabilityTraces(), layout, {
            displayModeBar: false,
            responsive: true,
            useResizeHandler: true
        });
    }

    initializeBifurcationPlot() {
        const layout = {
            title: { text: '分岔图', font: { size: 12 } },
            xaxis: { title: '参数', titlefont: { size: 10 } },
            yaxis: { title: 'Re(特征值)', titlefont: { size: 10 } },
            showlegend: true,
            legend: { orientation: 'h', x: 0, y: 1.15 },
            plot_bgcolor: '#f8f9fa',
            paper_bgcolor: '#ffffff',
            margin: { l: 50, r: 20, t: 40, b: 50 },
            height: 420
        };

        this.bifurcationPlotLayout = layout;
        this.bifurcationPlotConfig = {
            displayModeBar: false,
            responsive: true,
            useResizeHandler: true
        };

        Plotly.newPlot('bifurcationPlot', [], layout, this.bifurcationPlotConfig);
    }

    createStabilityTraces() {
        const traces = [];

        // Stable node region (tr < 0, det > 0, tr^2 - 4det >= 0)
        traces.push({
            x: [-3, 0, 0, -3, -3],
            y: [0, 0, 9, 9, 0],
            fill: 'toself',
            fillcolor: 'rgba(76, 175, 80, 0.3)',
            line: { color: 'rgba(76, 175, 80, 0.8)' },
            name: '稳定节点',
            hovertemplate: '稳定节点<extra></extra>'
        });

        // Stable focus region (tr < 0, det > 0, tr^2 - 4det < 0)
        traces.push({
            x: [-3, 0, 0, -3, -3],
            y: [0, 0, 2.25, 2.25, 0],
            fill: 'toself',
            fillcolor: 'rgba(33, 150, 243, 0.3)',
            line: { color: 'rgba(33, 150, 243, 0.8)' },
            name: '稳定焦点',
            hovertemplate: '稳定焦点<extra></extra>'
        });

        // Unstable node region (tr > 0, det > 0, tr^2 - 4det >= 0)
        traces.push({
            x: [0, 3, 3, 0, 0],
            y: [0, 0, 9, 9, 0],
            fill: 'toself',
            fillcolor: 'rgba(244, 67, 54, 0.3)',
            line: { color: 'rgba(244, 67, 54, 0.8)' },
            name: '不稳定节点',
            hovertemplate: '不稳定节点<extra></extra>'
        });

        // Unstable focus region (tr > 0, det > 0, tr^2 - 4det < 0)
        traces.push({
            x: [0, 3, 3, 0, 0],
            y: [0, 0, 2.25, 2.25, 0],
            fill: 'toself',
            fillcolor: 'rgba(156, 39, 176, 0.3)',
            line: { color: 'rgba(156, 39, 176, 0.8)' },
            name: '不稳定焦点',
            hovertemplate: '不稳定焦点<extra></extra>'
        });

        // Saddle region (det < 0)
        traces.push({
            x: [-3, 3, 3, -3, -3],
            y: [-9, -9, 0, 0, -9],
            fill: 'toself',
            fillcolor: 'rgba(255, 152, 0, 0.3)',
            line: { color: 'rgba(255, 152, 0, 0.8)' },
            name: '鞍点',
            hovertemplate: '鞍点<extra></extra>'
        });

        // Center line (tr = 0, det > 0)
        traces.push({
            x: [0, 0],
            y: [0, 9],
            mode: 'lines',
            line: { color: 'rgba(255, 193, 7, 0.8)', width: 2, dash: 'dash' },
            name: '中心点',
            hovertemplate: '中心点<extra></extra>'
        });

        return traces;
    }

    updateMatrixFromSliders() {
        this.currentMatrix = [
            [parseFloat(document.getElementById('a11-slider').value) || 0,
             parseFloat(document.getElementById('a12-slider').value) || 0],
            [parseFloat(document.getElementById('a21-slider').value) || 0,
             parseFloat(document.getElementById('a22-slider').value) || 0]
        ];
    }

    setMatrix(matrix) {
        this.currentMatrix = matrix;
        
        // Update sliders
        document.getElementById('a11-slider').value = matrix[0][0];
        document.getElementById('a12-slider').value = matrix[0][1];
        document.getElementById('a21-slider').value = matrix[1][0];
        document.getElementById('a22-slider').value = matrix[1][1];
        
        // Update value displays
        document.getElementById('a11-value').textContent = matrix[0][0].toFixed(1);
        document.getElementById('a12-value').textContent = matrix[0][1].toFixed(1);
        document.getElementById('a21-value').textContent = matrix[1][0].toFixed(1);
        document.getElementById('a22-value').textContent = matrix[1][1].toFixed(1);
        
        this.updateAnalysis();
        this.generatePhasePortrait();
        this.updateEigenvaluePlot();
    }

    static computeEigenData(matrix) {
        const trace = matrix[0][0] + matrix[1][1];
        const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
        const discriminant = trace * trace - 4 * det;

        let eigenvalues;
        if (discriminant >= 0) {
            const lambda1 = (trace + Math.sqrt(discriminant)) / 2;
            const lambda2 = (trace - Math.sqrt(discriminant)) / 2;
            eigenvalues = [
                { real: lambda1, imag: 0 },
                { real: lambda2, imag: 0 }
            ];
        } else {
            const realPart = trace / 2;
            const imagPart = Math.sqrt(-discriminant) / 2;
            eigenvalues = [
                { real: realPart, imag: imagPart },
                { real: realPart, imag: -imagPart }
            ];
        }

        return { trace, det, discriminant, eigenvalues };
    }

    static classifyStability(trace, det, discriminant) {
        if (det < 0) return { code: 'saddle', label: '鞍点' };
        if (det > 0) {
            if (trace < 0) {
                return discriminant >= 0
                    ? { code: 'stable_node', label: '稳定节点' }
                    : { code: 'stable_focus', label: '稳定焦点' };
            }
            if (trace > 0) {
                return discriminant >= 0
                    ? { code: 'unstable_node', label: '不稳定节点' }
                    : { code: 'unstable_focus', label: '不稳定焦点' };
            }
            return { code: 'center', label: '中心点' };
        }
        return { code: 'degenerate', label: '退化情况' };
    }

    updateAnalysis() {
        const { trace, det, discriminant } = EnhancedPhasePortraitAnalyzer.computeEigenData(this.currentMatrix);
        const stability = EnhancedPhasePortraitAnalyzer.classifyStability(trace, det, discriminant);

        // Update analysis display
        document.getElementById('trace-display').textContent = trace.toFixed(3);
        document.getElementById('det-display').textContent = det.toFixed(3);
        document.getElementById('discriminant-display').textContent = discriminant.toFixed(3);

        document.getElementById('system-type-display').textContent = stability.label;

        // Update current point on stability map
        this.updateStabilityMap(trace, det);
    }

    updateStabilityMap(trace, det) {
        const tracePoint = {
            x: [trace],
            y: [det],
            mode: 'markers',
            marker: {
                size: 10,
                color: '#ff4081',
                symbol: 'circle'
            },
            name: '当前系统',
            hovertemplate: `tr(A)=${trace.toFixed(2)}, det(A)=${det.toFixed(2)}<extra></extra>`
        };

        Plotly.react('stabilityMap', [...this.createStabilityTraces(), tracePoint], {
            title: { text: '稳定性区域', font: { size: 12 } },
            xaxis: { title: 'tr(A)', titlefont: { size: 10 } },
            yaxis: { title: 'det(A)', titlefont: { size: 10 } }
        });
    }

    updateEigenvaluePlot() {
        const { trace, det, discriminant, eigenvalues } = EnhancedPhasePortraitAnalyzer.computeEigenData(this.currentMatrix);

        let eigenvalueTrace;
        if (discriminant >= 0) {
            const lambda1 = eigenvalues[0].real;
            const lambda2 = eigenvalues[1].real;
            eigenvalueTrace = {
                x: [lambda1, lambda2],
                y: [0, 0],
                mode: 'markers',
                marker: {
                    size: 12,
                    color: ['#ff4081', '#ff4081'],
                    symbol: 'circle'
                },
                name: '特征值',
                hovertemplate: 'λ=%{x}<extra></extra>'
            };
        } else {
            const realPart = eigenvalues[0].real;
            const imagPart = eigenvalues[0].imag;
            eigenvalueTrace = {
                x: [realPart, realPart],
                y: [imagPart, -imagPart],
                mode: 'markers',
                marker: {
                    size: 12,
                    color: ['#ff4081', '#ff4081'],
                    symbol: 'circle'
                },
                name: '特征值',
                hovertemplate: 'λ=%{x}+%{y}i<extra></extra>'
            };
        }

        Plotly.react('eigenvaluePlot', [eigenvalueTrace], {
            title: { text: '特征值轨迹', font: { size: 12 } },
            xaxis: { title: 'Re(λ)', titlefont: { size: 10 } },
            yaxis: { title: 'Im(λ)', titlefont: { size: 10 } }
        });
    }

    generatePhasePortrait() {
        const A = this.currentMatrix;
        const traces = [];

        // Vector field
        if (this.showVectorField) {
            const vectorField = this.createVectorField();
            traces.push(vectorField);
        }

        // Nullclines
        if (this.showNullclines) {
            const nullclines = this.createNullclines();
            traces.push(...nullclines);
        }

        // Eigenvectors
        if (this.showEigenvectors) {
            const eigenvectors = this.createEigenvectors();
            traces.push(...eigenvectors);
        }

        // Trajectories
        if (this.trajectories.length > 0) {
            traces.push(...this.trajectories);
        }

        Plotly.react('phasePortraitPlot', traces, this.phasePlotLayout, this.phasePlotConfig);
    }

    createVectorField() {
        const A = this.currentMatrix;
        const lineX = [];
        const lineY = [];
        const scale = 0.35;

        for (let i = -3; i <= 3; i += 0.5) {
            for (let j = -3; j <= 3; j += 0.5) {
                const u = A[0][0] * i + A[0][1] * j;
                const v = A[1][0] * i + A[1][1] * j;
                lineX.push(i, i + u * scale, null);
                lineY.push(j, j + v * scale, null);
            }
        }

        return {
            type: 'scattergl',
            mode: 'lines',
            x: lineX,
            y: lineY,
            line: { color: 'rgba(66, 165, 245, 0.85)', width: 1 },
            hoverinfo: 'skip',
            name: '向量场'
        };
    }

    createNullclines() {
        const A = this.currentMatrix;
        const traces = [];

        // x-nullcline (dx/dt = 0)
        if (Math.abs(A[0][1]) > 1e-10) {
            // Normal case: dx/dt = a11*x + a12*y = 0 => y = -a11/a12 * x
            const xNullcline = {
                x: [-3, 3],
                y: [-3, 3].map(y => -A[0][0] * y / A[0][1]),
                mode: 'lines',
                line: { color: 'lime', width: 2, dash: 'dash' },
                name: 'dx/dt=0',
                hovertemplate: 'x-nullcline<extra></extra>'
            };
            traces.push(xNullcline);
        } else if (Math.abs(A[0][0]) > 1e-10) {
            // Special case: a12 = 0, so dx/dt = a11*x = 0 => x = 0 (vertical line)
            const xNullcline = {
                x: [0, 0],
                y: [-3, 3],
                mode: 'lines',
                line: { color: 'lime', width: 2, dash: 'dash' },
                name: 'dx/dt=0 (x=0)',
                hovertemplate: 'x-nullcline: x=0<extra></extra>'
            };
            traces.push(xNullcline);
        }

        // y-nullcline (dy/dt = 0)
        if (Math.abs(A[1][1]) > 1e-10) {
            // Normal case: dy/dt = a21*x + a22*y = 0 => y = -a21/a22 * x
            const yNullcline = {
                x: [-3, 3],
                y: [-3, 3].map(x => -A[1][0] * x / A[1][1]),
                mode: 'lines',
                line: { color: 'magenta', width: 2, dash: 'dash' },
                name: 'dy/dt=0',
                hovertemplate: 'y-nullcline<extra></extra>'
            };
            traces.push(yNullcline);
        } else if (Math.abs(A[1][0]) > 1e-10) {
            // Special case: a22 = 0, so dy/dt = a21*x = 0 => x = 0 (vertical line)
            const yNullcline = {
                x: [0, 0],
                y: [-3, 3],
                mode: 'lines',
                line: { color: 'magenta', width: 2, dash: 'dash' },
                name: 'dy/dt=0 (x=0)',
                hovertemplate: 'y-nullcline: x=0<extra></extra>'
            };
            traces.push(yNullcline);
        }

        return traces;
    }

    createEigenvectors() {
        // Simplified eigenvector visualization
        const traces = [];
        
        // Add some basic direction indicators
        traces.push({
            x: [0, 1],
            y: [0, 0],
            mode: 'lines+markers',
            line: { color: 'cyan', width: 3 },
            marker: { size: 8, color: 'cyan' },
            name: '特征方向1'
        });

        traces.push({
            x: [0, 0],
            y: [0, 1],
            mode: 'lines+markers',
            line: { color: 'orange', width: 3 },
            marker: { size: 8, color: 'orange' },
            name: '特征方向2'
        });

        return traces;
    }

    addRandomTrajectory() {
        const x0 = (Math.random() - 0.5) * 6;
        const y0 = (Math.random() - 0.5) * 6;
        this.addTrajectory(x0, y0);
    }

    addTrajectoryAtClick(event) {
        const rect = event.target.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width * 6 - 3;
        const y = 3 - (event.clientY - rect.top) / rect.height * 6;
        this.addTrajectory(x, y);
    }

    addTrajectory(x0, y0) {
        const A = this.currentMatrix;
        const x = [x0];
        const y = [y0];

        // Simple Euler integration for trajectory
        for (let i = 0; i < 100; i++) {
            const dx = A[0][0] * x[i] + A[0][1] * y[i];
            const dy = A[1][0] * x[i] + A[1][1] * y[i];
            
            x.push(x[i] + dx * 0.1);
            y.push(y[i] + dy * 0.1);
        }

        const trajectory = {
            x: x,
            y: y,
            mode: 'lines',
            line: {
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                width: 2
            },
            name: `轨迹 (${x0.toFixed(1)}, ${y0.toFixed(1)})`,
            hovertemplate: `轨迹起点: (${x0.toFixed(2)}, ${y0.toFixed(2)})<extra></extra>`
        };

        this.trajectories.push(trajectory);
        this.generatePhasePortrait(); // Refresh display
    }

    clearTrajectories() {
        this.trajectories = [];
        this.generatePhasePortrait();
    }

    toggleButtonState(buttonId, isActive) {
        const button = document.getElementById(buttonId);
        if (isActive) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    }

    showInsight(message) {
        document.getElementById('currentInsight').textContent = message;
        
        // Highlight the insight briefly
        const insightElement = document.getElementById('currentInsight');
        insightElement.style.backgroundColor = 'rgba(102, 126, 234, 0.2)';
        setTimeout(() => {
            insightElement.style.backgroundColor = '';
        }, 2000);
    }

    // Tutorial methods
    showTutorial() {
        document.getElementById('tutorialSection').style.display = 'block';
        this.updateTutorialStep();
    }

    nextTutorialStep() {
        if (this.tutorialStep < this.maxTutorialSteps) {
            this.tutorialStep++;
            this.updateTutorialStep();
        }
    }

    prevTutorialStep() {
        if (this.tutorialStep > 1) {
            this.tutorialStep--;
            this.updateTutorialStep();
        }
    }

    updateTutorialStep() {
        document.querySelectorAll('.tutorial-step').forEach((step, index) => {
            if (index + 1 === this.tutorialStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Update button states
        document.getElementById('prevStep').disabled = this.tutorialStep === 1;
        document.getElementById('nextStep').disabled = this.tutorialStep === this.maxTutorialSteps;
    }

    closeTutorial() {
        document.getElementById('tutorialSection').style.display = 'none';
    }

    // Export methods
    exportAsImage() {
        const plot = document.getElementById('phasePortraitPlot');
        if (!plot) {
            this.showInsight('未找到相图元素');
            return;
        }

        Plotly.downloadImage(plot, {
            format: 'png',
            width: 800,
            height: 600,
            filename: 'phase_portrait'
        });
    }

    exportData() {
        const eigenData = EnhancedPhasePortraitAnalyzer.computeEigenData(this.currentMatrix);
        const data = {
            matrix: this.currentMatrix,
            eigen: {
                trace: eigenData.trace,
                determinant: eigenData.det,
                discriminant: eigenData.discriminant,
                eigenvalues: eigenData.eigenvalues
            },
            settings: {
                showVectorField: this.showVectorField,
                showNullclines: this.showNullclines,
                showEigenvectors: this.showEigenvectors,
                bifurcation: {
                    param: this.bifurcationSettings.param,
                    min: this.bifurcationSettings.min,
                    max: this.bifurcationSettings.max,
                    steps: this.bifurcationSettings.steps
                }
            },
            trajectories: this.trajectories.map(t => ({
                x: t.x,
                y: t.y,
                initial_point: [t.x[0], t.y[0]]
            })),
            bifurcation: this.bifurcationData,
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `phase_portrait_data_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    shareConfiguration() {
        const config = {
            matrix: this.currentMatrix,
            showVectorField: this.showVectorField,
            showNullclines: this.showNullclines,
            showEigenvectors: this.showEigenvectors,
            bifurcation: {
                param: this.bifurcationSettings.param,
                min: this.bifurcationSettings.min,
                max: this.bifurcationSettings.max,
                steps: this.bifurcationSettings.steps
            }
        };

        const encodedConfig = btoa(JSON.stringify(config));
        // URL-encode the Base64 string to handle +, /, = characters
        const urlSafeConfig = encodeURIComponent(encodedConfig);
        const shareUrl = `${window.location.origin}${window.location.pathname}?config=${urlSafeConfig}`;

        // Copy to clipboard with error handling
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    this.showInsight('配置链接已复制到剪贴板');
                })
                .catch(err => {
                    console.error('Failed to copy to clipboard:', err);
                    this.showInsight('复制失败，请手动复制链接：' + shareUrl);
                });
        } else {
            // Fallback for browsers without clipboard API
            this.showInsight('您的浏览器不支持自动复制，链接：' + shareUrl);
        }
    }

    findZeroCrossings(values, params) {
        const crossings = [];
        for (let i = 1; i < values.length; i++) {
            const v0 = values[i - 1];
            const v1 = values[i];
            if (v0 === 0) {
                crossings.push(params[i - 1]);
                continue;
            }
            if (v0 * v1 < 0) {
                const t = -v0 / (v1 - v0);
                const p = params[i - 1] + (params[i] - params[i - 1]) * t;
                crossings.push(p);
            }
        }
        return crossings;
    }

    generateBifurcationDiagram() {
        const btn = document.getElementById('generateBifurcation');
        if (btn) {
            btn.disabled = true;
            btn.dataset.originalText = btn.dataset.originalText || btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
        }

        const paramSelect = document.getElementById('bifurcationParam');
        const minInput = document.getElementById('paramMin');
        const maxInput = document.getElementById('paramMax');
        const stepsInput = document.getElementById('bifurcationSteps');

        const paramName = paramSelect ? paramSelect.value : 'a11';
        const paramMin = parseFloat(minInput?.value);
        const paramMax = parseFloat(maxInput?.value);
        let steps = parseInt(stepsInput?.value, 10);

        if (!Number.isFinite(paramMin) || !Number.isFinite(paramMax) || paramMin === paramMax) {
            this.showInsight('请输入有效的参数范围');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = btn.dataset.originalText;
            }
            return;
        }

        if (!Number.isFinite(steps)) steps = this.bifurcationSettings.steps;
        steps = Math.min(500, Math.max(20, steps));
        if (stepsInput) stepsInput.value = steps;

        const indexMap = { a11: [0, 0], a12: [0, 1], a21: [1, 0], a22: [1, 1] };
        const indices = indexMap[paramName] || [0, 0];

        const paramValues = [];
        const lambda1 = [];
        const lambda2 = [];
        const stability = [];

        for (let i = 0; i <= steps; i++) {
            const value = paramMin + (paramMax - paramMin) * (i / steps);
            const matrix = this.currentMatrix.map(row => [...row]);
            matrix[indices[0]][indices[1]] = value;

            const eigenData = EnhancedPhasePortraitAnalyzer.computeEigenData(matrix);
            paramValues.push(value);
            lambda1.push(eigenData.eigenvalues[0].real);
            lambda2.push(eigenData.eigenvalues[1].real);
            stability.push(EnhancedPhasePortraitAnalyzer.classifyStability(eigenData.trace, eigenData.det, eigenData.discriminant).code);
        }

        this.bifurcationData = {
            paramName,
            paramMin,
            paramMax,
            paramValues,
            lambda1,
            lambda2,
            stability,
            steps
        };
        this.bifurcationSettings = { param: paramName, min: paramMin, max: paramMax, steps };

        const allY = [...lambda1, ...lambda2];
        let minY = Math.min(...allY);
        let maxY = Math.max(...allY);
        if (!Number.isFinite(minY) || !Number.isFinite(maxY) || minY === maxY) {
            minY = -1;
            maxY = 1;
        } else {
            const pad = Math.max(0.1, Math.abs(maxY - minY) * 0.1);
            minY -= pad;
            maxY += pad;
        }

        const crossings = [
            ...this.findZeroCrossings(lambda1, paramValues),
            ...this.findZeroCrossings(lambda2, paramValues)
        ];

        const zeroLine = {
            x: [paramMin, paramMax],
            y: [0, 0],
            mode: 'lines',
            line: { color: '#9e9e9e', dash: 'dash' },
            hoverinfo: 'skip',
            name: 'Re(特征值)=0'
        };

        const crossingTraces = crossings.map((p, idx) => ({
            x: [p, p],
            y: [minY, maxY],
            mode: 'lines',
            line: { color: '#e91e63', dash: 'dot', width: 1.5 },
            name: idx === 0 ? 'Re(特征值) 穿过 0' : undefined,
            hovertemplate: `Re(特征值)=0 @ ${paramName}=${p.toFixed(3)}<extra></extra>`
        }));

        const layout = {
            ...this.bifurcationPlotLayout,
            xaxis: { title: `${paramName} 参数`, range: [paramMin, paramMax] },
            yaxis: { title: 'Re(特征值)', zeroline: false, range: [minY, maxY] },
            plot_bgcolor: '#f8f9fa',
            paper_bgcolor: '#ffffff'
        };

        const traces = [
            {
                x: paramValues,
                y: lambda1,
                mode: 'lines',
                line: { color: '#ff7043', width: 2 },
                name: '特征值1 (实部)'
            },
            {
                x: paramValues,
                y: lambda2,
                mode: 'lines',
                line: { color: '#26c6da', width: 2 },
                name: '特征值2 (实部)'
            },
            zeroLine,
            ...crossingTraces
        ];

        Plotly.react('bifurcationPlot', traces, layout, this.bifurcationPlotConfig);
        this.showInsight('分岔图已更新，标注了 Re(特征值) 穿零点');

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalText;
        }
    }

    restoreConfigurationFromQuery() {
        const params = new URLSearchParams(window.location.search);
        const encoded = params.get('config');
        if (!encoded) return;

        try {
            const decoded = JSON.parse(atob(decodeURIComponent(encoded)));
            if (decoded.matrix) {
                this.setMatrix(decoded.matrix);
            }
            if (typeof decoded.showVectorField === 'boolean') {
                this.showVectorField = decoded.showVectorField;
                this.toggleButtonState('toggleVectorField', this.showVectorField);
            }
            if (typeof decoded.showNullclines === 'boolean') {
                this.showNullclines = decoded.showNullclines;
                this.toggleButtonState('toggleNullclines', this.showNullclines);
            }
            if (typeof decoded.showEigenvectors === 'boolean') {
                this.showEigenvectors = decoded.showEigenvectors;
                this.toggleButtonState('toggleEigenvectors', this.showEigenvectors);
            }
            if (decoded.bifurcation) {
                const { param, min, max, steps } = decoded.bifurcation;
                const paramSelect = document.getElementById('bifurcationParam');
                const minInput = document.getElementById('paramMin');
                const maxInput = document.getElementById('paramMax');
                const stepsInput = document.getElementById('bifurcationSteps');
                if (paramSelect) paramSelect.value = param;
                if (minInput && Number.isFinite(min)) minInput.value = min;
                if (maxInput && Number.isFinite(max)) maxInput.value = max;
                if (stepsInput && Number.isFinite(steps)) stepsInput.value = steps;
                if (Number.isFinite(steps)) this.bifurcationSettings.steps = steps;
                if (Number.isFinite(min)) this.bifurcationSettings.min = min;
                if (Number.isFinite(max)) this.bifurcationSettings.max = max;
                if (param) this.bifurcationSettings.param = param;
            }
            this.showInsight('已加载链接配置');
        } catch (err) {
            console.error('Failed to restore shared configuration', err);
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedPhasePortraitAnalyzer();
});