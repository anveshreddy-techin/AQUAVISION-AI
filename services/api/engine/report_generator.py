"""PDF Report Generator for AquaVision AI surveys."""
import os
from datetime import datetime
from pathlib import Path
from services.api.config import settings


def generate_pdf_report(survey_id: int, report_id: int, db) -> str:
    """Generate a PDF report for a survey. Returns the file path."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    from database.models.surveys import Survey
    from database.models.ai import Candidate
    from database.models.review import Correction
    from database.models.processing import ModelVersion

    settings.ensure_dirs()
    output_dir = settings.REPORTS_DIR / str(survey_id)
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = str(output_dir / f"report_{report_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf")

    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    candidates = db.query(Candidate).filter(Candidate.survey_id == survey_id).order_by(Candidate.priority_score.desc()).all()
    corrections = db.query(Correction).filter(Correction.candidate_id.in_([c.id for c in candidates])).all() if candidates else []

    doc = SimpleDocTemplate(output_path, pagesize=A4, topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontSize=24, spaceAfter=20,
                                  textColor=colors.HexColor('#0891b2'))
    heading_style = ParagraphStyle('CustomHeading', parent=styles['Heading2'], fontSize=14,
                                    textColor=colors.HexColor('#164e63'), spaceBefore=15, spaceAfter=8)
    body_style = styles['Normal']
    warning_style = ParagraphStyle('Warning', parent=styles['Normal'], textColor=colors.HexColor('#c2410c'),
                                    fontSize=9, italic=True)

    elements = []

    # Title Page
    elements.append(Spacer(1, 2*inch))
    elements.append(Paragraph("AquaVision AI", title_style))
    elements.append(Paragraph("AI-Powered Underwater Marine Debris & Anomaly Detection", styles['Heading3']))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph(f"Survey Report: {survey.name if survey else 'Unknown'}", styles['Heading2']))
    elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", body_style))
    elements.append(Paragraph(f"Report ID: {report_id}", body_style))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("PRECOMPUTED FOR DEMO RELIABILITY", warning_style))
    elements.append(PageBreak())

    # Executive Summary
    elements.append(Paragraph("Executive Summary", heading_style))
    if survey:
        total_cands = len(candidates)
        critical = sum(1 for c in candidates if c.priority_category == "CRITICAL")
        high = sum(1 for c in candidates if c.priority_category == "HIGH")
        reviewed = sum(1 for c in candidates if c.status in ("ACCEPTED", "REJECTED", "CORRECTED"))
        accepted = sum(1 for c in candidates if c.status == "ACCEPTED")
        elements.append(Paragraph(
            f"Survey '{survey.name}' was processed through the AquaVision AI pipeline. "
            f"From {survey.total_frames} frames, {total_cands} candidates were identified, "
            f"of which {critical} are CRITICAL priority and {high} are HIGH priority. "
            f"{reviewed} candidates have been reviewed ({accepted} accepted).", body_style))
    elements.append(Spacer(1, 0.3*inch))

    # Survey Metadata
    elements.append(Paragraph("Survey Metadata", heading_style))
    if survey:
        meta_data = [
            ["Field", "Value"],
            ["Survey Name", survey.name],
            ["Sonar Modality", survey.sonar_modality],
            ["Area", survey.area_name or "Not specified"],
            ["Vessel", survey.vessel_name or "Not specified"],
            ["Total Files", str(survey.total_files)],
            ["Total Frames", str(survey.total_frames)],
            ["Processed Frames", str(survey.processed_frames)],
            ["Failed Frames", str(survey.failed_frames)],
            ["Status", survey.status],
            ["GPS Available", "Yes" if survey.gps_available else "No"],
        ]
        t = Table(meta_data, colWidths=[2.5*inch, 4*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0891b2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f9ff')]),
        ]))
        elements.append(t)
    elements.append(Spacer(1, 0.3*inch))

    # Candidate Summary
    elements.append(Paragraph("Candidate Summary", heading_style))
    priority_data = [["Priority", "Count"]]
    for p in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        count = sum(1 for c in candidates if c.priority_category == p)
        priority_data.append([p, str(count)])
    t = Table(priority_data, colWidths=[3*inch, 3*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0891b2')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.3*inch))

    # High Priority Findings
    elements.append(Paragraph("High-Priority Findings", heading_style))
    high_priority = [c for c in candidates if c.priority_category in ("CRITICAL", "HIGH")]
    if high_priority:
        hp_data = [["ID", "Type", "Class", "Confidence", "Anomaly", "Priority", "Status"]]
        for c in high_priority[:20]:
            hp_data.append([str(c.id), c.candidate_type, c.object_class or "Unknown",
                           f"{c.confidence:.2f}" if c.confidence else "N/A",
                           f"{c.anomaly_score:.2f}" if c.anomaly_score else "N/A",
                           c.priority_category, c.status])
        t = Table(hp_data, colWidths=[0.5*inch, 0.8*inch, 1.2*inch, 0.8*inch, 0.8*inch, 0.8*inch, 0.8*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dc2626')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(t)
    else:
        elements.append(Paragraph("No high-priority candidates found.", body_style))
    elements.append(Spacer(1, 0.3*inch))

    # Limitations
    elements.append(Paragraph("Limitations & Disclaimers", heading_style))
    elements.append(Paragraph("• Detection model: DEMO heuristic (contour-based), NOT a trained ML model.", warning_style))
    elements.append(Paragraph("• Anomaly analysis: DEMO heuristic (variance-based), NOT a trained autoencoder.", warning_style))
    elements.append(Paragraph("• All results are EXPERIMENTAL and require human verification.", warning_style))
    elements.append(Paragraph("• No field validation has been performed.", warning_style))
    elements.append(Paragraph("• Coordinates are pixel-based unless GPS metadata was provided.", warning_style))

    doc.build(elements)
    return output_path
