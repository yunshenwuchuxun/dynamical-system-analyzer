# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

智能动力学系统分析器 - A Flask-based web application for analyzing and visualizing 2D/3D linear and nonlinear dynamical systems. Features intelligent text-to-matrix generation, phase portraits, trajectory animations, chaos analysis, and real-world discrete dynamical system applications (population dynamics, epidemiology, economics, ecology).

## Running the Application

### Start the Server

**Windows (Recommended):**
```bash
start.bat
```
Uses the Anaconda environment at `D:\Anaconda\envs\html\python.exe`

**Cross-platform:**
```bash
python app.py
```

The application starts on `http://localhost:5001` (port 5001, not 5000)

### Installing Dependencies

```bash
pip install -r requirements.txt
```

**Core Dependencies:**
- Flask 3.0.3 (web framework)
- NumPy 1.22.1 (numerical computing)
- Matplotlib 3.7.2 (visualization)
- SciPy 1.10.1 (ODE integration)
- SymPy 1.12 (symbolic mathematics)

## Project Architecture

### Backend Structure (`app.py`)

**Core Analysis Classes:**

1. **`DynamicalSystem`** - 2D Linear systems (lines 30-378)
   - Eigenvalue/eigenvector calculations via `np.linalg.eig`
   - Step-by-step mathematical derivations (`get_mathematical_derivation`)
   - Lyapunov stability analysis with quadratic form
   - Phase portrait generation with Matplotlib

2. **`NonlinearSystem`** - 2D Nonlinear systems (lines 380-656)
   - Equation parsing from text strings using SymPy
   - Automatic equilibrium point detection (symbolic + numerical)
   - Jacobian-based linearization for stability classification
   - Robust numerical integration with divergence handling

3. **`TextToMatrixConverter`** - Intelligent text-to-matrix (lines 657-939)
   - 12 pattern types: spirals, ellipses, saddles, nodes, centers
   - Extensive Chinese keyword matching (200+ keywords)
   - Rotation transforms for tilted patterns
   - Random parameter generation within valid ranges

4. **`DiscreteSystem`** - Discrete maps (lines 942-1511)
   - 1D maps: Logistic, Tent, Sine, Linear
   - 2D maps: Hénon, Linear 2D, Rotation
   - Fixed point and periodic orbit detection
   - Lyapunov exponent calculation (1D and 2D methods)
   - Bifurcation diagram generation
   - Cobweb plot and return map generation

5. **`ChaoticSystem`** - 3D Chaotic systems (lines 1748-1946)
   - Four attractors: Lorenz, Rössler, Chua, Thomas
   - Trajectory integration with divergence protection
   - Lyapunov exponent estimation via Jacobian eigenvalues
   - Poincaré section computation with linear interpolation
   - Fractal dimension estimation

### Key API Endpoints

**Linear Systems:**
- `POST /api/analyze_system` - Analyze eigenvalues, trace, determinant
- `POST /api/get_derivation` - Mathematical derivation with LaTeX-style steps
- `POST /api/generate_phase_portrait` - Base64-encoded PNG image
- `POST /api/compute_trajectory` - ODE solution via `scipy.integrate.odeint`
- `POST /api/text_to_matrix` - Natural language → coefficient matrix

**Nonlinear Systems:**
- `POST /api/analyze_nonlinear` - Find equilibrium points with classification
- `POST /api/generate_nonlinear_portrait` - Nonlinear phase portrait
- `POST /api/compute_nonlinear_trajectory` - Trajectory with error handling

**Chaos Analysis:**
- `POST /api/generate_attractor` - 3D chaotic attractors
- `POST /api/calculate_lyapunov` - Lyapunov exponent spectrum
- `POST /api/poincare_section` - Poincaré map intersections
- `POST /api/fractal_dimension` - Box-counting and correlation dimensions

**Discrete Systems:**
- `POST /api/analyze_discrete_system` - Fixed points, stability, Lyapunov
- `POST /api/generate_discrete_trajectory` - Iterate map n times
- `POST /api/generate_bifurcation_diagram` - Parameter sweep data
- `POST /api/generate_cobweb_plot` - Cobweb diagram data
- `POST /api/generate_return_map` - Return map with delay
- `POST /api/discrete_phase_portrait` - 2D map visualization

### Frontend Pages

**Core Pages:**
- `index.html` - Landing page with matrix input (eigenvalue display)
- `text_generator.html` - AI-powered text-to-matrix generation
- `phase_portrait.html` - Linear system phase portraits
- `trajectory.html` - Trajectory animation with Canvas playback
- `nonlinear_analysis.html` - Nonlinear system tools
- `enhanced_phase_portrait.html` - Advanced visualization features

