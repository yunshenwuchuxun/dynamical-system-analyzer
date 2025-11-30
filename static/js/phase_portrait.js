// 相图页面JavaScript
class PhasePortraitGenerator {
    constructor() {
        this.currentMatrix = this.loadMatrixFromStorage() || [[0, 1], [-1, 0]];
        this.initializeEventListeners();
        this.setMatrixInputs();
    }

    loadMatrixFromStorage() {
        const stored = localStorage.getItem('currentMatrix');
        return stored ? JSON.parse(stored) : null;
    }

    initializeEventListeners() {
        // 生成相图按钮
        document.getElementById('generatePortraitBtn').addEventListener('click', () => {
            this.generatePhasePortrait();
        });

        // 矩阵输入变化
        ['a11', 'a12', 'a21', 'a22'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                this.updateMatrix();
            });
        });

        // 参数变化
        document.getElementById('gridDensity').addEventListener('input', (e) => {
            document.getElementById('densityValue').textContent = e.target.value;
        });

        // 不再自动生成相图,等待用户点击按钮
        // this.generatePhasePortrait();
    }

    setMatrixInputs() {
        if (this.currentMatrix) {
            document.getElementById('a11').value = this.currentMatrix[0][0];
            document.getElementById('a12').value = this.currentMatrix[0][1];
            document.getElementById('a21').value = this.currentMatrix[1][0];
            document.getElementById('a22').value = this.currentMatrix[1][1];
        }
    }

    updateMatrix() {
        this.currentMatrix = [
            [parseFloat(document.getElementById('a11').value) || 0,
             parseFloat(document.getElementById('a12').value) || 0],
            [parseFloat(document.getElementById('a21').value) || 0,
             parseFloat(document.getElementById('a22').value) || 0]
        ];
        // 保存到localStorage
        localStorage.setItem('currentMatrix', JSON.stringify(this.currentMatrix));
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    async generatePhasePortrait() {
        this.updateMatrix();
        this.showLoading();

        try {
            // 获取参数
            const xMin = parseFloat(document.getElementById('xMin').value) || -3.5;
            const xMax = parseFloat(document.getElementById('xMax').value) || 3.5;
            const yMin = parseFloat(document.getElementById('yMin').value) || -3.5;
            const yMax = parseFloat(document.getElementById('yMax').value) || 3.5;
            const gridDensity = parseInt(document.getElementById('gridDensity').value) || 20;

            const response = await fetch('/api/generate_phase_portrait', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    matrix: this.currentMatrix,
                    x_range: [xMin, xMax],
                    y_range: [yMin, yMax],
                    grid_size: gridDensity
                })
            });

            const data = await response.json();

            if (data.success) {
                this.displayPhasePortrait(data.image);
                this.updateSystemInfo();
            } else {
                this.displayError('生成相图失败: ' + data.error);
            }
        } catch (error) {
            this.displayError('网络错误，请检查连接: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    displayPhasePortrait(imageBase64) {
        const container = document.getElementById('portraitContainer');
        container.innerHTML = `<img src="data:image/png;base64,${imageBase64}" alt="相图" style="max-width: 100%; height: auto;">`;
    }

    displayError(message) {
        const container = document.getElementById('portraitContainer');
        container.innerHTML = `
            <div class="error-placeholder" style="color: #ff6b6b; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; margin-bottom: 20px; opacity: 1;"></i>
                <p style="font-size: 1.1rem;">${message}</p>
                <p style="margin-top: 10px; color: #999;">请检查输入参数后重试</p>
            </div>
        `;
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
                document.getElementById('portraitInfo').style.display = 'block';
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
}

// 页面加载完成后初始化
// 使用立即执行函数,兼容DOM已加载和未加载的情况
(function() {
    function init() {
        new PhasePortraitGenerator();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM已经加载完成,直接初始化
        init();
    }
})();