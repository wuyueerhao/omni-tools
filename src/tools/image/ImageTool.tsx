import React, { useState, useEffect } from 'react';
import { FileUp, Download, Sliders } from 'lucide-react';
import { useToast } from '../../components/common/Toast';

type OutputFormat = 'image/webp' | 'image/png' | 'image/jpeg';
type FilterType = 'none' | 'grayscale' | 'sepia' | 'invert';

export const ImageTool: React.FC = () => {
  const { toast } = useToast();
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; width: number; height: number } | null>(null);

  // Settings
  const [format, setFormat] = useState<OutputFormat>('image/webp');
  const [quality, setQuality] = useState<number>(0.85);
  const [scale, setScale] = useState<number>(100);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [filter, setFilter] = useState<FilterType>('none');
  const [watermarkText, setWatermarkText] = useState<string>('');

  // Processed Output
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedSize, setProcessedSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      setSourceImg(img);
      setFileInfo({
        name: file.name.replace(/\.[^/.]+$/, ''),
        size: file.size,
        width: img.width,
        height: img.height,
      });
      setTargetWidth(img.width);
      setTargetHeight(img.height);
      setScale(100);
    };
    img.src = objectUrl;
    e.target.value = '';
  };

  // Re-process image whenever settings change
  useEffect(() => {
    if (!sourceImg || !fileInfo) return;

    setIsProcessing(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = targetWidth || sourceImg.width;
    const h = targetHeight || sourceImg.height;

    canvas.width = w;
    canvas.height = h;

    // Apply Filter
    let filterString = 'none';
    if (filter === 'grayscale') filterString = 'grayscale(100%)';
    else if (filter === 'sepia') filterString = 'sepia(100%)';
    else if (filter === 'invert') filterString = 'invert(100%)';

    ctx.filter = filterString;
    ctx.drawImage(sourceImg, 0, 0, w, h);
    ctx.filter = 'none';

    // Apply Watermark if any
    if (watermarkText.trim()) {
      ctx.save();
      const fontSize = Math.max(16, Math.floor(w * 0.04));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.strokeText(watermarkText, w - 20, h - 20);
      ctx.fillText(watermarkText, w - 20, h - 20);
      ctx.restore();
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const newUrl = URL.createObjectURL(blob);
        setProcessedUrl(newUrl);
        setProcessedSize(blob.size);
        setIsProcessing(false);
      },
      format,
      format === 'image/png' ? undefined : quality
    );
  }, [sourceImg, format, quality, targetWidth, targetHeight, filter, watermarkText]);

  const handleWidthChange = (w: number) => {
    setTargetWidth(w);
    if (lockAspectRatio && fileInfo) {
      const ratio = fileInfo.height / fileInfo.width;
      setTargetHeight(Math.round(w * ratio));
    }
  };

  const handleHeightChange = (h: number) => {
    setTargetHeight(h);
    if (lockAspectRatio && fileInfo) {
      const ratio = fileInfo.width / fileInfo.height;
      setTargetWidth(Math.round(h * ratio));
    }
  };

  const handlePresetScale = (pct: number) => {
    if (!fileInfo) return;
    setScale(pct);
    setTargetWidth(Math.round((fileInfo.width * pct) / 100));
    setTargetHeight(Math.round((fileInfo.height * pct) / 100));
  };

  const handleDownload = () => {
    if (!processedUrl || !fileInfo) return;
    const ext = format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg';
    const a = document.createElement('a');
    a.href = processedUrl;
    a.download = `${fileInfo.name}_processed.${ext}`;
    a.click();
    toast('处理完成，图片已下载', 'success');
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const compressionRatio = fileInfo && processedSize
    ? (((fileInfo.size - processedSize) / fileInfo.size) * 100).toFixed(1)
    : '0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {!fileInfo ? (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>图片处理工坊</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              纯浏览器 Canvas 本地快速压缩、格式互转、尺寸缩放与水印加盖，绝不消耗任何服务器流量。
            </p>
          </div>

          <label className="dropzone">
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            <FileUp size={40} color="var(--accent-primary)" />
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>点击或拖拽上传图片</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              支持 PNG, JPG, JPEG, WebP, GIF, SVG 等常见格式
            </div>
          </label>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
          {/* Controls Sidebar */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="var(--accent-primary)" />
                图像参数调整
              </h3>
              <label className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                换图
              </label>
            </div>

            {/* Target Format */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">目标格式</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {(
                  [
                    { id: 'image/webp', label: 'WebP (推荐)' },
                    { id: 'image/jpeg', label: 'JPEG' },
                    { id: 'image/png', label: 'PNG' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    className={`btn ${format === f.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '6px', fontSize: '0.75rem' }}
                    onClick={() => setFormat(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider (for webp & jpeg) */}
            {format !== 'image/png' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8125rem' }}>
                  <span>压缩质量</span>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="slider-input"
                />
              </div>
            )}

            {/* Dimensions */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8125rem' }}>
                <span>缩放比例</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{scale}%</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    className={`btn ${scale === pct ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '4px', fontSize: '0.75rem' }}
                    onClick={() => handlePresetScale(pct)}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">宽度 (px)</label>
                  <input
                    type="number"
                    className="input-text"
                    value={targetWidth}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">高度 (px)</label>
                  <input
                    type="number"
                    className="input-text"
                    value={targetHeight}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 1)}
                  />
                </div>
              </div>

              <label className="switch-label" style={{ marginTop: '10px' }}>
                <input
                  type="checkbox"
                  className="switch-input"
                  checked={lockAspectRatio}
                  onChange={(e) => setLockAspectRatio(e.target.checked)}
                />
                锁定等比缩放
              </label>
            </div>

            {/* Filters */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">色彩滤镜</label>
              <select
                className="select-box"
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
              >
                <option value="none">原色 (无滤镜)</option>
                <option value="grayscale">经典黑白 (Grayscale)</option>
                <option value="sepia">复古褐色 (Sepia)</option>
                <option value="invert">底片反色 (Invert)</option>
              </select>
            </div>

            {/* Watermark */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">右下角水印文字</label>
              <input
                type="text"
                className="input-text"
                placeholder="留空则不添加"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
              />
            </div>
          </div>

          {/* Preview & Stats Panel */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Stats Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>原图大小</div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  {formatBytes(fileInfo.size)} ({fileInfo.width}×{fileInfo.height})
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>优化结果</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: Number(compressionRatio) >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                  {Number(compressionRatio) >= 0 ? `节省 ${compressionRatio}%` : `体积增加 ${Math.abs(Number(compressionRatio))}%`}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>处理后预估大小</div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--accent-cyan)' }}>
                  {formatBytes(processedSize)} ({targetWidth}×{targetHeight})
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleDownload} disabled={isProcessing || !processedUrl}>
                <Download size={16} /> 导出下载
              </button>
            </div>

            {/* Image Preview Canvas */}
            <div
              style={{
                flex: 1,
                minHeight: '360px',
                background: 'repeating-conic-gradient(#182030 0% 25%, #101622 0% 50%) 50% / 20px 20px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                padding: '16px',
                border: '1px solid var(--border-color)',
              }}
            >
              {processedUrl && (
                <img
                  src={processedUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '440px',
                    objectFit: 'contain',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
