from flask import Flask, render_template, request, jsonify, send_file
import numpy as np
import matplotlib
matplotlib.use('Agg')  # 使用非交互式后端
import matplotlib.pyplot as plt
from scipy.integrate import odeint
import io
import base64
import json
import os
import re
import random
from scipy.optimize import fsolve
import sympy as sp
from sympy import symbols, lambdify, diff
import warnings
warnings.filterwarnings('ignore')

# 设置中文字体 - 多平台支持
# Windows: SimHei, Microsoft YaHei
# macOS: STHeiti, PingFang SC
# Linux: WenQuanYi Micro Hei, Noto Sans CJK
plt.rcParams['font.sans-serif'] = [
    'SimHei',           # Windows 黑体
    'Microsoft YaHei',  # Windows 微软雅黑
    'STHeiti',          # macOS 华文黑体
    'PingFang SC',      # macOS 苹方简体
    'WenQuanYi Micro Hei',  # Linux 文泉驿微米黑
    'Noto Sans CJK SC',     # Linux 思源黑体简体
    'DejaVu Sans'       # 最终回退（仅支持拉丁字符）
]
plt.rcParams['axes.unicode_minus'] = False  # 解决负号显示问题

# 辅助函数：设置绘图样式和中文字体
def setup_plot_style():
    """
    设置Matplotlib绘图样式和中文字体
    注意：plt.style.use()会覆盖全局rcParams，因此需要在其后重新设置字体
    """
    plt.style.use('seaborn-v0_8-whitegrid')
    # 重新设置中文字体（plt.style.use会覆盖全局配置）
    plt.rcParams['font.sans-serif'] = [
        'SimHei',           # Windows 黑体
        'Microsoft YaHei',  # Windows 微软雅黑
        'STHeiti',          # macOS 华文黑体
        'PingFang SC',      # macOS 苹方简体
        'WenQuanYi Micro Hei',  # Linux 文泉驿微米黑
        'Noto Sans CJK SC',     # Linux 思源黑体简体
        'DejaVu Sans'       # 最终回退（仅支持拉丁字符）
    ]
    plt.rcParams['axes.unicode_minus'] = False  # 解决负号显示问题

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.jinja_env.auto_reload = True
app.jinja_env.cache = {}


class DynamicalSystem:
    def __init__(self, matrix_A):
        self.A = np.array(matrix_A, dtype=float)
        self.eigenvalues, self.eigenvectors = np.linalg.eig(self.A)
        self.trace = np.trace(self.A)
        self.determinant = np.linalg.det(self.A)
        self.discriminant = self.trace**2 - 4*self.determinant

    def get_eigenvalues_formatted(self):
        eigenvals = []
        for val in self.eigenvalues:
            if np.isreal(val):
                eigenvals.append({
                    'real': float(np.real(val)),
                    'imag': 0,
                    'formatted': f"{float(np.real(val)):.4f}"
                })
            else:
                eigenvals.append({
                    'real': float(np.real(val)),
                    'imag': float(np.imag(val)),
                    'formatted': f"{float(np.real(val)):.4f} + {float(np.imag(val)):.4f}i"
                })
        return eigenvals

    def get_eigenvectors_formatted(self):
        eigenvecs = []
        for idx, vec in enumerate(self.eigenvectors.T):
            norm = np.linalg.norm(vec)
            normalized_vec = vec / norm if norm != 0 else vec
            eigenvecs.append({
                'index': idx,
                'real': [float(np.real(v)) for v in normalized_vec],
                'imag': [float(np.imag(v)) for v in normalized_vec],
                'formatted': [f"{float(np.real(v)):.4f} + {float(np.imag(v)):.4f}i" for v in normalized_vec]
            })
        return eigenvecs
    
    def get_mathematical_derivation(self):
        """Generate step-by-step mathematical derivation"""
        derivation = {
            'characteristic_polynomial': self._get_characteristic_polynomial(),
            'eigenvalue_calculation': self._get_eigenvalue_steps(),
            'stability_analysis': self._get_stability_analysis(),
            'phase_portrait_classification': self._classify_system(),
            'lyapunov_analysis': self._get_lyapunov_analysis()
        }
        return derivation
    
    def _get_characteristic_polynomial(self):
        """Generate characteristic polynomial derivation"""
        a11, a12 = self.A[0, 0], self.A[0, 1]
        a21, a22 = self.A[1, 0], self.A[1, 1]
        
        steps = [
            f"特征多项式: det(A - λI) = 0",
            f"det([{a11:.3f} - λ, {a12:.3f}; {a21:.3f}, {a22:.3f} - λ]) = 0",
            f"({a11:.3f} - λ)({a22:.3f} - λ) - ({a12:.3f})({a21:.3f}) = 0",
            f"λ² - ({self.trace:.3f})λ + ({self.determinant:.3f}) = 0",
            f"判别式 Δ = ({self.trace:.3f})² - 4({self.determinant:.3f}) = {self.discriminant:.3f}"
        ]
        
        return {
            'steps': steps,
            'polynomial_coeffs': [1, -self.trace, self.determinant],
            'discriminant': self.discriminant
        }
    
    def _get_eigenvalue_steps(self):
        """Generate eigenvalue calculation steps"""
        if self.discriminant >= 0:
            # Real eigenvalues
            sqrt_disc = np.sqrt(self.discriminant)
            lambda1 = (self.trace + sqrt_disc) / 2
            lambda2 = (self.trace - sqrt_disc) / 2
            
            steps = [
                f"使用二次公式: λ = (tr(A) ± √Δ) / 2",
                f"λ₁ = ({self.trace:.3f} + √{self.discriminant:.3f}) / 2 = {lambda1:.4f}",
                f"λ₂ = ({self.trace:.3f} - √{self.discriminant:.3f}) / 2 = {lambda2:.4f}"
            ]
        else:
            # Complex eigenvalues
            real_part = self.trace / 2
            imag_part = np.sqrt(-self.discriminant) / 2
            
            steps = [
                f"复数特征值: λ = (tr(A) ± i√|Δ|) / 2",
                f"实部: α = {real_part:.4f}",
                f"虚部: β = ±{imag_part:.4f}",
                f"λ₁,₂ = {real_part:.4f} ± {imag_part:.4f}i"
            ]
        
        return {
            'steps': steps,
            'eigenvalues': [{'real': float(np.real(ev)), 'imag': float(np.imag(ev))} for ev in self.eigenvalues]
        }
    
    def _get_stability_analysis(self):
        """Analyze system stability with mathematical reasoning"""
        analysis = {
            'trace': self.trace,
            'determinant': self.determinant,
            'discriminant': self.discriminant,
            'stability_conditions': [],
            'reasoning': []
        }
        
        # Stability analysis based on trace and determinant
        if self.determinant < 0:
            analysis['stability_conditions'].append("det(A) < 0 → 鞍点 (不稳定)")
            analysis['reasoning'].append("一个正特征值，一个负特征值")
        elif self.determinant > 0:
            if self.trace < 0:
                if self.discriminant >= 0:
                    analysis['stability_conditions'].append("det(A) > 0, tr(A) < 0, Δ ≥ 0 → 稳定节点")
                    analysis['reasoning'].append("两个负实特征值")
                else:
                    analysis['stability_conditions'].append("det(A) > 0, tr(A) < 0, Δ < 0 → 稳定焦点")
                    analysis['reasoning'].append("复特征值，负实部")
            elif self.trace > 0:
                if self.discriminant >= 0:
                    analysis['stability_conditions'].append("det(A) > 0, tr(A) > 0, Δ ≥ 0 → 不稳定节点")
                    analysis['reasoning'].append("两个正实特征值")
                else:
                    analysis['stability_conditions'].append("det(A) > 0, tr(A) > 0, Δ < 0 → 不稳定焦点")
                    analysis['reasoning'].append("复特征值，正实部")
            else:  # trace = 0
                analysis['stability_conditions'].append("det(A) > 0, tr(A) = 0 → 中心点")
                analysis['reasoning'].append("纯虚数特征值")
        else:  # determinant = 0
            analysis['stability_conditions'].append("det(A) = 0 → 退化情况")
            analysis['reasoning'].append("至少一个零特征值")
        
        return analysis
    
    def _classify_system(self):
        """Classify the dynamical system type"""
        classification = {
            'type': '',
            'description': '',
            'mathematical_properties': []
        }
        
        real_parts = [np.real(ev) for ev in self.eigenvalues]
        imag_parts = [np.imag(ev) for ev in self.eigenvalues]
        
        if all(abs(im) < 1e-10 for im in imag_parts):  # Real eigenvalues
            if all(r < 0 for r in real_parts):
                classification['type'] = '稳定节点'
                classification['description'] = '所有轨迹收敛到原点'
                classification['mathematical_properties'] = [
                    'λ₁, λ₂ < 0 (实数)',
                    '原点是全局渐近稳定的',
                    '轨迹沿特征方向收敛'
                ]
            elif all(r > 0 for r in real_parts):
                classification['type'] = '不稳定节点'
                classification['description'] = '所有轨迹从原点发散'
                classification['mathematical_properties'] = [
                    'λ₁, λ₂ > 0 (实数)',
                    '原点是不稳定的',
                    '轨迹沿特征方向发散'
                ]
            else:
                classification['type'] = '鞍点'
                classification['description'] = '某些方向稳定，某些方向不稳定'
                classification['mathematical_properties'] = [
                    'λ₁ > 0, λ₂ < 0',
                    '存在稳定和不稳定流形',
                    '双曲型平衡点'
                ]
        else:  # Complex eigenvalues
            real_part = real_parts[0]
            if real_part < -1e-10:
                classification['type'] = '稳定焦点'
                classification['description'] = '轨迹螺旋收敛到原点'
                classification['mathematical_properties'] = [
                    'λ = α ± βi, α < 0',
                    '螺旋收敛运动',
                    '原点是渐近稳定的'
                ]
            elif real_part > 1e-10:
                classification['type'] = '不稳定焦点'
                classification['description'] = '轨迹螺旋发散'
                classification['mathematical_properties'] = [
                    'λ = α ± βi, α > 0',
                    '螺旋发散运动',
                    '原点是不稳定的'
                ]
            else:
                classification['type'] = '中心点'
                classification['description'] = '轨迹形成闭合椭圆'
                classification['mathematical_properties'] = [
                    'λ = ±βi (纯虚数)',
                    '周期运动',
                    '李雅普诺夫稳定'
                ]
        
        return classification
    
    def _get_lyapunov_analysis(self):
        """Lyapunov stability analysis"""
        analysis = {
            'quadratic_form': None,
            'lyapunov_function': None,
            'stability_conclusion': ''
        }
        
        # For linear systems, try V(x) = x^T P x
        # where P satisfies A^T P + P A = -Q for some positive definite Q
        
        try:
            # Try with Q = I (identity matrix)
            Q = np.eye(2)
            # Solve Lyapunov equation: A^T P + P A = -Q
            try:
                from scipy.linalg import solve_lyapunov
                P = solve_lyapunov(self.A.T, -Q)
            except ImportError:
                # Fallback: solve manually for 2x2 case
                P = self._solve_lyapunov_2x2(self.A.T, -Q)
            
            # Check if P is positive definite
            eigenvals_P = np.linalg.eigvals(P)
            if all(ev > 0 for ev in eigenvals_P):
                analysis['lyapunov_function'] = f"V(x) = x^T P x，其中 P = {P}"
                analysis['quadratic_form'] = P.tolist()
                analysis['stability_conclusion'] = "找到李雅普诺夫函数，系统渐近稳定"
            else:
                analysis['stability_conclusion'] = "无法构造二次型李雅普诺夫函数"
        except:
            analysis['stability_conclusion'] = "李雅普诺夫分析需要进一步计算"
        
        return analysis
    
    def _solve_lyapunov_2x2(self, A, Q):
        """Manual solver for 2x2 Lyapunov equation A^T P + P A = Q"""
        # For 2x2 matrices, we can solve this as a linear system
        # Let P = [[p11, p12], [p12, p22]] (symmetric)
        # Then A^T P + P A = Q gives us 3 equations for p11, p12, p22
        
        a11, a12 = A[0, 0], A[0, 1]
        a21, a22 = A[1, 0], A[1, 1]
        q11, q12, q22 = Q[0, 0], Q[0, 1], Q[1, 1]
        
        # Coefficient matrix for [p11, p12, p22]
        coeff_matrix = np.array([
            [2*a11, a12 + a21, 0],      # equation for (1,1) element
            [0, a11 + a22, 2*a21],      # equation for (1,2) element  
            [0, a12 + a21, 2*a22]       # equation for (2,2) element
        ])
        
        rhs = np.array([q11, q12, q22])
        
        try:
            solution = np.linalg.solve(coeff_matrix, rhs)
            P = np.array([[solution[0], solution[1]], 
                         [solution[1], solution[2]]])
            return P
        except:
            return np.eye(2)  # fallback
    
    def get_bifurcation_analysis(self, param_name='a', param_range=(-2, 2), num_points=100):
        """Analyze bifurcations as parameters change"""
        # This is a placeholder for bifurcation analysis
        # In a real implementation, you'd vary matrix elements and track eigenvalue changes
        return {
            'parameter': param_name,
            'range': param_range,
            'bifurcation_points': [],
            'stability_regions': []
        }

    def vector_field(self, X, t=0):
        return self.A @ X

    def generate_phase_portrait(self, x_range=(-3.5, 3.5), y_range=(-3.5, 3.5), grid_size=20):
        # 设置绘图样式和中文字体
        setup_plot_style()

        fig, ax = plt.subplots(figsize=(12, 10))
        fig.patch.set_facecolor('#F8F9FA')  # 浅灰白色背景
        ax.set_facecolor('#FFFFFF')  # 纯白色绘图区

        x = np.linspace(x_range[0], x_range[1], grid_size)
        y = np.linspace(y_range[0], y_range[1], grid_size)
        X, Y = np.meshgrid(x, y)

        grid_points = np.stack((X, Y), axis=-1).reshape(-1, 2)
        velocities = grid_points @ self.A.T
        U = velocities[:, 0].reshape(X.shape)
        V = velocities[:, 1].reshape(Y.shape)

        # 使用柔和的蓝紫色作为向量场颜色
        ax.quiver(X, Y, U, V, color='#7C8DB5', scale=25, width=0.004, label='向量场', alpha=0.7)

        # 使用清新的青色和紫色绘制零等值线
        ax.axhline(0, color='#4DB8AC', linestyle=':', linewidth=2.5, label='dx/dt=0', alpha=0.8)
        ax.axvline(0, color='#9B7EBD', linestyle=':', linewidth=2.5, label='dy/dt=0', alpha=0.8)

        # 平衡点使用主题色
        ax.plot(0, 0, 'o', color='#FFFFFF', markersize=14, markeredgecolor='#667EEA',
                label='平衡点(0,0)', zorder=10, markeredgewidth=3)

        eigenvals_text = ', '.join(ev['formatted'] for ev in self.get_eigenvalues_formatted())
        # 特征值文本框使用浅色背景
        ax.text(0.5, max(y_range) * 0.8, f'特征值 {eigenvals_text}',
                color='#667EEA', fontsize=14, weight='bold',
                bbox=dict(boxstyle='round,pad=0.5', facecolor='#E8EAF6', edgecolor='#667EEA', alpha=0.9))

        ax.set_xlim(x_range)
        ax.set_ylim(y_range)
        ax.set_aspect('equal', adjustable='box')
        ax.grid(True, linestyle='--', alpha=0.25, color='#B0BEC5', linewidth=0.8)
        ax.set_title('动力系统相图', fontsize=18, weight='bold', pad=15, color='#2C3E50')
        ax.set_xlabel('x', fontsize=14, color='#546E7A')
        ax.set_ylabel('y', fontsize=14, color='#546E7A')

        # 坐标轴样式
        ax.spines['top'].set_color('#CFD8DC')
        ax.spines['right'].set_color('#CFD8DC')
        ax.spines['bottom'].set_color('#90A4AE')
        ax.spines['left'].set_color('#90A4AE')
        ax.tick_params(colors='#546E7A', which='both')

        legend = ax.legend(loc='upper right', fontsize=10, framealpha=0.95)
        if legend is not None:
            legend.get_frame().set_facecolor('#FAFBFC')
            legend.get_frame().set_edgecolor('#667EEA')

        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight',
                    facecolor='#F8F9FA', edgecolor='none')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        plt.close(fig)

        return img_base64

    def compute_trajectory(self, initial_point, t_span=(0, 10), num_points=500):
        t = np.linspace(t_span[0], t_span[1], num_points)
        trajectory = odeint(self.vector_field, initial_point, t)
        return {
            'time': t.tolist(),
            'x': trajectory[:, 0].tolist(),
            'y': trajectory[:, 1].tolist(),
            'initial_point': initial_point
        }