**Advanced Analysis:**
- `chaos_analysis.html` - 3D chaotic attractors and analysis tools
- `discrete_analysis.html` - Discrete map analysis (bifurcation, cobweb, return map)
- `discrete_applications.html` - Real-world applications (fully frontend)

### JavaScript Modules

Located in `static/js/`:

- `phase_portrait.js` - Linear phase portrait controls
- `trajectory.js` - Canvas-based trajectory animation
- `text_generator.js` - Text-to-matrix UI logic
- `nonlinear_analysis.js` - Nonlinear system controls
- `enhanced_phase_portrait_fixed.js` - Enhanced visualization
- `chaos_analysis.js` - 3D attractor visualization (Three.js/Plotly)
- `discrete_analysis.js` - Discrete map plotting and controls
- `discrete_applications.js` - Four application models (pure frontend):
  - Population dynamics (Ricker model)
  - Epidemic model (discrete SIR)
  - Economic cycles (cobweb model)
  - Predator-prey (discrete Lotka-Volterra)
- `animation-core.js` - Shared animation utilities
- `theme-toggle.js` - Dark/light mode switching
- `help_system.js` - Interactive help overlays
- `particles.js` - Background particle effects

## Code Conventions

### Mathematical Computing Patterns

**NumPy Usage:**
- Eigenvalues: `np.linalg.eig(matrix)` returns (eigenvalues, eigenvectors)
- Matrix operations: Use `@` operator for matrix multiplication
- Always convert to float: `np.array(matrix, dtype=float)`

**SciPy Integration:**
- Primary: `scipy.integrate.odeint(func, y0, t)`
- Alternative: `scipy.integrate.solve_ivp` for advanced control
- Always include divergence checks: `if abs(x) > 1e6: break`

**SymPy Symbolic Math:**
- Parse equations: Handle `^` → `**` conversion, implicit multiplication
- Solve systems: `sp.solve([eq1, eq2], [x, y])` returns list or dict
- Lambdify for numerical: `lambdify((x, y), expr, 'numpy')`

### Chinese Font Configuration

**Required setup in all Matplotlib code:**
```python
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False
```

### System Classification (Eigenvalue-based)

**2D Linear Systems:**
```
Trace = λ₁ + λ₂, Determinant = λ₁ · λ₂, Discriminant = Trace² - 4·Det

Real eigenvalues (Δ ≥ 0):
  - Both negative → Stable node
  - Both positive → Unstable node
  - Opposite signs → Saddle point

Complex eigenvalues (Δ < 0):
  - Re(λ) < 0 → Stable focus
  - Re(λ) > 0 → Unstable focus
  - Re(λ) = 0 → Center
```

### Neobrutalism Theme System

**CSS Variables (defined in `static/css/theme.css`):**
- Colors: `--background`, `--foreground`, `--primary`, `--secondary`
- Shadows: `--shadow`, `--shadow-lg`, `--shadow-xl` (flat, no blur)
- Typography: `--font-sans` (Poppins), `--font-mono` (Fira Code)
- Borders: Bold 2-3px borders, consistent `--radius`

**Dark Mode:**
- Managed by `theme-toggle.js` using localStorage
- Toggle button uses `data-theme-toggle` attribute
- Respects system preference on first load

### JSON Serialization Pattern

**NumPy type conversion (critical for API responses):**
```python
def convert_numpy_types(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, np.floating):
        return float(obj)
    # ... (see app.py:2064-2081 for full implementation)
```

Always apply to API responses containing NumPy arrays or scalars.

## Common Development Tasks

### Adding a New Chaotic Attractor

1. Add equations to `ChaoticSystem.equations()` method (app.py:1766)
2. Add default parameters to `_get_default_parameters()` (app.py:1756)
3. Update frontend dropdown in `chaos_analysis.html`
4. Add parameter controls in `chaos_analysis.js`

### Adding a Discrete Map Type

1. Implement map function in `DiscreteSystem.map_function()` (app.py:978)
2. Set dimension in `_get_dimension()` (app.py:953)
3. Add default parameters in `_get_default_parameters()` (app.py:966)
4. Update frontend UI in `discrete_analysis.html` and `discrete_analysis.js`

### Modifying Phase Portrait Styling

