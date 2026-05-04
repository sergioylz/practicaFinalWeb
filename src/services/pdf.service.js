import PDFDocument from 'pdfkit';

export const generateDeliveryNotePdf = (note) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(20).text('ALBARÁN', { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).text('Datos del cliente');
        doc.fontSize(11)
            .text(`Nombre: ${note.client?.name ?? ''}`)
            .text(`CIF: ${note.client?.cif ?? ''}`)
            .text(`Email: ${note.client?.email ?? ''}`);
        doc.moveDown();

        doc.fontSize(14).text('Datos del proyecto');
        doc.fontSize(11)
            .text(`Proyecto: ${note.project?.name ?? ''}`)
            .text(`Código: ${note.project?.projectCode ?? ''}`);
        doc.moveDown();

        doc.fontSize(14).text('Detalle del albarán');
        doc.fontSize(11)
            .text(`Tipo: ${note.format === 'hours' ? 'Horas trabajadas' : 'Material'}`)
            .text(`Fecha: ${new Date(note.workDate).toLocaleDateString('es-ES')}`);

        if (note.description) doc.text(`Descripción: ${note.description}`);
        doc.moveDown();

        if (note.format === 'hours') {
            if (note.hours) doc.text(`Horas: ${note.hours}h`);
            if (note.workers?.length > 0) {
                doc.text('Trabajadores:');
                note.workers.forEach(w => doc.text(`  - ${w.name}: ${w.hours}h`));
            }
        } else {
            doc.text(`Material: ${note.material}`);
            doc.text(`Cantidad: ${note.quantity} ${note.unit}`);
        }

        if (note.signatureUrl) {
            doc.moveDown();
            doc.fontSize(14).text('Firma');
            doc.image(note.signatureUrl, { width: 200, height: 100 });
            if (note.signedAt) {
                doc.fontSize(11).text(`Firmado el: ${new Date(note.signedAt).toLocaleDateString('es-ES')}`);
            }
        }

        doc.end();
    });
};