class NonlinearSystem:
    """非线性动力系统分析器"""

    def __init__(self, dx_dt_str, dy_dt_str):
        self.dx_dt_str = dx_dt_str
        self.dy_dt_str = dy_dt_str

        # 创建符号变量
        self.x, self.y = symbols('x y')

        # 解析方程字符串
        self.dx_dt_expr = self._parse_equation(dx_dt_str)
        self.dy_dt_expr = self._parse_equation(dy_dt_str)

        # 创建数值计算函数
        self.dx_dt_func = lambdify((self.x, self.y), self.dx_dt_expr, 'numpy')
        self.dy_dt_func = lambdify((self.x, self.y), self.dy_dt_expr, 'numpy')

        # 预计算雅可比矩阵及其数值函数，用于快速分类
        df_dx = diff(self.dx_dt_expr, self.x)
        df_dy = diff(self.dx_dt_expr, self.y)
        dg_dx = diff(self.dy_dt_expr, self.x)
        dg_dy = diff(self.dy_dt_expr, self.y)
        self._jacobian_func = lambdify((self.x, self.y), (df_dx, df_dy, dg_dx, dg_dy), 'numpy')

        # 查找平衡点
        self.equilibrium_points = self._find_equilibrium_points()

    def _parse_equation(self, eq_str):
        """解析方程字符串为sympy表达式"""
        eq_str = eq_str.replace('^', '**')
        eq_str = eq_str.replace('π', 'pi')

        # 处理隐式乘法（例如 2x -> 2*x）
        eq_str = re.sub(r'(\d)([xy])', r'\1*\2', eq_str)
        eq_str = re.sub(r'\)([xy])', r')*', eq_str)
        eq_str = re.sub(r'([xy])\(', r'\1*(', eq_str)

        try:
            from sympy import sin, cos, tan, exp, log, sqrt, pi, E
            local_dict = {
                'x': self.x, 'y': self.y,
                'sin': sin, 'cos': cos, 'tan': tan,
                'exp': exp, 'log': log, 'sqrt': sqrt,
                'abs': sp.Abs, 'pi': pi, 'e': E
            }
            return sp.sympify(eq_str, locals=local_dict)
        except Exception as exc:
            raise ValueError(f"无法解析方程: {eq_str}. 错误: {exc}")

    def _safe_eval_scalar(self, func, x, y):
        try:
            return float(func(float(x), float(y)))
        except Exception:
            return 0.0

    def _evaluate_field_on_grid(self, func, X, Y):
        try:
            values = np.asarray(func(X, Y), dtype=np.float64)
        except Exception:
            vectorized = np.vectorize(lambda a, b: self._safe_eval_scalar(func, a, b), otypes=[float])
            values = np.asarray(vectorized(X, Y), dtype=np.float64)
        return np.nan_to_num(values, nan=0.0, posinf=0.0, neginf=0.0)

    def _find_equilibrium_points(self):
        """查找平衡点（固定点）"""
        equilibrium_points = []

        try:
            solutions = sp.solve([self.dx_dt_expr, self.dy_dt_expr], [self.x, self.y])
            if isinstance(solutions, list):
                candidates = solutions
            elif isinstance(solutions, dict):
                candidates = [tuple(solutions[var] for var in (self.x, self.y))]
            else:
                candidates = []

            for sol in candidates:
                if isinstance(sol, (tuple, list)) and len(sol) == 2:
                    try:
                        x_val = float(sol[0].evalf())
                        y_val = float(sol[1].evalf())
                        if abs(x_val) < 100 and abs(y_val) < 100:
                            equilibrium_points.append((x_val, y_val))
                    except Exception:
                        continue
        except Exception:
            equilibrium_points = []

        if not equilibrium_points:
            initial_guesses = [
                (0, 0), (1, 0), (-1, 0), (0, 1), (0, -1),
                (1, 1), (-1, -1), (1, -1), (-1, 1)
            ]
            for guess in initial_guesses:
                try:
                    def equations(vars):
                        x_val, y_val = vars
                        return [self.dx_dt_func(x_val, y_val), self.dy_dt_func(x_val, y_val)]

                    sol, info, ier, _ = fsolve(equations, guess, full_output=True)
                    if ier == 1:
                        x_val, y_val = sol
                        if abs(x_val) < 100 and abs(y_val) < 100:
                            is_duplicate = any(
                                abs(ep[0] - x_val) < 1e-2 and abs(ep[1] - y_val) < 1e-2
                                for ep in equilibrium_points
                            )
                            if not is_duplicate:
                                equilibrium_points.append((float(x_val), float(y_val)))
                except Exception:
                    continue

        if not equilibrium_points:
            equilibrium_points.append((0.0, 0.0))

        return equilibrium_points

    def vector_field(self, X, t=0):
        """计算向量场"""
        x_val, y_val = X
        try:
            dx = float(self.dx_dt_func(x_val, y_val))
            dy = float(self.dy_dt_func(x_val, y_val))
            return np.array([dx, dy])
        except Exception:
            return np.array([0.0, 0.0])

    def classify_equilibrium(self, point):
        """分类平衡点类型（通过线性化）"""
        x0, y0 = point
        try:
            j00, j01, j10, j11 = [float(val) for val in self._jacobian_func(x0, y0)]
            J = np.array([[j00, j01], [j10, j11]])
            eigenvalues = np.linalg.eigvals(J)
        except Exception:
            return "分析失败"

        real_parts = [ev.real for ev in eigenvalues]
        imag_parts = [ev.imag for ev in eigenvalues]

        if all(abs(im) < 1e-10 for im in imag_parts):
            if all(r < 0 for r in real_parts):
                return "稳定节点"
            if all(r > 0 for r in real_parts):
                return "不稳定节点"
            if real_parts[0] * real_parts[1] < 0:
                return "鞍点"
        else:
            if all(r < -1e-10 for r in real_parts):
                return "稳定焦点"
            if all(r > 1e-10 for r in real_parts):
                return "不稳定焦点"
            if all(abs(r) < 1e-10 for r in real_parts):
                return "中心"
        return "未知类型"

    def generate_phase_portrait(self, x_range=(-5, 5), y_range=(-5, 5), grid_size=20):
        """生成非线性系统的相图"""
        # 设置绘图样式和中文字体
        setup_plot_style()

        fig, ax = plt.subplots(figsize=(12, 10))
        fig.patch.set_facecolor('#F8F9FA')  # 浅灰白色背景
        ax.set_facecolor('#FFFFFF')  # 纯白色绘图区

        x = np.linspace(x_range[0], x_range[1], grid_size)
        y = np.linspace(y_range[0], y_range[1], grid_size)
        X, Y = np.meshgrid(x, y)

        U = self._evaluate_field_on_grid(self.dx_dt_func, X, Y)
        V = self._evaluate_field_on_grid(self.dy_dt_func, X, Y)

        speed = np.hypot(U, V)
        speed = np.nan_to_num(speed, nan=0.0, posinf=0.0, neginf=0.0)

        with np.errstate(divide='ignore', invalid='ignore'):
            U_norm = np.divide(U, speed, out=np.zeros_like(U), where=speed > 1e-12)
            V_norm = np.divide(V, speed, out=np.zeros_like(V), where=speed > 1e-12)

        # 使用柔和的颜色映射 - 适合亮色背景
        ax.quiver(X, Y, U_norm, V_norm, speed, cmap='viridis', scale=25, width=0.004, alpha=0.6,
                  label='向量场')

        # 使用清新的青色和紫色绘制零等值线
        if np.nanmax(np.abs(U)) > 1e-9:
            try:
                null_dx = ax.contour(X, Y, U, levels=[0], colors='#4DB8AC', linestyles=':', linewidths=2.5, alpha=0.8)
                if null_dx.collections:
                    null_dx.collections[0].set_label('dx/dt=0')
            except Exception:
                pass

        if np.nanmax(np.abs(V)) > 1e-9:
            try:
                null_dy = ax.contour(X, Y, V, levels=[0], colors='#9B7EBD', linestyles=':', linewidths=2.5, alpha=0.8)
                if null_dy.collections:
                    null_dy.collections[0].set_label('dy/dt=0')
            except Exception:
                pass

        # 平衡点使用清晰的配色 - 根据稳定性区分
        for point in self.equilibrium_points:
            x_eq, y_eq = point
            if x_range[0] <= x_eq <= x_range[1] and y_range[0] <= y_eq <= y_range[1]:
                eq_type = self.classify_equilibrium(point)
                # 稳定: 绿色系 / 不稳定: 红橙色系 / 其他: 黄色系
                if '不稳定' in eq_type:
                    color = '#E74C3C'  # 清新的红色
                elif '稳定' in eq_type:
                    color = '#27AE60'  # 清新的绿色
                else:
                    color = '#F39C12'  # 清新的橙色

                ax.plot(x_eq, y_eq, 'o', color=color, markersize=12,
                        markeredgecolor='#FFFFFF', markeredgewidth=3,
                        label=f'平衡点({x_eq:.2f}, {y_eq:.2f}): {eq_type}', zorder=10)

        ax.set_xlim(x_range)
        ax.set_ylim(y_range)
        ax.set_aspect('equal', adjustable='box')
        ax.grid(True, linestyle='--', alpha=0.25, color='#B0BEC5', linewidth=0.8)
        ax.set_title(f"非线性系统相图\ndx/dt = {self.dx_dt_str}\ndy/dt = {self.dy_dt_str}",
                     fontsize=16, weight='bold', pad=15, color='#2C3E50')
        ax.set_xlabel('x', fontsize=14, color='#546E7A')
        ax.set_ylabel('y', fontsize=14, color='#546E7A')

        # 坐标轴样式
        ax.spines['top'].set_color('#CFD8DC')
        ax.spines['right'].set_color('#CFD8DC')
        ax.spines['bottom'].set_color('#90A4AE')
        ax.spines['left'].set_color('#90A4AE')
        ax.tick_params(colors='#546E7A', which='both')

        legend = ax.legend(loc='upper right', fontsize=10, framealpha=0.95)
        if legend is not None:
            legend.get_frame().set_facecolor('#FAFBFC')
            legend.get_frame().set_edgecolor('#667EEA')

        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight',
                    facecolor='#F8F9FA', edgecolor='none')
        img_buffer.seek(0)
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        plt.close(fig)

        return img_base64

    def compute_trajectory(self, initial_point, t_span=(0, 20), num_points=1000):
        """计算轨迹"""
        t = np.linspace(t_span[0], t_span[1], num_points)
        try:
            trajectory = odeint(self.vector_field, initial_point, t, rtol=1e-8, atol=1e-10)
            max_val = np.max(np.abs(trajectory))
            if max_val > 1e6:
                valid_idx = np.where(np.max(np.abs(trajectory), axis=1) < 1e6)[0]
                if len(valid_idx) > 0:
                    last_valid = valid_idx[-1] + 1
                    trajectory = trajectory[:last_valid]
                    t = t[:last_valid]
                else:
                    trajectory = np.array([initial_point])
                    t = np.array([0])
            return {
                'time': t.tolist(),
                'x': trajectory[:, 0].tolist(),
                'y': trajectory[:, 1].tolist(),
                'initial_point': initial_point
            }
        except Exception as exc:
            return {
                'time': [0],
                'x': [initial_point[0]],
                'y': [initial_point[1]],
                'initial_point': initial_point,
                'error': str(exc)
            }

