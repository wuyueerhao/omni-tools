import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileUp, Download, Table, FileJson, FileSpreadsheet, Search } from 'lucide-react';
import { useToast } from '../../components/common/Toast';

export const ExcelTool: React.FC = () => {
  const { toast } = useToast();
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [tableData, setTableData] = useState<any[][]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'json'>('preview');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        if (wb.SheetNames.length > 0) {
          const firstSheet = wb.SheetNames[0];
          setSelectedSheet(firstSheet);
          loadSheetData(wb, firstSheet);
        }
        toast(`成功解析 ${file.name}，包含 ${wb.SheetNames.length} 个工作表`, 'success');
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        toast(`解析表格失败: ${errorMsg}`, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const loadSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    const worksheet = wb.Sheets[sheetName];
    if (!worksheet) return;
    const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    setTableData(jsonData);
  };

  const handleSheetChange = (sheet: string) => {
    if (!workbook) return;
    setSelectedSheet(sheet);
    loadSheetData(workbook, sheet);
  };

  // Export to CSV
  const exportToCsv = () => {
    if (!workbook || !selectedSheet) return;
    const worksheet = workbook.Sheets[selectedSheet];
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_${selectedSheet}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('已导出 CSV 文件', 'success');
  };

  // Export to JSON
  const exportToJson = () => {
    if (!workbook || !selectedSheet) return;
    const worksheet = workbook.Sheets[selectedSheet];
    const json = XLSX.utils.sheet_to_json(worksheet);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_${selectedSheet}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('已导出 JSON 文件', 'success');
  };

  // Export to standard XLSX
  const exportToXlsx = () => {
    if (!workbook) return;
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_exported.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast('已导出 XLSX 表格', 'success');
  };

  // Search filtering
  const filteredData = tableData.filter((row, idx) => {
    if (idx === 0) return true; // keep header
    if (!searchQuery.trim()) return true;
    return row.some((cell) => cell != null && String(cell).toLowerCase().includes(searchQuery.toLowerCase().trim()));
  });

  const headers = tableData.length > 0 ? tableData[0] : [];
  const rows = filteredData.slice(1);

  // Convert current sheet to JSON object for preview
  const jsonPreview = workbook && selectedSheet
    ? JSON.stringify(XLSX.utils.sheet_to_json(workbook.Sheets[selectedSheet]).slice(0, 50), null, 2)
    : '[]';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {!workbook ? (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Excel工具</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              支持 .xlsx, .xls, .csv 文件纯本地解析。格式无损互转 (Excel/CSV/JSON)、大表在线快速过滤与清洗。
            </p>
          </div>

          <label className="dropzone">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <FileUp size={40} color="var(--accent-primary)" />
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>选择或拖拽上传表格文件</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              支持 Excel (.xlsx, .xls) 和 CSV 格式
            </div>
          </label>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Control Bar */}
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Sheet Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                工作表 (Sheet):
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {sheetNames.map((s) => (
                  <button
                    key={s}
                    className={`btn ${selectedSheet === s ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
                    onClick={() => handleSheetChange(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={exportToCsv}>
                <FileSpreadsheet size={15} /> 导出为 CSV
              </button>
              <button className="btn btn-secondary" onClick={exportToJson}>
                <FileJson size={15} /> 导出为 JSON
              </button>
              <button className="btn btn-primary" onClick={exportToXlsx}>
                <Download size={15} /> 导出标准 XLSX
              </button>

              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <input type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />
                换表
              </label>
            </div>
          </div>

          {/* Filter & View Mode */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '360px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input
                  type="text"
                  className="input-text"
                  style={{ paddingLeft: '36px' }}
                  placeholder="过滤表格内容关键词..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                共 <strong>{tableData.length - 1}</strong> 行数据 (当前显示 {rows.length} 行)
              </span>

              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className={`btn ${activeTab === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                  onClick={() => setActiveTab('preview')}
                >
                  <Table size={14} /> 表格视图
                </button>
                <button
                  className={`btn ${activeTab === 'json' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                  onClick={() => setActiveTab('json')}
                >
                  <FileJson size={14} /> JSON 视图
                </button>
              </div>
            </div>
          </div>

          {/* Data Content View */}
          {activeTab === 'preview' ? (
            <div
              className="glass-panel"
              style={{
                padding: 0,
                overflowX: 'auto',
                maxHeight: '520px',
                border: '1px solid var(--border-color)',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.8125rem',
                }}
              >
                <thead
                  style={{
                    position: 'sticky',
                    top: 0,
                    background: 'var(--bg-elevated)',
                    zIndex: 10,
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <tr>
                    <th style={{ padding: '10px 14px', color: 'var(--text-muted)', width: '48px' }}>#</th>
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: '10px 14px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          borderRight: '1px solid var(--border-color)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {String(h ?? `Col ${i + 1}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                      }}
                    >
                      <td style={{ padding: '8px 14px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {rIdx + 1}
                      </td>
                      {headers.map((_, cIdx) => (
                        <td
                          key={cIdx}
                          style={{
                            padding: '8px 14px',
                            color: 'var(--text-secondary)',
                            borderRight: '1px solid var(--border-color)',
                            whiteSpace: 'nowrap',
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {row[cIdx] !== undefined ? String(row[cIdx]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 100 && (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  为保证前端渲染性能，仅预览前 100 行数据，导出时包含全部 {rows.length} 行数据
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '16px' }}>
              <pre
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-primary)',
                  maxHeight: '480px',
                  overflowY: 'auto',
                }}
              >
                {jsonPreview}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
