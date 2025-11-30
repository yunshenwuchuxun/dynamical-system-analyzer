// 离散动力学应用 - JavaScript 控制器

// 全局变量
let charts = {};

// 检查Chart.js是否加载成功
function checkChartJS() {
    if (typeof Chart === 'undefined') {
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #ff5252, #ff1744); color: white; padding: 20px 40px; border-radius: 15px; z-index: 10000; box-shadow: 0 8px 32px rgba(255, 82, 82, 0.5); font-size: 16px; font-weight: bold; text-align: center;';
        errorMsg.innerHTML = '⚠️ Chart.js 库加载失败<br><small style="font-size: 14px; font-weight: normal; margin-top: 10px; display: block;">请检查网络连接或使用本地版本</small>';
        document.body.appendChild(errorMsg);
        setTimeout(() => errorMsg.remove(), 8000);
        return false;
    }
    return true;
}

// 显示加载状态
function showLoading(button, text = '计算中...') {
    if (!button) return null;
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.style.opacity = '0.6';
    button.style.cursor = 'wait';
    button.innerHTML = `<span style="display: inline-block; animation: pulse 1.5s infinite;">⏳ ${text}</span>`;
    return originalHTML;
}

// 隐藏加载状态
function hideLoading(button, originalHTML) {
    if (!button || !originalHTML) return;
    button.disabled = false;
    button.style.opacity = '1';
    button.style.cursor = 'pointer';
    button.innerHTML = originalHTML;
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
`;
document.head.appendChild(style);

// 标签切换函数
function switchTab(evt, tabName) {
    // 隐藏所有标签内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // 移除所有标签的active类
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // 显示选中的标签
    document.getElementById(tabName).classList.add('active');
    evt.target.classList.add('active');
}

// 初始化参数显示
(function() {
    function initParameterListeners() {
        // 种群模型参数
        const popR = document.getElementById('pop_r');
        if (popR) {
            popR.addEventListener('input', (e) => {
                document.getElementById('pop_r_val').textContent = e.target.value;
            });
        }

        // 传染病模型参数
        const epiBeta = document.getElementById('epi_beta');
        if (epiBeta) {
            epiBeta.addEventListener('input', (e) => {
                document.getElementById('epi_beta_val').textContent = parseFloat(e.target.value).toFixed(4);
            });
        }

        const epiGamma = document.getElementById('epi_gamma');
        if (epiGamma) {
            epiGamma.addEventListener('input', (e) => {
                document.getElementById('epi_gamma_val').textContent = e.target.value;
            });
        }

        // 经济模型参数
        const ecoBeta = document.getElementById('eco_beta');
        if (ecoBeta) {
            ecoBeta.addEventListener('input', (e) => {
                document.getElementById('eco_beta_val').textContent = e.target.value;
            });
        }

        const ecoDelta = document.getElementById('eco_delta');
        if (ecoDelta) {
            ecoDelta.addEventListener('input', (e) => {
                document.getElementById('eco_delta_val').textContent = e.target.value;
            });
        }

        // 捕食者模型参数
        const predR = document.getElementById('pred_r');
        if (predR) {
            predR.addEventListener('input', (e) => {
                document.getElementById('pred_r_val').textContent = e.target.value;
            });
        }

        const predAlpha = document.getElementById('pred_alpha');
        if (predAlpha) {
            predAlpha.addEventListener('input', (e) => {
                document.getElementById('pred_alpha_val').textContent = e.target.value;
            });
        }

        const predBeta = document.getElementById('pred_beta');
        if (predBeta) {
            predBeta.addEventListener('input', (e) => {
                document.getElementById('pred_beta_val').textContent = e.target.value;
            });
        }

        const predM = document.getElementById('pred_m');
        if (predM) {
            predM.addEventListener('input', (e) => {
                document.getElementById('pred_m_val').textContent = e.target.value;
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initParameterListeners);
    } else {
        initParameterListeners();
    }
})();

// ========== 1. 种群动态模型 ==========

function runPopulation() {
    if (!checkChartJS()) return;

    const r = parseFloat(document.getElementById('pop_r').value);
    const K = parseFloat(document.getElementById('pop_K').value);
    const N0 = parseFloat(document.getElementById('pop_N0').value);

    // 本地计算Ricker模型
    const steps = 100;
    const N = [N0];

    for (let t = 0; t < steps; t++) {
        const Nt = N[t];
        const Nt1 = Nt * Math.exp(r * (1 - Nt / K));
        N.push(Nt1);
    }

    // 绘制时间序列
    plotTimeSeries('pop_timeseries', N, '种群数量', 'rgb(0, 201, 255)');

    // 绘制相图
    plotPhasePortrait('pop_phase', N, 'N_t', 'N_{t+1}');

    // 显示分析结果
    displayPopulationInfo(N, r, K);
}

function bifurcationPopulation() {
    if (!checkChartJS()) return;

    const btn = event.target;
    const originalHTML = showLoading(btn, '生成分岔图...');

    const K = parseFloat(document.getElementById('pop_K').value);
    const N0 = parseFloat(document.getElementById('pop_N0').value);

    // 优化：减少计算量
    const rValues = [];
    const nValues = [];
    let currentR = 0.1;
    const rStep = 0.05;  // 从0.01增加到0.05，减少计算量
    const rMax = 3.5;

    // 分批处理函数
    function processBatch() {
        const batchSize = 10;  // 每批处理10个r值
        let batchCount = 0;

        while (currentR <= rMax && batchCount < batchSize) {
            let N = N0;

            // 优化：减少暂态步数
            for (let t = 0; t < 100; t++) {  // 从200减少到100
                N = N * Math.exp(currentR * (1 - N / K));
            }

            // 优化：减少采样步数
            for (let t = 0; t < 30; t++) {  // 从50减少到30
                N = N * Math.exp(currentR * (1 - N / K));
                rValues.push(currentR);
                nValues.push(N);
            }

            currentR += rStep;
            batchCount++;
        }

        // 如果还有数据要处理，继续下一批
        if (currentR <= rMax) {
            requestAnimationFrame(processBatch);
        } else {
            // 所有数据处理完毕，绘制图表
            plotBifurcation('pop_phase', rValues, nValues, 'r (增长率)', '种群数量 N');
            hideLoading(btn, originalHTML);
        }
    }

    // 开始分批处理
    requestAnimationFrame(processBatch);
}

function displayPopulationInfo(N, r, K) {
    const infoDiv = document.getElementById('pop_info');

    // 计算统计量
    const finalN = N[N.length - 1];
    const maxN = Math.max(...N);
    const minN = Math.min(...N);
    const avgN = N.reduce((a, b) => a + b, 0) / N.length;

    // 判断稳定性
    const last10 = N.slice(-10);
    const variance = last10.reduce((sum, val) => sum + Math.pow(val - avgN, 2), 0) / 10;
    const stability = variance < 1 ? '稳定' : (variance < 100 ? '周期振荡' : '混沌');

    infoDiv.innerHTML = `
        <div class="info-item">
            <strong>最终种群数</strong>
            <span>${finalN.toFixed(2)}</span>
        </div>
        <div class="info-item">
            <strong>承载力</strong>
            <span>${K}</span>
        </div>
        <div class="info-item">
            <strong>最大值</strong>
            <span>${maxN.toFixed(2)}</span>
        </div>
        <div class="info-item">
            <strong>最小值</strong>
            <span>${minN.toFixed(2)}</span>
        </div>
        <div class="info-item">
            <strong>平均值</strong>
            <span>${avgN.toFixed(2)}</span>
        </div>
        <div class="info-item">
            <strong>系统状态</strong>
            <span style="color: ${stability === '稳定' ? '#92fe9d' : (stability === '周期振荡' ? '#ffeb3b' : '#ff5252')}">${stability}</span>
        </div>
    `;
}

// ========== 2. 传染病模型 ==========

function runEpidemic() {
    if (!checkChartJS()) return;

    const beta = parseFloat(document.getElementById('epi_beta').value);
    const gamma = parseFloat(document.getElementById('epi_gamma').value);
    const N = parseFloat(document.getElementById('epi_N').value);
    const I0 = parseFloat(document.getElementById('epi_I0').value);

    // 初始条件
    let S = N - I0;
    let I = I0;
    let R = 0;

    const S_data = [S];
    const I_data = [I];
    const R_data = [R];

    const steps = 200;

    for (let t = 0; t < steps; t++) {
        const newInfections = beta * S * I;
        const newRecoveries = gamma * I;

        S = Math.max(0, S - newInfections);
        I = Math.max(0, I + newInfections - newRecoveries);
        R = Math.max(0, R + newRecoveries);

        S_data.push(S);
        I_data.push(I);
        R_data.push(R);

        if (I < 0.1) break;
    }

    // 绘制S-I-R时间序列
    plotSIR('epi_timeseries', S_data, I_data, R_data);

    // 绘制S-I相图
    plotSIPhase('epi_phase', S_data, I_data);

    // 显示疫情指标
    displayEpidemicInfo(S_data, I_data, R_data, beta, gamma, N);
}

function varyParameters() {
    if (!checkChartJS()) return;

    const btn = event.target;
    const originalHTML = showLoading(btn, '参数扫描中...');

    const N = parseFloat(document.getElementById('epi_N').value);
    const I0 = parseFloat(document.getElementById('epi_I0').value);
    const gamma = parseFloat(document.getElementById('epi_gamma').value);

    // 优化：减少计算量
    const betaValues = [];
    const peakValues = [];
    let currentBeta = 0.0001;
    const betaStep = 0.00005;  // 从0.00002增加到0.00005
    const betaMax = 0.001;

    // 分批处理函数
    function processBatch() {
        const batchSize = 5;  // 每批处理5个beta值
        let batchCount = 0;

        while (currentBeta <= betaMax && batchCount < batchSize) {
            let S = N - I0;
            let I = I0;
            let R = 0;
            let maxI = I0;

            // 优化：减少迭代步数并提前终止
            for (let t = 0; t < 150; t++) {  // 从200减少到150
                const newInfections = currentBeta * S * I;
                const newRecoveries = gamma * I;

                S = Math.max(0, S - newInfections);
                I = Math.max(0, I + newInfections - newRecoveries);
                R = Math.max(0, R + newRecoveries);

                maxI = Math.max(maxI, I);

                // 提前终止条件
                if (I < 0.5 || S < 1) break;
            }

            betaValues.push(currentBeta);
            peakValues.push(maxI);

            currentBeta += betaStep;
            batchCount++;
        }

        // 如果还有数据要处理，继续下一批
        if (currentBeta <= betaMax) {
            requestAnimationFrame(processBatch);
        } else {
            // 所有数据处理完毕，绘制图表
            plotParameterScan('epi_phase', betaValues, peakValues, 'β (传染率)', '峰值感染人数');
            hideLoading(btn, originalHTML);
        }
    }

    // 开始分批处理
    requestAnimationFrame(processBatch);
}

function displayEpidemicInfo(S_data, I_data, R_data, beta, gamma, N) {
    const infoDiv = document.getElementById('epi_info');

    const R0 = (beta * N) / gamma;
    const maxI = Math.max(...I_data);
    const maxIIndex = I_data.indexOf(maxI);
    const finalR = R_data[R_data.length - 1];
    const attackRate = (finalR / N * 100).toFixed(2);

    infoDiv.innerHTML = `
        <div class="info-item">
            <strong>基本再生数 R₀</strong>
            <span style="color: ${R0 > 1 ? '#ff5252' : '#92fe9d'}">${R0.toFixed(3)}</span>
        </div>
        <div class="info-item">
            <strong>峰值感染人数</strong>
            <span>${maxI.toFixed(0)}</span>
        </div>
        <div class="info-item">
            <strong>峰值时间</strong>
            <span>第 ${maxIIndex} 天</span>
        </div>
        <div class="info-item">
            <strong>最终康复人数</strong>
            <span>${finalR.toFixed(0)}</span>
        </div>
        <div class="info-item">
            <strong>侵袭率</strong>
            <span>${attackRate}%</span>
        </div>
        <div class="info-item">
            <strong>疫情状态</strong>
            <span style="color: ${R0 > 1 ? '#ff5252' : '#92fe9d'}">${R0 > 1 ? '爆发' : '受控'}</span>
        </div>
    `;
}

// ========== 3. 经济周期模型 ==========

function runEconomy() {
    if (!checkChartJS()) return;

    const beta = parseFloat(document.getElementById('eco_beta').value);
    const delta = parseFloat(document.getElementById('eco_delta').value);
    const P0 = parseFloat(document.getElementById('eco_P0').value);

    // 设定供需方程参数
    const alpha = 10;  // 供给截距
    const gamma = 100; // 需求截距

    // 均衡价格和产量
    const P_eq = (gamma - alpha) / (beta + delta);
    const Q_eq = alpha + beta * P_eq;

    // 迭代模拟
    const P_data = [P0];
    const Q_data = [alpha + beta * P0];  // 初始产量
    const steps = 50;

    for (let t = 0; t < steps; t++) {
        const P = P_data[t];
        const Q_s = alpha + beta * P;  // 供给
        const P_next = (gamma - Q_s) / delta;  // 从需求方程求价格

        P_data.push(P_next);
        Q_data.push(alpha + beta * P_next);  // 添加对应的产量
    }

    // 绘制价格和产量时间序列
    plotPriceQuantity('eco_timeseries', P_data, Q_data);

    // 显示经济指标
    displayEconomyInfo(P_data, Q_data, P_eq, Q_eq, beta, delta);
}

function cobwebEconomy() {
    if (!checkChartJS()) return;

    const beta = parseFloat(document.getElementById('eco_beta').value);
    const delta = parseFloat(document.getElementById('eco_delta').value);
    const P0 = parseFloat(document.getElementById('eco_P0').value);

    const alpha = 10;
    const gamma = 100;

    // 生成蛛网图
    plotCobwebDiagram('eco_cobweb', alpha, beta, gamma, delta, P0);
}

function displayEconomyInfo(P_data, Q_data, P_eq, Q_eq, beta, delta) {
    const infoDiv = document.getElementById('eco_info');

    const finalP = P_data[P_data.length - 1];
    const finalQ = Q_data[Q_data.length - 1];

    // 判断稳定性
    const slope = -beta / delta;
    const stability = Math.abs(slope) < 1 ? '收敛' : (Math.abs(slope) === 1 ? '中性' : '发散');

    infoDiv.innerHTML = `
        <div class="info-item">
            <strong>均衡价格</strong>
            <span>${P_eq.toFixed(2)}</span>
        </div>
        <div class="info-item">
            <strong>均衡产量</strong>
            <span>${Q_eq.toFixed(2)}</span>
        </div>
        <div class="info-item">
            <strong>当前价格</strong>
            <span>${finalP.toFixed(2)}</span>
        </div>
        <div class="info-item">
            <strong>当前产量</strong>
            <span>${finalQ.toFixed(2)}</span>
        </div>
        <div class="info-item">
            <strong>供需比</strong>
            <span>${(beta/delta).toFixed(3)}</span>
        </div>
        <div class="info-item">
            <strong>市场状态</strong>
            <span style="color: ${stability === '收敛' ? '#92fe9d' : '#ff5252'}">${stability}</span>
        </div>
    `;
}

// ========== 4. 捕食者-被捕食者模型 ==========

function runPredator() {
    if (!checkChartJS()) return;

    const r = parseFloat(document.getElementById('pred_r').value);
    const alpha = parseFloat(document.getElementById('pred_alpha').value);
    const beta = parseFloat(document.getElementById('pred_beta').value);
    const m = parseFloat(document.getElementById('pred_m').value);

    // 初始条件
    let x = 0.5;  // 猎物
    let y = 0.3;  // 捕食者

    const x_data = [x];
    const y_data = [y];

    const steps = 200;

    for (let t = 0; t < steps; t++) {
        const x_next = x + r * x * (1 - x) - alpha * x * y;
        const y_next = y + beta * x * y - m * y;

        // 防止负值
        x = Math.max(0, x_next);
        y = Math.max(0, y_next);

        x_data.push(x);
        y_data.push(y);

        // 检查灭绝
        if (x < 0.001 && y < 0.001) break;
    }

    // 绘制时间序列
    plotPredatorPrey('pred_timeseries', x_data, y_data);

    // 显示生态指标
    displayPredatorInfo(x_data, y_data, r, alpha, beta, m);
}

function phasePredator() {
    if (!checkChartJS()) return;

    const r = parseFloat(document.getElementById('pred_r').value);
    const alpha = parseFloat(document.getElementById('pred_alpha').value);
    const beta = parseFloat(document.getElementById('pred_beta').value);
    const m = parseFloat(document.getElementById('pred_m').value);

    // 多条轨迹的相图
    const trajectories = [];
    const initialConditions = [
        [0.3, 0.2], [0.5, 0.3], [0.7, 0.4], [0.4, 0.5], [0.6, 0.25]
    ];

    initialConditions.forEach(([x0, y0]) => {
        let x = x0;
        let y = y0;
        const trajectory = {x: [x], y: [y]};

        for (let t = 0; t < 150; t++) {
            const x_next = x + r * x * (1 - x) - alpha * x * y;
            const y_next = y + beta * x * y - m * y;

            x = Math.max(0, x_next);
            y = Math.max(0, y_next);

            trajectory.x.push(x);
            trajectory.y.push(y);

            if (x < 0.001 && y < 0.001) break;
        }

        trajectories.push(trajectory);
    });

    plotPredatorPhase('pred_phase', trajectories);
}

function displayPredatorInfo(x_data, y_data, r, alpha, beta, m) {
    const infoDiv = document.getElementById('pred_info');

    const finalX = x_data[x_data.length - 1];
    const finalY = y_data[y_data.length - 1];
    const maxX = Math.max(...x_data);
    const maxY = Math.max(...y_data);

    // 计算平衡点
    const x_eq = m / beta;
    const y_eq = r * (1 - x_eq) / alpha;

    const status = (finalX < 0.01 || finalY < 0.01) ? '灭绝' :
                   (Math.abs(finalX - x_eq) < 0.1 && Math.abs(finalY - y_eq) < 0.1) ? '平衡' : '振荡';

    infoDiv.innerHTML = `
        <div class="info-item">
            <strong>猎物数量</strong>
            <span>${finalX.toFixed(3)}</span>
        </div>
        <div class="info-item">
            <strong>捕食者数量</strong>
            <span>${finalY.toFixed(3)}</span>
        </div>
        <div class="info-item">
            <strong>猎物峰值</strong>
            <span>${maxX.toFixed(3)}</span>
        </div>
        <div class="info-item">
            <strong>捕食者峰值</strong>
            <span>${maxY.toFixed(3)}</span>
        </div>
        <div class="info-item">
            <strong>平衡点</strong>
            <span>(${x_eq.toFixed(3)}, ${y_eq.toFixed(3)})</span>
        </div>
        <div class="info-item">
            <strong>生态状态</strong>
            <span style="color: ${status === '平衡' ? '#92fe9d' : (status === '振荡' ? '#ffeb3b' : '#ff5252')}">${status}</span>
        </div>
    `;
}

// ========== 绘图辅助函数 ==========

function plotTimeSeries(canvasId, data, label, color) {
    const ctx = document.getElementById(canvasId);

    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: data.length}, (_, i) => i),
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {color: '#fff'}
                }
            },
            scales: {
                x: {
                    title: {display: true, text: '时间步', color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                },
                y: {
                    title: {display: true, text: label, color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                }
            }
        }
    });
}

function plotPhasePortrait(canvasId, N, xLabel, yLabel) {
    const ctx = document.getElementById(canvasId);

    const x_data = N.slice(0, -1);
    const y_data = N.slice(1);

    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: '相图',
                data: x_data.map((x, i) => ({x: x, y: y_data[i]})),
                borderColor: 'rgb(146, 254, 157)',
                backgroundColor: 'rgba(146, 254, 157, 0.5)',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {labels: {color: '#fff'}}
            },
            scales: {
                x: {
                    title: {display: true, text: xLabel, color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                },
                y: {
                    title: {display: true, text: yLabel, color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                }
            }
        }
    });
}

function plotBifurcation(canvasId, rValues, nValues, xLabel, yLabel) {
    const ctx = document.getElementById(canvasId);

    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: '分岔图',
                data: rValues.map((r, i) => ({x: r, y: nValues[i]})),
                borderColor: 'rgb(255, 193, 7)',
                backgroundColor: 'rgba(255, 193, 7, 0.5)',
                pointRadius: 0.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {labels: {color: '#fff'}}
            },
            scales: {
                x: {
                    title: {display: true, text: xLabel, color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                },
                y: {
                    title: {display: true, text: yLabel, color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                }
            }
        }
    });
}

function plotSIR(canvasId, S_data, I_data, R_data) {
    const ctx = document.getElementById(canvasId);

    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: S_data.length}, (_, i) => i),
            datasets: [
                {
                    label: '易感者 (S)',
                    data: S_data,
                    borderColor: 'rgb(0, 201, 255)',
                    backgroundColor: 'rgba(0, 201, 255, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0
                },
                {
                    label: '感染者 (I)',
                    data: I_data,
                    borderColor: 'rgb(255, 82, 82)',
                    backgroundColor: 'rgba(255, 82, 82, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0
                },
                {
                    label: '康复者 (R)',
                    data: R_data,
                    borderColor: 'rgb(146, 254, 157)',
                    backgroundColor: 'rgba(146, 254, 157, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {labels: {color: '#fff'}}
            },
            scales: {
                x: {
                    title: {display: true, text: '时间 (天)', color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                },
                y: {
                    title: {display: true, text: '人数', color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                }
            }
        }
    });
}

function plotSIPhase(canvasId, S_data, I_data) {
    const ctx = document.getElementById(canvasId);

    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'S-I 相图',
                data: S_data.map((s, i) => ({x: s, y: I_data[i]})),
                borderColor: 'rgb(156, 39, 176)',
                backgroundColor: 'rgba(156, 39, 176, 0.5)',
                pointRadius: 2,
                showLine: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {labels: {color: '#fff'}}
            },
            scales: {
                x: {
                    title: {display: true, text: '易感者 S', color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                },
                y: {
                    title: {display: true, text: '感染者 I', color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                }
            }
        }
    });
}

function plotParameterScan(canvasId, paramValues, resultValues, xLabel, yLabel) {
    const ctx = document.getElementById(canvasId);

    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: paramValues,
            datasets: [{
                label: '参数扫描',
                data: resultValues,
                borderColor: 'rgb(255, 193, 7)',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                borderWidth: 2,
                pointRadius: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {labels: {color: '#fff'}}
            },
            scales: {
                x: {
                    title: {display: true, text: xLabel, color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                },
                y: {
                    title: {display: true, text: yLabel, color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                }
            }
        }
    });
}

function plotPriceQuantity(canvasId, P_data, Q_data) {
    const ctx = document.getElementById(canvasId);

    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: P_data.length}, (_, i) => i),
            datasets: [
                {
                    label: '价格 P',
                    data: P_data,
                    borderColor: 'rgb(0, 201, 255)',
                    backgroundColor: 'rgba(0, 201, 255, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    yAxisID: 'y'
                },
                {
                    label: '产量 Q',
                    data: Q_data,
                    borderColor: 'rgb(255, 193, 7)',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {labels: {color: '#fff'}}
            },
            scales: {
                x: {
                    title: {display: true, text: '时间', color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    title: {display: true, text: '价格', color: 'rgb(0, 201, 255)'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: {display: true, text: '产量', color: 'rgb(255, 193, 7)'},
                    ticks: {color: '#fff'},
                    grid: {display: false}
                }
            }
        }
    });
}

function plotCobwebDiagram(canvasId, alpha, beta, gamma, delta, P0) {
    const ctx = document.getElementById(canvasId);

    // 计算均衡点
    const P_eq = (gamma - alpha) / (beta + delta);
    const Q_eq = alpha + beta * P_eq;

    // 生成迭代轨迹
    const P_data = [P0];
    const Q_data = [alpha + beta * P0];
    const steps = 50;

    for (let t = 0; t < steps; t++) {
        const P = P_data[t];
        const Q_s = alpha + beta * P;
        const P_next = (gamma - Q_s) / delta;
        P_data.push(P_next);
        Q_data.push(alpha + beta * P_next);
    }

    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: '价格-产量轨迹',
                    data: Q_data.map((q, i) => ({x: q, y: P_data[i]})),
                    borderColor: 'rgb(0, 201, 255)',
                    backgroundColor: 'rgba(0, 201, 255, 0.1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: Q_data.map((_, i) => {
                        const intensity = i / Q_data.length;
                        return `rgba(${Math.floor(255 * intensity)}, ${Math.floor(201 * (1-intensity))}, 255, 0.8)`;
                    }),
                    showLine: true,
                    tension: 0.3
                },
                {
                    label: '均衡点',
                    data: [{x: Q_eq, y: P_eq}],
                    borderColor: 'rgb(146, 254, 157)',
                    backgroundColor: 'rgb(146, 254, 157)',
                    borderWidth: 3,
                    pointRadius: 8,
                    pointStyle: 'star'
                },
                {
                    label: '初始点',
                    data: [{x: Q_data[0], y: P_data[0]}],
                    borderColor: 'rgb(255, 193, 7)',
                    backgroundColor: 'rgb(255, 193, 7)',
                    borderWidth: 3,
                    pointRadius: 6,
                    pointStyle: 'circle'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {labels: {color: '#fff'}},
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Q: ${context.parsed.x.toFixed(2)}, P: ${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {display: true, text: '产量 Q', color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                },
                y: {
                    title: {display: true, text: '价格 P', color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                }
            }
        }
    });
}

function plotPredatorPrey(canvasId, x_data, y_data) {
    const ctx = document.getElementById(canvasId);

    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: x_data.length}, (_, i) => i),
            datasets: [
                {
                    label: '猎物 (x)',
                    data: x_data,
                    borderColor: 'rgb(76, 175, 80)',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0
                },
                {
                    label: '捕食者 (y)',
                    data: y_data,
                    borderColor: 'rgb(244, 67, 54)',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {labels: {color: '#fff'}}
            },
            scales: {
                x: {
                    title: {display: true, text: '时间步', color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                },
                y: {
                    title: {display: true, text: '种群密度', color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                }
            }
        }
    });
}

function plotPredatorPhase(canvasId, trajectories) {
    const ctx = document.getElementById(canvasId);

    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    const colors = [
        'rgb(0, 201, 255)',
        'rgb(255, 193, 7)',
        'rgb(156, 39, 176)',
        'rgb(76, 175, 80)',
        'rgb(255, 82, 82)'
    ];

    const datasets = trajectories.map((traj, idx) => ({
        label: `轨迹 ${idx + 1}`,
        data: traj.x.map((x, i) => ({x: x, y: traj.y[i]})),
        borderColor: colors[idx % colors.length],
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        showLine: true
    }));

    charts[canvasId] = new Chart(ctx, {
        type: 'scatter',
        data: {datasets: datasets},
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {labels: {color: '#fff'}}
            },
            scales: {
                x: {
                    title: {display: true, text: '猎物密度 (x)', color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                },
                y: {
                    title: {display: true, text: '捕食者密度 (y)', color: '#fff'},
                    ticks: {color: '#fff'},
                    grid: {color: '#333'}
                }
            }
        }
    });
}