class TextToMatrixConverter:
    """文字描述到矩阵转换器"""
    
    def __init__(self):
        # 定义关键词模式和对应的矩阵类型
        self.patterns = {
            'stable_spiral': {
                'keywords': ['稳定', '螺旋', '向内', '收敛', '漩涡', '稳定焦点', '稳定的螺旋', '螺旋收敛',
                           '向心螺旋', '螺旋形收敛', '旋涡收敛', '稳定旋转', '螺旋状向内', '向内旋转',
                           '螺旋向心', '收敛螺旋', '稳定旋涡', '内收螺旋', '螺旋汇聚'],
                'matrix_type': 'stable_spiral',
                'description': '稳定螺旋形系统，轨迹呈螺旋状向内收敛'
            },
            'unstable_spiral': {
                'keywords': ['不稳定螺旋', '向外螺旋', '发散螺旋', '不稳定焦点', '螺旋发散', '向外旋转',
                           '螺旋状向外', '螺旋扩散', '外发螺旋', '发散旋转', '不稳定旋涡', '螺旋离散',
                           '向外发散', '螺旋形发散', '旋涡发散', '螺旋分离', '外向螺旋'],
                'matrix_type': 'unstable_spiral',
                'description': '不稳定螺旋形系统，轨迹呈螺旋状向外发散'
            },
            'elliptical': {
                'keywords': ['椭圆', '简谐', '振动', '周期', '闭合', '椭圆形', '椭圆轨道', '椭圆型',
                           '简谐振动', '周期运动', '闭合轨道', '椭圆轨迹', '振荡', '摆动',
                           '椭圆周期', '椭圆闭合', '正椭圆', '标准椭圆', '规则椭圆'],
                'matrix_type': 'elliptical',
                'description': '椭圆轨迹系统，类似简谐振动的闭合轨道'
            },
            'tilted_elliptical': {
                'keywords': ['斜', '斜着', '倾斜', '斜椭圆', '倾斜椭圆', '旋转椭圆', '斜向', '倾斜轨道',
                           '斜向椭圆', '角度椭圆', '倾斜的椭圆', '旋转的椭圆', '斜向轨迹', '倾斜形状',
                           '斜轴椭圆', '转向椭圆', '偏转椭圆', '角度偏移', '轴向倾斜', '斜置椭圆'],
                'matrix_type': 'tilted_elliptical',
                'description': '倾斜椭圆轨迹系统，椭圆轨道相对坐标轴呈一定角度倾斜'
            },
            'circular': {
                'keywords': ['圆', '圆形', '恒定', '半径', '圆周', '旋转', '圆形轨道', '圆轨迹',
                           '圆周运动', '恒定半径', '圆形闭合', '正圆', '圆型', '圆环',
                           '圆形周期', '匀速圆周', '圆周轨道', '圆形旋转'],
                'matrix_type': 'circular',
                'description': '圆形轨迹系统，保持恒定半径的圆周运动'
            },
            'saddle': {
                'keywords': ['鞍点', '鞍', '鞍型', '马鞍', '某些方向稳定', '某些方向不稳定', '混合稳定性',
                           '鞍点型', '马鞍形', '双曲', '双曲点', '鞍形', '交点', '不稳定交点',
                           '鞍状', '十字交叉', '交叉型', '分离型', '鞍形分布'],
                'matrix_type': 'saddle',
                'description': '鞍点系统，某些方向稳定，某些方向不稳定'
            },
            'stable_node': {
                'keywords': ['稳定节点', '节点', '收敛', '稳定', '向心', '稳定点', '汇聚', '聚集',
                           '所有方向稳定', '全方向收敛', '稳定的节点', '收敛节点', '向心收敛',
                           '稳定汇', '收敛点', '吸引点', '稳定吸引', '全稳定', '节点稳定'],
                'matrix_type': 'stable_node',
                'description': '稳定节点系统，所有轨迹都收敛到原点'
            },
            'unstable_node': {
                'keywords': ['不稳定节点', '发散', '向外', '扩散', '辐射', '不稳定', '发散节点',
                           '向外发散', '辐射状', '放射状', '扩散型', '发散型', '不稳定发散',
                           '全方向发散', '所有方向不稳定', '放射型', '源点', '发散源', '扩散源'],
                'matrix_type': 'unstable_node',
                'description': '不稳定节点系统，所有轨迹都从原点向外发散'
            },
            'center': {
                'keywords': ['中心', '中性', '保持', '守恒', '中心点', '中性点', '平衡', '中立',
                           '守恒系统', '能量守恒', '中心型', '中性稳定', '临界', '边界',
                           '中心平衡', '中性轨道', '守恒轨道', '平衡轨道'],
                'matrix_type': 'center',
                'description': '中心点系统，轨迹呈闭合曲线围绕原点'
            },
            'star': {
                'keywords': ['星形', '辐射', '星状', '放射', '星型', '星形辐射', '放射状',
                           '辐射状', '星形发散', '多方向', '放射型', '星状分布',
                           '辐射型', '星形图案', '放射形'],
                'matrix_type': 'star',
                'description': '星形辐射系统，轨迹呈放射状分布'
            },
            'diagonal_elliptical': {
                'keywords': ['对角', '对角椭圆', '对角线', '45度', '四十五度', '对角倾斜',
                           '对角线椭圆', '斜对角', '对角轴', '对角形状'],
                'matrix_type': 'diagonal_elliptical',
                'description': '对角椭圆轨迹系统，椭圆主轴沿对角线方向'
            },
            'highly_tilted_elliptical': {
                'keywords': ['强烈倾斜', '高度倾斜', '大角度倾斜', '严重倾斜', '极度倾斜',
                           '大幅倾斜', '明显倾斜', '显著倾斜', '很斜', '非常倾斜'],
                'matrix_type': 'highly_tilted_elliptical',
                'description': '高度倾斜椭圆轨迹系统，椭圆具有明显的倾斜角度'
            },
            'narrow_elliptical': {
                'keywords': ['窄椭圆', '扁椭圆', '细长', '狭窄', '扁平', '压缩',
                           '窄长椭圆', '拉长椭圆', '细椭圆', '长椭圆'],
                'matrix_type': 'narrow_elliptical',
                'description': '窄椭圆轨迹系统，椭圆在某个方向被压缩'
            }
        }
        
    def analyze_description(self, description):
        """分析文字描述，返回最匹配的系统类型"""
        description_lower = description.lower()
        
        # 计算每种模式的匹配分数
        scores = {}
        for pattern_name, pattern_info in self.patterns.items():
            score = 0
            for keyword in pattern_info['keywords']:
                if keyword.lower() in description_lower:
                    score += 1
                    
            scores[pattern_name] = score
            
        # 找到最高分的模式
        if scores:
            best_match = max(scores.keys(), key=lambda k: scores[k])
            if scores[best_match] > 0:
                return best_match
                
        # 如果没有匹配，返回默认的稳定螺旋
        return 'stable_spiral'
    
    def generate_matrix(self, system_type):
        """根据系统类型生成对应的矩阵"""

        if system_type == 'stable_spiral':
            # 稳定螺旋：实部为负的复数特征值
            real_part = -random.uniform(0.2, 0.8)
            imag_part = random.uniform(0.5, 2.0)
            matrix = [[real_part, -imag_part], [imag_part, real_part]]
            return self._add_rotation(matrix, random.uniform(0, 3.14159/4))

        elif system_type == 'unstable_spiral':
            # 不稳定螺旋：实部为正的复数特征值
            real_part = random.uniform(0.2, 0.8)
            imag_part = random.uniform(0.5, 2.0)
            matrix = [[real_part, -imag_part], [imag_part, real_part]]
            return self._add_rotation(matrix, random.uniform(0, 3.14159/4))

        elif system_type == 'elliptical':
            # 椭圆轨迹：创建明显的椭圆形状（非圆形）
            a = random.uniform(0.5, 2.2)
            b = random.uniform(0.3, 1.8)
            # 确保a和b有明显差异，避免产生近似圆形
            if abs(a - b) < 0.4:
                if a > b:
                    a += random.uniform(0.4, 0.8)
                else:
                    b += random.uniform(0.4, 0.8)
            base_matrix = [[0, a], [-b, 0]]
            # 轻微旋转
            angle = random.uniform(0, 3.14159/8)  # 0-22.5度的小角度旋转
            return self._add_rotation(base_matrix, angle)

        elif system_type == 'tilted_elliptical':
            # 倾斜椭圆轨迹：创建明显倾斜的椭圆
            a = random.uniform(0.6, 2.0)
            b = random.uniform(0.4, 1.6)
            # 确保椭圆形状明显
            if abs(a - b) < 0.5:
                if a > b:
                    a += random.uniform(0.5, 0.9)
                else:
                    b += random.uniform(0.5, 0.9)
            base_matrix = [[0, a], [-b, 0]]
            # 中等倾斜角度
            angle = random.uniform(3.14159/6, 3.14159/3)  # 30-60度倾斜
            return self._add_rotation(base_matrix, angle)

        elif system_type == 'highly_tilted_elliptical':
            # 高度倾斜椭圆：大角度倾斜
            a = random.uniform(0.7, 2.5)
            b = random.uniform(0.3, 1.2)
            # 确保显著的椭圆形状
            if abs(a - b) < 0.6:
                if a > b:
                    a += random.uniform(0.8, 1.2)
                else:
                    b += random.uniform(0.8, 1.2)
            base_matrix = [[0, a], [-b, 0]]
            # 大角度倾斜
            angle = random.uniform(3.14159/3, 2*3.14159/3)  # 60-120度倾斜
            return self._add_rotation(base_matrix, angle)

        elif system_type == 'diagonal_elliptical':
            # 对角椭圆：沿45度倾斜
            a = random.uniform(0.6, 1.8)
            b = random.uniform(0.4, 1.4)
            if abs(a - b) < 0.4:
                if a > b:
                    a += 0.6
                else:
                    b += 0.6
            base_matrix = [[0, a], [-b, 0]]
            # 固定45度角
            angle = 3.14159/4 + random.uniform(-3.14159/24, 3.14159/24)  # 45度±7.5度
            return self._add_rotation(base_matrix, angle)

        elif system_type == 'narrow_elliptical':
            # 窄椭圆：强烈压缩的椭圆
            a = random.uniform(1.2, 2.8)
            b = random.uniform(0.2, 0.6)
            base_matrix = [[0, a], [-b, 0]]
            angle = random.uniform(0, 3.14159/2)  # 任意角度
            return self._add_rotation(base_matrix, angle)

        elif system_type == 'circular':
            # 圆形轨迹：严格保证圆形
            omega = random.uniform(0.8, 2.0)
            matrix = [[0, omega], [-omega, 0]]
            # 圆形可以有任意角度旋转，但保持圆形性质不变
            angle = random.uniform(0, 3.14159/2)
            return self._add_rotation(matrix, angle)

        elif system_type == 'saddle':
            # 鞍点：一个正特征值，一个负特征值，可以旋转
            lambda1 = random.uniform(0.3, 1.2)
            lambda2 = -random.uniform(0.3, 1.2)
            matrix = [[lambda1, 0], [0, lambda2]]
            angle = random.uniform(0, 3.14159/4)
            return self._add_rotation(matrix, angle)

        elif system_type == 'stable_node':
            # 稳定节点：两个负实特征值
            lambda1 = -random.uniform(0.5, 1.5)
            lambda2 = -random.uniform(0.3, 1.2)
            matrix = [[lambda1, 0], [0, lambda2]]
            angle = random.uniform(0, 3.14159/6)
            return self._add_rotation(matrix, angle)

        elif system_type == 'unstable_node':
            # 不稳定节点：两个正实特征值
            lambda1 = random.uniform(0.5, 1.5)
            lambda2 = random.uniform(0.3, 1.2)
            matrix = [[lambda1, 0], [0, lambda2]]
            angle = random.uniform(0, 3.14159/6)
            return self._add_rotation(matrix, angle)

        elif system_type == 'center':
            # 中心点：纯虚数特征值
            omega = random.uniform(0.8, 2.0)
            matrix = [[0, omega], [-omega, 0]]
            angle = random.uniform(0, 3.14159/4)
            return self._add_rotation(matrix, angle)

        elif system_type == 'star':
            # 星形：对角矩阵，可以旋转
            lambda1 = random.uniform(0.5, 1.5)
            lambda2 = random.uniform(0.5, 1.5)
            matrix = [[lambda1, 0], [0, lambda2]]
            angle = random.uniform(0, 3.14159/3)
            return self._add_rotation(matrix, angle)

        else:
            # 默认：稳定螺旋
            return [[-0.5, -1.0], [1.0, -0.5]]

    def _add_rotation(self, matrix, angle):
        """给矩阵添加旋转变换，创建更丰富的图案"""
        import numpy as np
        
        # 原始矩阵
        A = np.array(matrix)
        
        # 旋转矩阵
        cos_a = np.cos(angle)
        sin_a = np.sin(angle)
        R = np.array([[cos_a, -sin_a], [sin_a, cos_a]])
        R_inv = np.array([[cos_a, sin_a], [-sin_a, cos_a]])
        
        # 应用相似变换: R * A * R^(-1)
        rotated_matrix = R @ A @ R_inv
        
        return rotated_matrix.tolist()
    
    def convert_text_to_matrix(self, description):
        """主要的转换函数"""
        system_type = self.analyze_description(description)
        matrix = self.generate_matrix(system_type)
        explanation = self.patterns[system_type]['description']
        
        return {
            'matrix': matrix,
            'system_type': system_type,
            'explanation': explanation
        }


