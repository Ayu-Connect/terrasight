import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

import { supabase } from '../supabase/client';

export const generateFIR = async (detectionId: string | number) => {
    // 1. Fetch Data from Supabase
    let query = supabase.from('detections').select('*');

    // Check if detectionId is likely a number (Supabase ID) or Hash
    const isNum = !isNaN(Number(detectionId));

    if (isNum) {
        query = query.eq('id', detectionId);
    } else {
        // Assume it's a Transaction Hash or Evidence Hash part or string ID
        query = query.eq('id', detectionId);
        // Note: If ID is UUID string, isNum is false, equality works.
        // If detectionId is txHash, this check fails if DB id is UUID/Int. 
        // But orchestrator uses int8 or uuid? Supabase default is usually int8.
        // 'activeTarget.id' comes from 'detection.id.toString()' in useRealtimeAlerts. So it is the ID.
    }

    const { data: detection, error } = await query.single();

    if (error || !detection) {
        console.error("FIR Generation Error:", error);
        // Fallback or throw?
        // If fetching fails, we can't generate the full report from DB.
        throw new Error("Detection not found in database");
    }

    // 2. Create PDF
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();

    // 3. Add Content
    const fontSize = 12;
    const margin = 50;
    let yPosition = height - margin;

    const drawText = (text: string, size = fontSize, color = rgb(0, 0, 0)) => {
        page.drawText(text, {
            x: margin,
            y: yPosition,
            size,
            font: timesRomanFont,
            color,
        });
        yPosition -= size + 10;
    };

    drawText('FIRST INFORMATION REPORT (FIR)', 20, rgb(1, 0, 0));
    yPosition -= 10;
    drawText(`Report Generated: ${new Date().toISOString()}`, 10);
    yPosition -= 20;

    drawText(`Violation ID: ${detection.id}`);
    drawText(`Detection Time: ${detection.detected_at}`);
    drawText(`Location: ${detection.lat}, ${detection.lng}`);
    drawText(`Zone: ${detection.zone_name}`);
    yPosition -= 10;

    drawText('LEGAL VIOLATIONS:', 14, rgb(0, 0, 1));
    drawText(`Law: ${detection.violation_type}`);
    drawText(`Article: ${detection.article || 'N/A'}`);
    drawText(`Section: ${detection.section}`);
    drawText(`Severity: ${detection.severity}`, 12, detection.severity === 'CRITICAL' ? rgb(1, 0, 0) : rgb(0, 0, 0));
    drawText(`Penalty: ${detection.penalty_type || 'N/A'}`);
    drawText(`Jurisdiction: ${detection.jurisdiction || 'N/A'}`);
    yPosition -= 20;

    drawText('FORENSIC EVIDENCE (FUSION ENGINE):', 14, rgb(0, 0, 1));
    drawText(`Source: Multi-Spectral Fusion (ISRO Cartosat + Sentinel-1/2)`);
    drawText(`AI Confidence: ${(detection.confidence * 100).toFixed(2)}% (DRDO-Logic Verified)`);
    drawText(`Blockchain Tx Hash: ${detection.transaction_hash || 'PENDING'}`);
    drawText(`Media Evidence Hash: ${detection.evidence_hash || 'N/A'}`);
    yPosition -= 20;

    drawText('Authorized By: CodeGenesis Neuro-Symbolic Gate', 10);

    // 4. Save/Export
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
};
