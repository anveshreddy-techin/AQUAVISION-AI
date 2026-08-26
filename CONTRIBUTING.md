# Contributing to AquaVision AI

Thank you for your interest in contributing to **AquaVision AI (SIH26057)** — AI-Powered Automated Underwater Marine Debris & Anomaly Detection System using Side-Scan Sonar Imagery.

## 🤝 Code of Conduct & Honesty Contract

All contributors must adhere to our [HONESTY.md](HONESTY.md) principles:
1. **Never conflate modalities**: Side-Scan Sonar (SSS) models must never be evaluated against FLS/Optical data without explicit, visible disclaimers.
2. **Synthetic Data Transparency**: Any synthetic or heuristic data must be explicitly labeled `[SYNTHETIC]` or `[DEMO]`.
3. **Reproducibility**: All training scripts, evaluation metrics, and preprocessing steps must be documented and reproducible.

## 🛠️ Development Workflow

1. Fork and clone the repository.
2. Install Python dependencies:
   ```bash
   pip install -r services/api/requirements.txt
   ```
3. Install frontend dependencies:
   ```bash
   cd apps/web && npm install
   ```
4. Run tests before submitting a Pull Request:
   ```bash
   ./scripts/test.sh
   ```

## 📬 Submitting Changes

- Open an issue describing the proposed feature or bugfix.
- Create a feature branch (`git checkout -b feature/your-feature`).
- Ensure all tests pass.
- Open a Pull Request with a clear summary of changes.