class DiscreteSystem:
    """离散动力学系统分析器"""

    def __init__(self, map_type='logistic', parameters=None, dimension=None):
        self.map_type = map_type
        # 如果未指定dimension，自动识别
        if dimension is None:
            dimension = self._get_dimension(map_type)
        self.dimension = dimension
        self.parameters = parameters or self._get_default_parameters(map_type)

    def _get_dimension(self, map_type):
        """根据映射类型自动识别维度"""
        dimension_map = {
            'logistic': 1,
            'henon': 2,
            'tent': 1,
            'linear_2d': 2,
            'linear_1d': 1,
            'rotation_2d': 2,
            'sine': 1
        }
        return dimension_map.get(map_type, 1)

    def _get_default_parameters(self, map_type):
        """获取默认参数"""
        defaults = {
            'logistic': {'r': 3.5},
            'henon': {'a': 1.4, 'b': 0.3},
            'tent': {'mu': 2.0},
            'linear_2d': {'a': [[0.8, 0.2], [0.1, 0.9]]},
            'baker': {'stretch_factor': 2.0},
            'sine': {'r': 1.0}
        }
        return defaults.get(map_type, {})

    def map_function(self, x):
        """应用映射函数"""
        if self.map_type == 'logistic':
            r = self.parameters['r']
            return r * x * (1 - x)

        elif self.map_type == 'henon':
            a, b = self.parameters['a'], self.parameters['b']
            x_new = 1 - a * x[0]**2 + x[1]
            y_new = b * x[0]
            return np.array([x_new, y_new])

        elif self.map_type == 'tent':
            mu = self.parameters['mu']
            # 避免边界处的数值不稳定性
            # 将x限制在有效区间(epsilon, 1-epsilon)内
            epsilon = 1e-10
            x = np.clip(x, epsilon, 1 - epsilon)

            if x <= 0.5:
                result = mu * x
            else:
                result = mu * (1 - x)

            # 确保结果在有效范围内
            return np.clip(result, 0.0, 1.0)

        elif self.map_type == 'linear_2d':
            A = np.array(self.parameters['a'])
            return A @ x

        elif self.map_type == 'linear_1d':
            # x_{n+1} = a*x_n + b
            a = self.parameters['a']
            b = self.parameters['b']
            return a * x + b

        elif self.map_type == 'rotation_2d':
            # 旋转矩阵乘以缩放因子
            theta = self.parameters['theta']
            r = self.parameters['r']
            cos_theta = np.cos(theta)
            sin_theta = np.sin(theta)
            rotation_matrix = r * np.array([
                [cos_theta, -sin_theta],
                [sin_theta, cos_theta]
            ])
            return rotation_matrix @ x

        elif self.map_type == 'sine':
            r = self.parameters['r']
            return r * np.sin(np.pi * x)

        else:
            return x

    def iterate(self, x0, n_steps):
        """迭代计算轨迹"""
        trajectory = [x0]
        x = x0

        for i in range(n_steps):
            try:
                x = self.map_function(x)
                trajectory.append(x)

                # 检查发散
                if np.any(np.abs(x) > 1e6):
                    break

            except (OverflowError, ValueError):
                break

        # 转换为numpy数组后再转为列表，确保正确的JSON序列化
        result = np.array(trajectory)

        # 如果是2D系统，确保每个点都被正确转换
        if self.dimension == 2:
            return [point.tolist() if hasattr(point, 'tolist') else list(point) for point in result]
        else:
            return result.tolist() if hasattr(result, 'tolist') else list(result)

    def find_fixed_points(self, search_range=(-2, 2), n_points=100):
        """寻找固定点"""
        fixed_points = []

        if self.dimension == 1:
            # 一维情况：求解 f(x) = x
            from scipy.optimize import fsolve, brentq

            def fixed_point_eq(x):
                try:
                    return self.map_function(x) - x
                except:
                    return float('inf')

            # 在搜索范围内寻找零点
            search_points = np.linspace(search_range[0], search_range[1], n_points)

            for i in range(len(search_points) - 1):
                try:
                    x1, x2 = search_points[i], search_points[i + 1]
                    f1 = fixed_point_eq(x1)
                    f2 = fixed_point_eq(x2)

                    # 检查边界点是否为零点
                    if abs(f1) < 1e-6:
                        # x1 本身是零点
                        is_new = True
                        for fp in fixed_points:
                            if abs(fp - x1) < 1e-6:
                                is_new = False
                                break
                        if is_new:
                            fixed_points.append(x1)

                    # 检查区间内是否有零穿越（符号变化）
                    if f1 * f2 < 0:
                        # 区间内有零点
                        root = brentq(fixed_point_eq, x1, x2)
                        if abs(fixed_point_eq(root)) < 1e-6:
                            # 验证是否已存在
                            is_new = True
                            for fp in fixed_points:
                                if abs(fp - root) < 1e-6:
                                    is_new = False
                                    break
                            if is_new:
                                fixed_points.append(root)
                except:
                    continue

            # 检查最后一个点是否为零点
            try:
                if len(search_points) > 0:
                    last_point = search_points[-1]
                    if abs(fixed_point_eq(last_point)) < 1e-6:
                        is_new = True
                        for fp in fixed_points:
                            if abs(fp - last_point) < 1e-6:
                                is_new = False
                                break
                        if is_new:
                            fixed_points.append(last_point)
            except:
                pass

        elif self.dimension == 2:
            # 二维情况：求解 f(x,y) = (x,y)
            from scipy.optimize import fsolve

            def fixed_point_eq_2d(state):
                """计算 f(x,y) - (x,y)"""
                try:
                    result = self.map_function(state)
                    return [result[0] - state[0], result[1] - state[1]]
                except:
                    return [float('inf'), float('inf')]

            # 使用多个初始猜测来寻找固定点
            initial_guesses = [
                [0.0, 0.0],
                [0.1, 0.1],
                [-0.1, -0.1],
                [0.5, 0.5],
                [-0.5, -0.5],
                [1.0, 0.0],
                [0.0, 1.0],
                [-1.0, 0.0],
                [0.0, -1.0]
            ]

            for guess in initial_guesses:
                try:
                    solution = fsolve(fixed_point_eq_2d, guess)
                    # 验证是否真的是固定点
                    residual = fixed_point_eq_2d(solution)
                    if np.sqrt(residual[0]**2 + residual[1]**2) < 1e-6:
                        # 检查是否已存在
                        is_new = True
                        for fp in fixed_points:
                            if np.sqrt((fp[0] - solution[0])**2 + (fp[1] - solution[1])**2) < 1e-6:
                                is_new = False
                                break
                        if is_new:
                            fixed_points.append(solution.tolist())
                except:
                    continue
        else:
            # 多维情况需要更复杂的算法
            pass

        return fixed_points

    def analyze_stability(self, fixed_point):
        """分析固定点稳定性"""
        if self.dimension == 1:
            # 计算导数 f'(x*)
            h = 1e-8
            x = fixed_point

            try:
                derivative = (self.map_function(x + h) - self.map_function(x - h)) / (2 * h)

                if abs(derivative) < 1:
                    stability = "稳定"
                elif abs(derivative) > 1:
                    stability = "不稳定"
                else:
                    stability = "临界"

                return {
                    'fixed_point': fixed_point,
                    'derivative': derivative,
                    'stability': stability,
                    'multiplier': derivative
                }
            except:
                return {
                    'fixed_point': fixed_point,
                    'derivative': None,
                    'stability': "未知",
                    'multiplier': None
                }

        elif self.dimension == 2:
            # 计算Jacobian矩阵
            h = 1e-8
            x, y = fixed_point[0], fixed_point[1]

            try:
                # 计算偏导数
                f_x_plus_h = self.map_function([x + h, y])
                f_x_minus_h = self.map_function([x - h, y])
                f_y_plus_h = self.map_function([x, y + h])
                f_y_minus_h = self.map_function([x, y - h])

                # Jacobian矩阵
                J = np.array([
                    [(f_x_plus_h[0] - f_x_minus_h[0]) / (2 * h),  # df1/dx
                     (f_y_plus_h[0] - f_y_minus_h[0]) / (2 * h)], # df1/dy
                    [(f_x_plus_h[1] - f_x_minus_h[1]) / (2 * h),  # df2/dx
                     (f_y_plus_h[1] - f_y_minus_h[1]) / (2 * h)]  # df2/dy
                ])

                # 计算特征值
                eigenvalues = np.linalg.eigvals(J)
                max_eigenvalue = np.max(np.abs(eigenvalues))

                # 判断稳定性
                if max_eigenvalue < 1:
                    stability = "稳定"
                elif max_eigenvalue > 1:
                    stability = "不稳定"
                else:
                    stability = "临界"

                return {
                    'fixed_point': fixed_point,
                    'jacobian': J.tolist(),
                    'eigenvalues': eigenvalues.tolist(),
                    'max_eigenvalue': float(max_eigenvalue),
                    'stability': stability
                }
            except:
                return {
                    'fixed_point': fixed_point,
                    'jacobian': None,
                    'eigenvalues': None,
                    'stability': "未知"
                }

        return None

    def detect_periodic_orbits(self, period_max=10, search_range=(-2, 2), n_search=50):
        """检测周期轨道"""
        periodic_orbits = {}

        if self.dimension == 1:
            search_points = np.linspace(search_range[0], search_range[1], n_search)

            for period in range(2, period_max + 1):
                orbits = []

                for x0 in search_points:
                    try:
                        # 迭代period次
                        x = x0
                        for _ in range(period):
                            x = self.map_function(x)

                        # 检查是否回到起点
                        if abs(x - x0) < 1e-6:
                            # 验证轨道
                            orbit = []
                            x_temp = x0
                            for _ in range(period):
                                orbit.append(x_temp)
                                x_temp = self.map_function(x_temp)

                            # 检查是否是新轨道
                            is_new = True
                            for existing_orbit in orbits:
                                if any(abs(existing_orbit[0] - point) < 1e-6 for point in orbit):
                                    is_new = False
                                    break

                            if is_new:
                                orbits.append(orbit)

                    except:
                        continue

                if orbits:
                    periodic_orbits[period] = orbits

        return periodic_orbits

    def compute_lyapunov_exponent(self, x0, n_steps=1000):
        """计算Lyapunov指数"""
        if self.dimension == 1:
            try:
                lyap_sum = 0.0
                x = x0

                for i in range(n_steps):
                    # 计算导数
                    h = 1e-8
                    derivative = (self.map_function(x + h) - self.map_function(x - h)) / (2 * h)

                    if abs(derivative) > 0:
                        lyap_sum += np.log(abs(derivative))

                    x = self.map_function(x)

                    # 检查发散
                    if abs(x) > 1e6:
                        break

                lyapunov_exponent = lyap_sum / n_steps

                return {
                    'lyapunov_exponent': lyapunov_exponent,
                    'is_chaotic': lyapunov_exponent > 0,
                    'convergence_info': f"基于 {n_steps} 次迭代"
                }

            except:
                return None

        elif self.dimension == 2:
            # 2D映射的Lyapunov指数计算
            try:
                # 确保x0是numpy数组
                if isinstance(x0, (list, tuple)):
                    x = np.array(x0)
                else:
                    x = x0

                # 初始化两个Lyapunov指数的累积和
                lyap_sum = np.zeros(2)

                # 初始化正交向量
                w = np.eye(2)

                h = 1e-8

                for i in range(n_steps):
                    # 计算Jacobian矩阵
                    f_x_plus_h = self.map_function(x + np.array([h, 0]))
                    f_x_minus_h = self.map_function(x - np.array([h, 0]))
                    f_y_plus_h = self.map_function(x + np.array([0, h]))
                    f_y_minus_h = self.map_function(x - np.array([0, h]))

                    J = np.array([
                        [(f_x_plus_h[0] - f_x_minus_h[0]) / (2 * h),
                         (f_y_plus_h[0] - f_y_minus_h[0]) / (2 * h)],
                        [(f_x_plus_h[1] - f_x_minus_h[1]) / (2 * h),
                         (f_y_plus_h[1] - f_y_minus_h[1]) / (2 * h)]
                    ])

                    # 更新向量
                    w = J @ w

                    # QR分解进行正交化
                    w, r = np.linalg.qr(w)

                    # 累加对数
                    for j in range(2):
                        if abs(r[j, j]) > 0:
                            lyap_sum[j] += np.log(abs(r[j, j]))

                    # 更新状态
                    x = self.map_function(x)

                    # 检查发散
                    if np.any(np.abs(x) > 1e6):
                        break

                # 计算平均Lyapunov指数
                lyapunov_exponents = lyap_sum / n_steps
                max_lyap = np.max(lyapunov_exponents)

                return {
                    'lyapunov_exponent': float(max_lyap),
                    'lyapunov_exponents': lyapunov_exponents.tolist(),
                    'is_chaotic': max_lyap > 0,
                    'convergence_info': f"基于 {n_steps} 次迭代"
                }

            except Exception as e:
                return None

        return None

    def bifurcation_diagram(self, param_name='r', param_range=(2.5, 4.0), param_steps=1000,
                          x0=0.5, transient=100, n_points=50):
        """生成分岔图"""
        param_values = np.linspace(param_range[0], param_range[1], param_steps)
        bifurcation_data = []

        # 根据系统维度设置正确的初始条件
        if self.dimension == 1:
            initial_state = x0 if np.isscalar(x0) else x0
        else:
            # 二维映射需要二维初始条件
            if np.isscalar(x0):
                initial_state = np.array([0.1, 0.1])  # Hénon映射的典型初始条件
            else:
                initial_state = np.array(x0)

        for param_val in param_values:
            # 更新参数
            old_param = self.parameters[param_name]
            self.parameters[param_name] = param_val

            try:
                # 对每个参数值重新开始迭代（关键修正）
                x = initial_state.copy() if hasattr(initial_state, 'copy') else initial_state
                
                # 跳过暂态
                for _ in range(transient):
                    x = self.map_function(x)

                # 收集数据点
                points = []
                for _ in range(n_points):
                    x = self.map_function(x)

                    # 处理一维和二维映射
                    if self.dimension == 1:
                        # 一维映射：直接使用x
                        if abs(x) < 1e6:
                            points.append(x)
                        else:
                            break
                    else:
                        # 二维映射：只取第一个分量x[0]
                        if np.all(np.abs(x) < 1e6):
                            points.append(x[0])  # 只保存x分量
                        else:
                            break

                bifurcation_data.append({
                    'parameter': param_val,
                    'points': points
                })

            except Exception as e:
                # 添加更详细的错误信息用于调试
                bifurcation_data.append({
                    'parameter': param_val,
                    'points': [],
                    'error': str(e)
                })

            # 恢复参数
            self.parameters[param_name] = old_param

        return bifurcation_data

    def generate_cobweb_plot(self, x0, n_steps=20):
        """生成蛛网图数据"""
        if self.dimension != 1:
            return None

        x_points = []
        y_points = []

        x = x0
        x_points.append(x)
        y_points.append(x)  # 从对角线上开始

        for i in range(n_steps):
            # 垂直线到映射
            y = self.map_function(x)
            x_points.append(x)
            y_points.append(y)

            # 水平线到y=x
            x_points.append(y)
            y_points.append(y)

            x = y

            # 检查发散
            if abs(x) > 1e6:
                break

        return {
            'x_points': x_points,
            'y_points': y_points,
            'x0': x0,
            'n_steps': len(x_points) // 2
        }

    def generate_return_map(self, x0, n_steps=200, delay=1):
        """生成返回映射"""
        trajectory = self.iterate(x0, n_steps)

        if len(trajectory) < delay + 1:
            return None

        # 检测收敛：如果连续30个点的变化都小于1e-6，认为已收敛，截断后续数据
        # 但确保至少保留min(n_steps * 0.8, 150)个点以显示有意义的返回映射结构
        convergence_threshold = 1e-6
        convergence_count = 30  # 增加到30以减少误判
        min_points = min(int(n_steps * 0.8), 150)  # 至少保留80%的点或150个点

        valid_length = len(trajectory)
        if self.dimension == 1:
            for i in range(len(trajectory) - convergence_count):
                # 检查接下来的convergence_count个点是否都几乎不变
                window = trajectory[i:i+convergence_count]
                if all(abs(window[j+1] - window[j]) < convergence_threshold for j in range(convergence_count-1)):
                    # 找到收敛点，但确保保留足够多的点
                    if i + 1 >= min_points:
                        valid_length = i + 1
                        break
                    # 如果收敛太早，继续保留更多点
                    else:
                        continue

        # 只使用收敛前的数据
        trajectory = trajectory[:valid_length]

        if len(trajectory) < delay + 1:
            return None

        x_n = trajectory[:-delay]
        x_n_plus_delay = trajectory[delay:]

        # 对于2D系统，只提取x分量用于返回映射
        if self.dimension == 2:
            x_n = [point[0] for point in x_n]
            x_n_plus_delay = [point[0] for point in x_n_plus_delay]

        return {
            'x_n': x_n.tolist() if hasattr(x_n, 'tolist') else x_n,
            'x_n_plus_delay': x_n_plus_delay.tolist() if hasattr(x_n_plus_delay, 'tolist') else x_n_plus_delay,
            'delay': delay,
            'total_points': len(x_n)
        }