**Color scheme is in `DynamicalSystem.generate_phase_portrait()` (app.py:307-367):**
- Background: `#F8F9FA` (light gray-white)
- Vector field: `#7C8DB5` (soft blue-purple)
- Nullclines: `#4DB8AC` (cyan) and `#9B7EBD` (purple)
- Equilibrium: White with `#667EEA` border
- Grid: `#B0BEC5` alpha 0.25

Use CSS variables for consistency with theme system.

### Adding Real-World Application to Discrete Applications

**All applications are pure frontend (no backend API):**

1. Add model function in `discrete_applications.js`:
   ```javascript
   function myModel(params, initialState, steps) {
       // Implement discrete iteration
   }
   ```

2. Add UI section in `discrete_applications.html`:
   - Parameter sliders
   - Chart containers
   - Control buttons

3. Wire up event listeners in `discrete_applications.js`
4. Use Chart.js for visualization

## Important Technical Details

### Trajectory Computation

**Backend (accurate):**
- ODE solver: `scipy.integrate.odeint` with `rtol=1e-8, atol=1e-10`
- Handles stiff systems and adaptive time stepping
- Truncates divergent trajectories: `if max_val > 1e6`

**Frontend fallback (for offline use):**
- Simple Euler method: `x_new = x + dt * f(x)`
- Used when backend API unavailable
- Lower accuracy but instant visualization

**State vector format:**
- Single trajectory: `[x, y]`
- Multiple trajectories: `[x1, y1, x2, y2, ...]` (interleaved)

### Text-to-Matrix Generation Algorithm

**Pattern matching:**
1. Tokenize Chinese description
2. Score each pattern based on keyword frequency
3. Select highest scoring pattern
4. Generate matrix with random parameters in valid ranges
5. Apply rotation transform for tilted patterns

**Supported patterns (12 types):**
- Spirals: `stable_spiral`, `unstable_spiral`
- Ellipses: `elliptical`, `tilted_elliptical`, `highly_tilted_elliptical`, `diagonal_elliptical`, `narrow_elliptical`
- Nodes: `stable_node`, `unstable_node`, `star`
- Others: `saddle`, `center`, `circular`

### Discrete System Bifurcation Diagrams

**Critical implementation detail (app.py:1386):**
```python
# Reset to initial state for EACH parameter value
x = initial_state.copy()
```
Without this, bifurcation diagrams show incorrect transient mixing between parameter values.

**For 2D maps (Hénon):**
- Only plot x-component: `bifurcation_data.append({'parameter': p, 'points': [x[0] for x in points]})`
- Use longer transient (200 steps) and more samples (100 points)

### Poincaré Section Computation

**Linear interpolation for exact intersection (app.py:1896-1918):**
```python
if (z_data[i-1] - section_value) * (z_data[i] - section_value) < 0:
    t = (section_value - z_data[i-1]) / (z_data[i] - z_data[i-1])
    x_intersect = x_data[i-1] + t * (x_data[i] - x_data[i-1])
```

Always integrate trajectory first, then compute section.

### Return Map Convergence Detection

**Prevents plotting converged fixed points (app.py:1471-1490):**
- Checks for 30 consecutive points with change < 1e-6
- Ensures minimum 80% of requested points retained
- Critical for clean return map visualization

## Port Configuration

**Default port: 5001** (not 5000 to avoid macOS AirPlay conflicts)

Change in `app.py:2357`:
```python
app.run(debug=False, port=5001, use_reloader=False)
```

## Development vs Production

**Current configuration (production-stable):**
```python
debug=False          # Disable debug mode
use_reloader=False   # Prevent auto-restart (avoids duplicate processes)
```

**For development:**
```python
debug=True           # Enable debug mode with error pages
use_reloader=True    # Auto-reload on file changes
```

## Template Auto-Reload Configuration

Flask is configured for template hot-reloading (app.py:24-27):
```python
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True
app.jinja_env.cache = {}
```

Changes to HTML templates reflect immediately without restart.

## Matplotlib Backend

**Always use non-interactive backend in Flask:**
```python
import matplotlib
matplotlib.use('Agg')  # Must be called before importing pyplot
import matplotlib.pyplot as plt
```

This prevents threading issues and enables in-memory image generation.

## Additional Documentation

- `THEME_GUIDE.md` - Neobrutalism theme system documentation
- `discrete_applications_guide.md` - User guide for discrete applications
- `QUICK_REFERENCE.txt` - API endpoint quick reference (if exists)
- `COLOR_MIGRATION_REPORT.md` - Theme migration history
- `THEME_IMPLEMENTATION_SUMMARY.md` - Theme implementation notes
