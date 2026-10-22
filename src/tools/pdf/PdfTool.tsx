import React, { useState } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { FileUp, Download, Layers, Scissors, RotateCw, Stamp, Trash2 } from 'lucide-react';
import { useToast } from '../../components/common/Toast';

type PdfSubTab = 'merge' | 'split' | 'rotate' | 'watermark';

interface UploadedPdfItem {
  id: string;
  name: string;
  size: number;
  file: File;
  pageCount?: number;
}

export const PdfTool: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<PdfSubTab>('merge');
  const [isProcessing, setIsProcessing] = useState(false);

  // Merge state
  const [mergeFiles, setMergeFiles] = useState<UploadedPdfItem[]>([]);

  // Split state
  const [splitFile, setSplitFile] = useState<UploadedPdfItem | null>(null);
  const [pageRange, setPageRange] = useState<string>('1-2');

  // Rotate state
  const [rotateFile, setRotateFile] = useState<UploadedPdfItem | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(90);

  // Watermark state
  const [watermarkFile, setWatermarkFile] = useState<UploadedPdfItem | null>(null);
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL 内部机密');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.3);

  // Helper: Load PDF page count
  const inspectPdf = async (file: File): Promise<number> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc.getPageCount();
  };

  // Helper: Trigger Download
  const downloadBytes = (bytes: Uint8Array, fileName: string) => {
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 1. Merge action
  const handleAddMergeFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newItems: UploadedPdfItem[] = [];
    for (const f of Array.from(e.target.files)) {
      if (f.type !== 'application/pdf' && !f.name.endsWith('.pdf')) continue;
      try {
        const count = await inspectPdf(f);
        newItems.push({
          id: Math.random().toString(36).substring(2, 9),
          name: f.name,
          size: f.size,
          file: f,
          pageCount: count,
        });
      } catch {
        toast(`解析文件 ${f.name} 失败`, 'error');
      }
    }
    setMergeFiles((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleExecuteMerge = async () => {
    if (mergeFiles.length < 2) {
      toast('请至少添加 2 个 PDF 文件进行合并', 'error');
      return;
    }
    try {
      setIsProcessing(true);
      const mergedPdf = await PDFDocument.create();
      for (const item of mergeFiles) {
        const buffer = await item.file.arrayBuffer();
        const doc = await PDFDocument.load(buffer);
        const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      downloadBytes(pdfBytes, `merged_${Date.now()}.pdf`);
      toast('合并完成，文件已开始下载', 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast(`合并失败: ${errorMsg}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Split action
  const handleSplitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await inspectPdf(file);
      setSplitFile({
        id: 'split',
        name: file.name,
        size: file.size,
        file,
        pageCount: count,
      });
      setPageRange(`1-${Math.min(count, 3)}`);
    } catch {
      toast('解析 PDF 失败', 'error');
    }
    e.target.value = '';
  };

  const handleExecuteSplit = async () => {
    if (!splitFile) {
      toast('请先选择要拆分的 PDF 文件', 'error');
      return;
    }
    try {
      setIsProcessing(true);
      const buffer = await splitFile.file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      const totalPages = doc.getPageCount();

      // Parse range: e.g. "1-3, 5"
      const pagesToKeep = new Set<number>();
      const parts = pageRange.split(',').map((p) => p.trim());
      for (const p of parts) {
        if (p.includes('-')) {
          const [startStr, endStr] = p.split('-').map((s) => parseInt(s.trim(), 10));
          if (!isNaN(startStr) && !isNaN(endStr)) {
            const start = Math.max(1, startStr);
            const end = Math.min(totalPages, endStr);
            for (let i = start; i <= end; i++) pagesToKeep.add(i - 1);
          }
        } else {
          const single = parseInt(p, 10);
          if (!isNaN(single) && single >= 1 && single <= totalPages) {
            pagesToKeep.add(single - 1);
          }
        }
      }

      const indices = Array.from(pagesToKeep).sort((a, b) => a - b);
      if (indices.length === 0) {
        toast('提取的页码超出有效范围', 'error');
        setIsProcessing(false);
        return;
      }

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(doc, indices);
      copiedPages.forEach((p) => newPdf.addPage(p));

      const pdfBytes = await newPdf.save();
      downloadBytes(pdfBytes, `split_${splitFile.name}`);
      toast(`成功提取 ${indices.length} 页并已导出`, 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast(`拆分失败: ${errorMsg}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Rotate action
  const handleRotateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await inspectPdf(file);
      setRotateFile({
        id: 'rotate',
        name: file.name,
        size: file.size,
        file,
        pageCount: count,
      });
    } catch {
      toast('解析 PDF 失败', 'error');
    }
    e.target.value = '';
  };

  const handleExecuteRotate = async () => {
    if (!rotateFile) {
      toast('请先选择要旋转的 PDF', 'error');
      return;
    }
    try {
      setIsProcessing(true);
      const buffer = await rotateFile.file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      const pages = doc.getPages();
      pages.forEach((p) => {
        const currentAngle = p.getRotation().angle;
        p.setRotation(degrees((currentAngle + rotationAngle) % 360));
      });
      const pdfBytes = await doc.save();
      downloadBytes(pdfBytes, `rotated_${rotateFile.name}`);
      toast('页面旋转完成并已下载', 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast(`旋转失败: ${errorMsg}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Watermark action
  const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const count = await inspectPdf(file);
      setWatermarkFile({
        id: 'watermark',
        name: file.name,
        size: file.size,
        file,
        pageCount: count,
      });
    } catch {
      toast('解析 PDF 失败', 'error');
    }
    e.target.value = '';
  };

  const handleExecuteWatermark = async () => {
    if (!watermarkFile) {
      toast('请先选择 PDF 文件', 'error');
      return;
    }
    try {
      setIsProcessing(true);
      const buffer = await watermarkFile.file.arrayBuffer();
      const doc = await PDFDocument.load(buffer);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const pages = doc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText(watermarkText, {
          x: width / 4,
          y: height / 2,
          size: 38,
          font,
          color: rgb(0.6, 0.6, 0.6),
          opacity: watermarkOpacity,
          rotate: degrees(35),
        });
      });

      const pdfBytes = await doc.save();
      downloadBytes(pdfBytes, `watermarked_${watermarkFile.name}`);
      toast('水印已成功添加', 'success');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast(`添加水印失败: ${errorMsg}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          className={`btn ${activeTab === 'merge' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('merge')}
        >
          <Layers size={16} /> PDF 合并
        </button>
        <button
          className={`btn ${activeTab === 'split' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('split')}
        >
          <Scissors size={16} /> 页面提取 / 拆分
        </button>
        <button
          className={`btn ${activeTab === 'rotate' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('rotate')}
        >
          <RotateCw size={16} /> 页面旋转
        </button>
        <button
          className={`btn ${activeTab === 'watermark' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('watermark')}
        >
          <Stamp size={16} /> 添加防伪水印
        </button>
      </div>

      {/* 1. Merge Tab */}
      {activeTab === 'merge' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>PDF 多文件合并</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              选择多个 PDF 文件，合并成一个完整的 PDF。所有文件均在浏览器本地处理，安全可靠。
            </p>
          </div>

          <label className="dropzone">
            <input type="file" accept="application/pdf" multiple style={{ display: 'none' }} onChange={handleAddMergeFiles} />
            <FileUp size={36} color="var(--accent-primary)" />
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>点击或拖拽添加 PDF 文件</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>支持批量添加多个 PDF 文件</div>
          </label>

          {mergeFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                待合并文件列表 ({mergeFiles.length})
              </div>
              {mergeFiles.map((f, idx) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-primary">#{idx + 1}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{f.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({f.pageCount} 页 · {(f.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    className="btn-ghost"
                    style={{ color: 'var(--accent-rose)', padding: '4px 6px' }}
                    onClick={() => setMergeFiles((prev) => prev.filter((item) => item.id !== f.id))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setMergeFiles([])}
                  disabled={isProcessing}
                >
                  清空列表
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleExecuteMerge}
                  disabled={isProcessing || mergeFiles.length < 2}
                >
                  <Download size={16} />
                  {isProcessing ? '正在合并中...' : '开始合并并下载'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Split Tab */}
      {activeTab === 'split' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>PDF 页面提取与拆分</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              提取指定页码范围生成新的独立 PDF 文件。
            </p>
          </div>

          {!splitFile ? (
            <label className="dropzone">
              <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleSplitUpload} />
              <FileUp size={36} color="var(--accent-primary)" />
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>选择要拆分的 PDF 文件</div>
            </label>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{splitFile.name}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    总页数: <strong>{splitFile.pageCount}</strong> 页 · {(splitFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setSplitFile(null)}>
                  重选文件
                </button>
              </div>

              <div className="input-group">
                <label className="input-label">
                  <span>提取页码范围 (例如: 1-3 或 1,3,5 或 1-2,4)</span>
                  <span style={{ color: 'var(--accent-primary)' }}>可用 1 ~ {splitFile.pageCount}</span>
                </label>
                <input
                  type="text"
                  className="input-text input-mono"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="例如: 1-3, 5"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleExecuteSplit} disabled={isProcessing}>
                  <Download size={16} />
                  {isProcessing ? '正在处理...' : '提取所选页面并导出'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Rotate Tab */}
      {activeTab === 'rotate' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>PDF 页面方向旋转</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              批量纠正倾斜或倒置扫描的 PDF 页面。
            </p>
          </div>

          {!rotateFile ? (
            <label className="dropzone">
              <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleRotateUpload} />
              <FileUp size={36} color="var(--accent-primary)" />
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>选择要旋转的 PDF 文件</div>
            </label>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{rotateFile.name}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    总页数: {rotateFile.pageCount} 页
                  </div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setRotateFile(null)}>
                  重选文件
                </button>
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: '8px' }}>旋转顺时针角度</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      className={`btn ${rotationAngle === deg ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setRotationAngle(deg)}
                    >
                      <RotateCw size={14} /> 顺时针 {deg}°
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button className="btn btn-primary" onClick={handleExecuteRotate} disabled={isProcessing}>
                  <Download size={16} />
                  {isProcessing ? '正在处理...' : `旋转并导出 PDF`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Watermark Tab */}
      {activeTab === 'watermark' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>PDF 添加文本水印</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              在每页 PDF 上加盖倾斜透明防伪文字水印。
            </p>
          </div>

          {!watermarkFile ? (
            <label className="dropzone">
              <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleWatermarkUpload} />
              <FileUp size={36} color="var(--accent-primary)" />
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>选择要加水印的 PDF 文件</div>
            </label>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{watermarkFile.name}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    总页数: {watermarkFile.pageCount} 页
                  </div>
                </div>
                <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setWatermarkFile(null)}>
                  重选文件
                </button>
              </div>

              <div className="input-group">
                <label className="input-label">水印文本 (Watermark Text)</label>
                <input
                  type="text"
                  className="input-text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
                  <span>水印不透明度 (Opacity)</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{Math.round(watermarkOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.8"
                  step="0.05"
                  value={watermarkOpacity}
                  onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                  className="slider-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button className="btn btn-primary" onClick={handleExecuteWatermark} disabled={isProcessing}>
                  <Download size={16} />
                  {isProcessing ? '正在生成水印...' : '生成并下载加水印 PDF'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