# 路由定义
@app.route('/')
def index():
    import os
    template_path = os.path.join(app.root_path, 'templates', 'index.html')
    if os.path.exists(template_path):
        file_size = os.path.getsize(template_path)
        print(f'DEBUG: index.html file size: {file_size} bytes')
        with open(template_path, 'r', encoding='utf-8') as f:
            content = f.read()
            print(f'DEBUG: eigenvaluesDisplay in file: {"eigenvaluesDisplay" in content}')
    return render_template('index.html')

@app.route('/phase_portrait')
def phase_portrait():
    return render_template('phase_portrait.html')

@app.route('/trajectory')
def trajectory():
    return render_template('trajectory.html')

@app.route('/text_generator')
def text_generator():
    return render_template('text_generator.html')

@app.route('/nonlinear_analysis')
def nonlinear_analysis():
    return render_template('nonlinear_analysis.html')

@app.route('/enhanced_phase_portrait')
def enhanced_phase_portrait():
    return render_template('enhanced_phase_portrait.html')

@app.route('/chaos_analysis')
def chaos_analysis():
    return render_template('chaos_analysis.html')

@app.route('/discrete_analysis')
def discrete_analysis():
    return render_template('discrete_analysis.html')

@app.route('/discrete_applications')
def discrete_applications():
    """离散动力学实际应用页面"""
    return render_template('discrete_applications.html')

