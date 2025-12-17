import React from 'react';
import Button from '../../../shared/ui/Button.jsx';

export default function ExportButtons({ onExport, loading }) {
    return (
        <div className="flex space-x-2">
            <Button variant="secondary" size="sm" onClick={() => onExport('pdf')} disabled={loading}>
                Exportar PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onExport('excel')} disabled={loading}>
                Exportar Excel
            </Button>
        </div>
    );
}