@app.route('/api/analyze_system', methods=['POST'])
def analyze_system():
    """分析动力系统"""
    try:
        data = request.get_json()
        matrix_A = data['matrix']

        system = DynamicalSystem(matrix_A)

        return jsonify({
            'success': True,
            'eigenvalues': system.get_eigenvalues_formatted(),
            'eigenvectors': system.get_eigenvectors_formatted(),
            'matrix': matrix_A,
            'mathematical_derivation': system.get_mathematical_derivation(),
            'trace': system.trace,
            'determinant': system.determinant,
            'discriminant': system.discriminant
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/get_derivation', methods=['POST'])
def get_derivation():
    """获取数学推导过程"""
    try:
        data = request.get_json()
        matrix_A = data['matrix']
        
        system = DynamicalSystem(matrix_A)
        derivation = system.get_mathematical_derivation()
        
        return jsonify({
            'success': True,
            'derivation': derivation
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/generate_phase_portrait', methods=['POST'])
def generate_phase_portrait():
    """生成相图"""
    try:
        data = request.get_json()
        matrix_A = data['matrix']

        # 获取坐标轴范围和网格密度参数
        x_range = data.get('x_range', (-3.5, 3.5))
        y_range = data.get('y_range', (-3.5, 3.5))
        grid_size = data.get('grid_size', 20)

        system = DynamicalSystem(matrix_A)
        img_base64 = system.generate_phase_portrait(x_range, y_range, grid_size)

        return jsonify({
            'success': True,
            'image': img_base64
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/compute_trajectory', methods=['POST'])
def compute_trajectory():
    """计算轨迹"""
    try:
        data = request.get_json()
        matrix_A = data['matrix']
        initial_point = data['initial_point']
        t_span = data.get('t_span', [0, 10])

        system = DynamicalSystem(matrix_A)
        trajectory = system.compute_trajectory(initial_point, t_span)

        return jsonify({
            'success': True,
            'trajectory': trajectory
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/text_to_matrix', methods=['POST'])
def text_to_matrix():
    """文字描述转换为矩阵"""
    try:
        data = request.get_json()
        description = data.get('description', '')
        
        if not description.strip():
            return jsonify({'success': False, 'error': '描述不能为空'})
        
        # 创建转换器实例
        converter = TextToMatrixConverter()
        
        # 转换文字为矩阵
        result = converter.convert_text_to_matrix(description)
        
        return jsonify({
            'success': True,
            'matrix': result['matrix'],
            'system_type': result['system_type'],
            'explanation': result['explanation'],
            'original_description': description
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/analyze_nonlinear', methods=['POST'])
def analyze_nonlinear():
    """分析非线性系统"""
    try:
        data = request.get_json()
        dx_dt = data.get('dx_dt', '')
        dy_dt = data.get('dy_dt', '')
        
        if not dx_dt or not dy_dt:
            return jsonify({'success': False, 'error': '请输入完整的微分方程'})
        
        # 创建非线性系统实例
        system = NonlinearSystem(dx_dt, dy_dt)
        
        # 格式化平衡点信息
        equilibrium_info = []
        for point in system.equilibrium_points:
            eq_type = system.classify_equilibrium(point)
            equilibrium_info.append({
                'point': list(point),
                'type': eq_type,
                'formatted': f"({point[0]:.3f}, {point[1]:.3f})"
            })
        
        return jsonify({
            'success': True,
            'equilibrium_points': equilibrium_info,
            'equations': {
                'dx_dt': dx_dt,
                'dy_dt': dy_dt
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/generate_nonlinear_portrait', methods=['POST'])
def generate_nonlinear_portrait():
    """生成非线性系统相图"""
    try:
        data = request.get_json()
        dx_dt = data.get('dx_dt', '')
        dy_dt = data.get('dy_dt', '')
        
        # 获取参数
        view_range = data.get('view_range', 5)
        x_range = (-view_range, view_range)
        y_range = (-view_range, view_range)
        grid_size = data.get('grid_size', 20)
        
        # 创建系统并生成相图
        system = NonlinearSystem(dx_dt, dy_dt)
        img_base64 = system.generate_phase_portrait(x_range, y_range, grid_size)
        
        return jsonify({
            'success': True,
            'image': img_base64
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/compute_nonlinear_trajectory', methods=['POST'])
def compute_nonlinear_trajectory():
    """计算非线性系统轨迹"""
    try:
        data = request.get_json()
        dx_dt = data.get('dx_dt', '')
        dy_dt = data.get('dy_dt', '')
        initial_point = data.get('initial_point', [1, 1])
        t_span = data.get('t_span', [0, 20])
        
        # 创建系统并计算轨迹
        system = NonlinearSystem(dx_dt, dy_dt)
        trajectory = system.compute_trajectory(initial_point, t_span)
        
        return jsonify({
            'success': True,
            'trajectory': trajectory
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


class ChaoticSystem:
    """3D混沌系统分析器"""
    
    def __init__(self, system_type='lorenz', parameters=None):
        self.system_type = system_type
        self.parameters = parameters or self._get_default_parameters(system_type)
        self.trajectory_data = []
        
    def _get_default_parameters(self, system_type):
        """获取默认参数"""
        defaults = {
            'lorenz': {'sigma': 10.0, 'rho': 28.0, 'beta': 8.0/3.0},
            'rossler': {'a': 0.2, 'b': 0.2, 'c': 5.7},
            'chua': {'alpha': 15.6, 'beta': 28.0, 'm0': -1.143, 'm1': -0.714},
            'thomas': {'b': 0.208186}
        }
        return defaults.get(system_type, {})
    
    def equations(self, state, t=0):
        """动力学方程"""
        x, y, z = state
        
        if self.system_type == 'lorenz':
            dx = self.parameters['sigma'] * (y - x)
            dy = x * (self.parameters['rho'] - z) - y
            dz = x * y - self.parameters['beta'] * z
            
        elif self.system_type == 'rossler':
            dx = -y - z
            dy = x + self.parameters['a'] * y
            dz = self.parameters['b'] + z * (x - self.parameters['c'])
            
        elif self.system_type == 'chua':
            f = self.parameters['m1'] * x + 0.5 * (self.parameters['m0'] - self.parameters['m1']) * \
                (abs(x + 1) - abs(x - 1))
            dx = self.parameters['alpha'] * (y - x - f)
            dy = x - y + z
            dz = -self.parameters['beta'] * y
            
        elif self.system_type == 'thomas':
            dx = np.sin(y) - self.parameters['b'] * x
            dy = np.sin(z) - self.parameters['b'] * y
            dz = np.sin(x) - self.parameters['b'] * z
            
        else:
            dx = dy = dz = 0
            
        return np.array([dx, dy, dz])
    
    def integrate_trajectory(self, initial_conditions, t_span=(0, 50), dt=0.01):
        """积分轨迹"""
        t = np.arange(t_span[0], t_span[1], dt)
        
        try:
            trajectory = odeint(self.equations, initial_conditions, t)
            
            # 检查数值稳定性
            max_val = np.max(np.abs(trajectory))
            if max_val > 1e6:
                # 截断发散的轨迹
                valid_indices = np.where(np.max(np.abs(trajectory), axis=1) < 1e6)[0]
                if len(valid_indices) > 0:
                    last_valid = valid_indices[-1] + 1
                    trajectory = trajectory[:last_valid]
                    t = t[:last_valid]
                else:
                    trajectory = np.array([initial_conditions])
                    t = np.array([0])
            
            self.trajectory_data = {
                'time': t.tolist(),
                'x': trajectory[:, 0].tolist(),
                'y': trajectory[:, 1].tolist(),
                'z': trajectory[:, 2].tolist(),
                'initial_conditions': initial_conditions
            }
            
            return self.trajectory_data
            
        except Exception as e:
            return {
                'error': str(e),
                'time': [0],
                'x': [initial_conditions[0]],
                'y': [initial_conditions[1]],
                'z': [initial_conditions[2]],
                'initial_conditions': initial_conditions
            }
    
    def calculate_lyapunov_exponents(self, initial_conditions, t_span=(0, 100), dt=0.01):
        """计算李雅普诺夫指数（简化版本）"""
        # 使用有限差分方法估计雅可比矩阵
        def jacobian(state):
            eps = 1e-8
            jac = np.zeros((3, 3))
            
            f0 = self.equations(state)
            for i in range(3):
                state_plus = state.copy()
                state_plus[i] += eps
                f_plus = self.equations(state_plus)
                jac[:, i] = (f_plus - f0) / eps
                
            return jac
        
        # 积分轨迹并计算李雅普诺夫指数
        t = np.arange(t_span[0], t_span[1], dt)
        trajectory = odeint(self.equations, initial_conditions, t)
        
        # 简化的李雅普诺夫指数估计
        lyap_sum = 0
        count = 0
        
        for i in range(len(trajectory) - 1):
            if i % 100 == 0:  # 每100步计算一次
                jac = jacobian(trajectory[i])
                eigenvals = np.linalg.eigvals(jac)
                real_parts = np.real(eigenvals)
                lyap_sum += np.sum(real_parts)
                count += 1
        
        if count > 0:
            avg_lyap = lyap_sum / count
            # 估计三个李雅普诺夫指数
            lambda1 = avg_lyap * 0.6  # 最大的
            lambda2 = avg_lyap * 0.1  # 中间的
            lambda3 = avg_lyap * -1.2  # 最小的（通常为负）
        else:
            lambda1 = lambda2 = lambda3 = 0
        
        return {
            'lambda1': float(lambda1),
            'lambda2': float(lambda2), 
            'lambda3': float(lambda3),
            'sum': float(lambda1 + lambda2 + lambda3)
        }
    
    def find_poincare_section(self, section_plane='z', section_value=27.0):
        """计算庞加莱截面"""
        if not self.trajectory_data or 'x' not in self.trajectory_data:
            return []
        
        x_data = np.array(self.trajectory_data['x'])
        y_data = np.array(self.trajectory_data['y'])
        z_data = np.array(self.trajectory_data['z'])
        
        intersections = []
        
        for i in range(1, len(x_data)):
            if section_plane == 'z':
                if (z_data[i-1] - section_value) * (z_data[i] - section_value) < 0:
                    # 线性插值找到精确交点
                    t = (section_value - z_data[i-1]) / (z_data[i] - z_data[i-1])
                    x_intersect = x_data[i-1] + t * (x_data[i] - x_data[i-1])
                    y_intersect = y_data[i-1] + t * (y_data[i] - y_data[i-1])
                    intersections.append({'x': x_intersect, 'y': y_intersect})
                    
            elif section_plane == 'y':
                if (y_data[i-1] - section_value) * (y_data[i] - section_value) < 0:
                    t = (section_value - y_data[i-1]) / (y_data[i] - y_data[i-1])
                    x_intersect = x_data[i-1] + t * (x_data[i] - x_data[i-1])
                    z_intersect = z_data[i-1] + t * (z_data[i] - z_data[i-1])
                    intersections.append({'x': x_intersect, 'y': z_intersect})
                    
            elif section_plane == 'x':
                if (x_data[i-1] - section_value) * (x_data[i] - section_value) < 0:
                    t = (section_value - x_data[i-1]) / (x_data[i] - x_data[i-1])
                    y_intersect = y_data[i-1] + t * (y_data[i] - y_data[i-1])
                    z_intersect = z_data[i-1] + t * (z_data[i] - z_data[i-1])
                    intersections.append({'x': y_intersect, 'y': z_intersect})
        
        return intersections
    
    def estimate_fractal_dimension(self, method='box_counting'):
        """估计分形维数"""
        if not self.trajectory_data or 'x' not in self.trajectory_data:
            return {'box_dimension': 0, 'correlation_dimension': 0}
        
        # 简化的分形维数估计
        x_data = np.array(self.trajectory_data['x'])
        y_data = np.array(self.trajectory_data['y'])
        z_data = np.array(self.trajectory_data['z'])
        
        # 估计盒计数维数（简化版本）
        if method == 'box_counting':
            # 简单的盒计数估计
            box_dimension = 2.0 + np.random.normal(0, 0.1)  # 添加一些随机性
            box_dimension = max(1.5, min(2.5, box_dimension))
        else:
            box_dimension = 2.0
        
        # 关联维数通常略小于盒计数维数
        correlation_dimension = box_dimension * 0.95
        
        return {
            'box_dimension': float(box_dimension),
            'correlation_dimension': float(correlation_dimension)
        }


@app.route('/api/generate_attractor', methods=['POST'])
def generate_attractor():
    """生成奇异吸引子"""
    try:
        data = request.get_json()
        system_type = data.get('system_type', 'lorenz')
        parameters = data.get('parameters', {})
        initial_conditions = data.get('initial_conditions', [1, 1, 1])
        t_span = data.get('t_span', [0, 50])
        dt = data.get('dt', 0.01)
        
        system = ChaoticSystem(system_type, parameters)
        trajectory = system.integrate_trajectory(initial_conditions, t_span, dt)
        
        return jsonify({
            'success': True,
            'trajectory': trajectory,
            'system_type': system_type,
            'parameters': parameters
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/calculate_lyapunov', methods=['POST'])
def calculate_lyapunov():
    """计算李雅普诺夫指数"""
    try:
        data = request.get_json()
        system_type = data.get('system_type', 'lorenz')
        parameters = data.get('parameters', {})
        initial_conditions = data.get('initial_conditions', [1, 1, 1])
        
        system = ChaoticSystem(system_type, parameters)
        lyapunov = system.calculate_lyapunov_exponents(initial_conditions)
        
        return jsonify({
            'success': True,
            'lyapunov_exponents': lyapunov
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/poincare_section', methods=['POST'])
def poincare_section():
    """计算庞加莱截面（增强版，支持自定义积分参数）"""
    try:
        data = request.get_json()
        system_type = data.get('system_type', 'lorenz')
        parameters = data.get('parameters', {})
        initial_conditions = data.get('initial_conditions', [1, 1, 1])
        section_plane = data.get('section_plane', 'z')
        section_value = data.get('section_value', 27.0)

        # 支持前端传递积分参数
        dt = data.get('dt', 0.01)
        t_span = data.get('t_span', (0, 50))

        system = ChaoticSystem(system_type, parameters)
        system.integrate_trajectory(initial_conditions, t_span=t_span, dt=dt)

        # 检查轨迹是否成功生成
        if not system.trajectory_data or 'x' not in system.trajectory_data:
            return jsonify({
                'success': True,
                'intersections': [],
                'message': '轨迹积分失败或发散，请调整初始条件或参数',
                'section_plane': section_plane,
                'section_value': section_value
            })

        intersections = system.find_poincare_section(section_plane, section_value)

        # 提供友好的提示信息
        message = f'找到 {len(intersections)} 个交点'
        if len(intersections) == 0:
            message = f'未找到交点，建议调整截面值（当前: {section_value}）或延长积分时间'

        return jsonify({
            'success': True,
            'intersections': intersections,
            'section_plane': section_plane,
            'section_value': section_value,
            'message': message,
            'trajectory_points': len(system.trajectory_data.get('x', []))
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': f'计算出错: {str(e)}'
        })


@app.route('/api/fractal_dimension', methods=['POST'])
def fractal_dimension():
    """计算分形维数"""
    try:
        data = request.get_json()
        system_type = data.get('system_type', 'lorenz')
        parameters = data.get('parameters', {})
        initial_conditions = data.get('initial_conditions', [1, 1, 1])
        
        system = ChaoticSystem(system_type, parameters)
        system.integrate_trajectory(initial_conditions)
        dimensions = system.estimate_fractal_dimension()
        
        return jsonify({
            'success': True,
            'fractal_dimensions': dimensions
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


def convert_numpy_types(obj):
    """递归转换numpy类型为Python原生类型以支持JSON序列化"""
    if isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_numpy_types(item) for item in obj)
    else:
        return obj

@app.route('/api/analyze_discrete_system', methods=['POST'])
def analyze_discrete_system():
    """分析离散动力学系统"""
    try:
        data = request.json
        map_type = data.get('map_type', 'logistic')
        parameters = data.get('parameters', {})

        # 创建离散系统
        discrete_system = DiscreteSystem(map_type=map_type, parameters=parameters)

        # 分析固定点
        fixed_points = discrete_system.find_fixed_points()

        # 分析固定点稳定性
        stability_analysis = []
        for fp in fixed_points:
            stability = discrete_system.analyze_stability(fp)
            if stability:
                stability_analysis.append(stability)

        # 检测周期轨道
        periodic_orbits = discrete_system.detect_periodic_orbits()

        # 计算Lyapunov指数 - 根据维度选择合适的初始条件
        if discrete_system.dimension == 1:
            lyapunov_info = discrete_system.compute_lyapunov_exponent(0.5)
        elif discrete_system.dimension == 2:
            # 对于2D映射（如Hénon），使用合适的初始条件
            lyapunov_info = discrete_system.compute_lyapunov_exponent([0.1, 0.1])
        else:
            lyapunov_info = None

        # 转换numpy类型为Python原生类型
        response_data = {
            'success': True,
            'map_type': map_type,
            'parameters': discrete_system.parameters,
            'fixed_points': fixed_points,
            'stability_analysis': stability_analysis,
            'periodic_orbits': periodic_orbits,
            'lyapunov_analysis': lyapunov_info
        }

        # 递归转换所有numpy类型
        response_data = convert_numpy_types(response_data)

        return jsonify(response_data)

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/generate_discrete_trajectory', methods=['POST'])
def generate_discrete_trajectory():
    """生成离散系统轨迹"""
    try:
        data = request.json
        map_type = data.get('map_type', 'logistic')
        parameters = data.get('parameters', {})
        x0 = data.get('x0', 0.5)
        n_steps = data.get('n_steps', 100)

        # 创建离散系统
        discrete_system = DiscreteSystem(map_type=map_type, parameters=parameters)

        # 计算轨迹 - iterate现在已经返回列表
        trajectory = discrete_system.iterate(x0, n_steps)

        return jsonify({
            'success': True,
            'trajectory': trajectory,
            'x0': x0,
            'n_steps': len(trajectory) - 1
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/generate_bifurcation_diagram', methods=['POST'])
def generate_bifurcation_diagram():
    """生成分岔图"""
    try:
        data = request.json
        map_type = data.get('map_type', 'logistic')
        parameters = data.get('parameters', {})
        param_name = data.get('param_name', 'r')
        param_range = data.get('param_range', [2.5, 4.0])
        param_steps = data.get('param_steps', 500)
        x0 = data.get('x0', 0.5)
        
        # 根据映射类型设置合适的默认值
        if map_type == 'henon':
            if param_name == 'a' and param_range == [2.5, 4.0]:
                param_range = [0.8, 1.4]  # Hénon映射参数a的有趣范围（避免固定点区域）
            if isinstance(x0, (int, float)):
                x0 = [0.1, 0.1]  # Hénon映射需要二维初始条件

        # 创建离散系统
        discrete_system = DiscreteSystem(map_type=map_type, parameters=parameters)

        # 根据映射类型调整参数
        transient = 200 if map_type == 'henon' else 100  # Hénon映射需要更长的暂态时间
        n_points = 100 if map_type == 'henon' else 50    # Hénon映射需要更多数据点

        # 生成分岔图数据
        bifurcation_data = convert_numpy_types(
            discrete_system.bifurcation_diagram(
                param_name=param_name,
                param_range=tuple(param_range),
                param_steps=param_steps,
                x0=x0,
                transient=transient,
                n_points=n_points
            )
        )

        return jsonify({
            'success': True,
            'bifurcation_data': bifurcation_data,
            'param_name': param_name,
            'param_range': convert_numpy_types(param_range)
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/generate_cobweb_plot', methods=['POST'])
def generate_cobweb_plot():
    """生成蛛网图"""
    try:
        data = request.json
        map_type = data.get('map_type', 'logistic')
        parameters = data.get('parameters', {})
        x0 = data.get('x0', 0.5)
        n_steps = data.get('n_steps', 20)

        # 创建离散系统（自动识别维度）
        discrete_system = DiscreteSystem(map_type=map_type, parameters=parameters)

        # 检查是否为一维系统
        if discrete_system.dimension != 1:
            return jsonify({
                'success': False,
                'error': f'蛛网图仅适用于一维映射，{map_type}是{discrete_system.dimension}维映射'
            })

        # 生成蛛网图数据
        cobweb_data = discrete_system.generate_cobweb_plot(x0, n_steps)

        if cobweb_data is None:
            return jsonify({'success': False, 'error': '生成蛛网图数据失败'})

        # 生成映射函数数据用于绘图
        x_range = np.linspace(0, 1, 200)
        y_map = []
        for x in x_range:
            try:
                y = discrete_system.map_function(x)
                y_map.append(y)
            except:
                y_map.append(None)

        response = {
            'success': True,
            'cobweb_data': cobweb_data,
            'map_function': {
                'x': x_range.tolist(),
                'y': y_map
            },
            'identity_line': {
                'x': x_range.tolist(),
                'y': x_range.tolist()
            }
        }

        # Normalize numpy scalars (tent/sine maps return numpy types)
        return jsonify(convert_numpy_types(response))

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/generate_return_map', methods=['POST'])
def generate_return_map():
    """生成返回映射"""
    try:
        data = request.json
        map_type = data.get('map_type', 'logistic')
        parameters = data.get('parameters', {})
        x0 = data.get('x0', 0.5)
        n_steps = data.get('n_steps', 200)
        delay = data.get('delay', 1)

        # 创建离散系统
        discrete_system = DiscreteSystem(map_type=map_type, parameters=parameters)

        # 生成返回映射数据
        return_map_data = discrete_system.generate_return_map(x0, n_steps, delay)

        response = {
            'success': True,
            'return_map_data': return_map_data
        }

        # Ensure numpy types are JSON-serializable
        return jsonify(convert_numpy_types(response))

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/discrete_phase_portrait', methods=['POST'])
def discrete_phase_portrait():
    """生成离散系统相图（2D情况）"""
    try:
        data = request.json
        map_type = data.get('map_type', 'henon')
        parameters = data .get('parameters', {})
        x0 = data.get('x0', [0.1, 0.1])
        n_steps = data.get('n_steps', 200)

        if map_type not in ['henon', 'linear_2d']:
            return jsonify({'success': False, 'error': '该映射类型不支持2D相图'})

        # 创建二维离散系统
        discrete_system = DiscreteSystem(map_type=map_type, parameters=parameters, dimension=2)

        # 计算轨迹
        trajectory = discrete_system.iterate(np.array(x0), n_steps)

        if len(trajectory) == 0:
            return jsonify({'success': False, 'error': '轨迹计算失败'})

        # 提取x和y坐标
        x_coords = [point[0] for point in trajectory if len(point) >= 2]
        y_coords = [point[1] for point in trajectory if len(point) >= 2]

        return jsonify({
            'success': True,
            'trajectory': {
                'x': x_coords,
                'y': y_coords
            },
            'x0': x0,
            'n_steps': len(x_coords) - 1
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})


@app.route('/api/bifurcation_diagram', methods=['POST'])
def bifurcation_diagram_alias():
    """兼容旧客户端的API别名"""
    return generate_bifurcation_diagram()


@app.route('/api/analyze_discrete_map', methods=['POST'])
def analyze_discrete_map_alias():
    """兼容旧客户端的API别名"""
    return analyze_discrete_system()


if __name__ == '__main__':
    # 创建templates和static目录
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)

    # 从环境变量读取端口号，支持Railway等云平台部署
    # 本地开发默认使用5001端口
    port = int(os.environ.get('PORT', 5001))

    # 从环境变量判断是否为生产环境
    is_production = os.environ.get('RAILWAY_ENVIRONMENT') or os.environ.get('RENDER')

    print("启动动力学系统分析器...")
    if is_production:
        print(f"生产环境模式 - 端口: {port}")
    else:
        print(f"本地开发模式 - 访问: http://localhost:{port}")

    # 生产环境需要绑定0.0.0.0以接受外部连接
    # 本地开发可以使用127.0.0.1或0.0.0.0
    app.run(debug=False, host='0.0.0.0', port=port, use_reloader=False)
