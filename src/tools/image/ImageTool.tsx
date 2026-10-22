import React, { useState, useEffect } from 'react';
import { FileUp, Download, Sliders, Eraser } from 'lucide-react';
import { useToast } from '../../components/common/Toast';

type OutputFormat = 'image/webp' | 'image/png' | 'image/jpeg';
type FilterType = 'none' | 'grayscale' | 'sepia' | 'invert';

export const ImageTool: React.FC = () => {
  const { toast } = useToast();
  const [sourceImg, setSourceImg] = useState<HTMLImageElement | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; width: number; height: number } | null>(null);

  // Settings
  const [activeMode, setActiveMode] = useState<'adjust' | 'removeBg'>('adjust');
  const [format, setFormat] = useState<OutputFormat>('image/webp');
  const [quality, setQuality] = useState<number>(0.85);
  const [scale, setScale] = useState<number>(100);
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [filter, setFilter] = useState<FilterType>('none');
  const [watermarkText, setWatermarkText] = useState<string>('');

  // Remove Background Settings
  const [bgTolerance, setBgTolerance] = useState<number>(32);
  const [targetBgColor, setTargetBgColor] = useState<string>('#ffffff');
  const [autoSampleCorner, setAutoSampleCorner] = useState<boolean>(true);
  const [smoothEdges, setSmoothEdges] = useState<boolean>(true);

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

  // Process image
  useEffect(() => {
    if (!sourceImg || !fileInfo) return;

    setIsProcessing(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
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

    // Remove background algorithm if in removeBg mode
    if (activeMode === 'removeBg') {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      let targetR = 255;
      let targetG = 255;
      let targetB = 255;

      if (autoSampleCorner) {
        // Sample top-left corner
        targetR = data[0];
        targetG = data[1];
        targetB = data[2];
      } else {
        // Hex to RGB
        const hex = targetBgColor.replace('#', '');
        if (hex.length === 6) {
          targetR = parseInt(hex.substring(0, 2), 16);
          targetG = parseInt(hex.substring(2, 4), 16);
          targetB = parseInt(hex.substring(4, 6), 16);
        }
      }

      const tolSq = bgTolerance * bgTolerance * 3;
      const featherSq = (bgTolerance + (smoothEdges ? 18 : 2)) * (bgTolerance + (smoothEdges ? 18 : 2)) * 3;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const distSq = (r - targetR) * (r - targetR) + (g - targetG) * (g - targetG) + (b - targetB) * (b - targetB);

        if (distSq <= tolSq) {
          data[i + 3] = 0; // Completely transparent
        } else if (distSq < featherSq && smoothEdges) {
          // Feather edge
          const factor = (distSq - tolSq) / (featherSq - tolSq);
          data[i + 3] = Math.round(data[i + 3] * factor);
        }
      }

      ctx.putImageData(imgData, 0, 0);
    }

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

    const outputFormat = activeMode === 'removeBg' ? 'image/png' : format;

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const newUrl = URL.createObjectURL(blob);
        setProcessedUrl(newUrl);
        setProcessedSize(blob.size);
        setIsProcessing(false);
      },
      outputFormat,
      outputFormat === 'image/png' ? undefined : quality
    );
  }, [sourceImg, activeMode, format, quality, targetWidth, targetHeight, filter, watermarkText, bgTolerance, targetBgColor, autoSampleCorner, smoothEdges]);

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
    const ext = activeMode === 'removeBg' ? 'png' : format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg';
    const a = document.createElement('a');
    a.href = processedUrl;
    a.download = `${fileInfo.name}_${activeMode === 'removeBg' ? 'nobg' : 'processed'}.${ext}`;
    a.click();
    toast('处理完成，图片已下载', 'success');
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {!fileInfo ? (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>图片处理</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              纯浏览器 Canvas 本地快速压缩、格式互转、尺寸缩放与**去除背景（抠图透明化）**，绝不消耗任何服务器流量。
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Function Mode Switcher */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <button
              className={`btn ${activeMode === 'adjust' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveMode('adjust')}
            >
              <Sliders size={16} /> 格式转换与尺寸压缩
            </button>
            <button
              className={`btn ${activeMode === 'removeBg' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setActiveMode('removeBg');
                setFormat('image/png');
              }}
            >
              <Eraser size={16} /> 去除背景 (抠图透明化)
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
            {/* Controls Sidebar */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                  {activeMode === 'adjust' ? '常规处理设置' : '智能去底色设置'}
                </h3>
                <label className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                  换图
                </label>
              </div>

              {activeMode === 'removeBg' ? (
                <>
                  <div
                    style={{
                      padding: '10px 12px',
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.75rem',
                      color: 'var(--accent-primary)',
                      lineHeight: 1.5,
                    }}
                  >
                    💡 <strong>使用提示：</strong>适合白底图、纯色背景照、证件照或 Logo 扣除底色。自动将选定颜色转为透明通道，导出为高质量透明 PNG。
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8125rem' }}>
                      <span>容差阈值 (Tolerance)</span>
                      <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{bgTolerance}</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="90"
                      value={bgTolerance}
                      onChange={(e) => setBgTolerance(Number(e.target.value))}
                      className="slider-input"
                    />
                  </div>

                  <label className="switch-label">
                    <input
                      type="checkbox"
                      className="switch-input"
                      checked={autoSampleCorner}
                      onChange={(e) => setAutoSampleCorner(e.target.checked)}
                    />
                    自动采样左上角底色
                  </label>

                  {!autoSampleCorner && (
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label">指定要移除的背景颜色</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="color"
                          value={targetBgColor}
                          onChange={(e) => setTargetBgColor(e.target.value)}
                          style={{ width: '40px', height: '36px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent' }}
                        />
                        <input
                          type="text"
                          className="input-text input-mono"
                          value={targetBgColor}
                          onChange={(e) => setTargetBgColor(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <label className="switch-label">
                    <input
                      type="checkbox"
                      className="switch-input"
                      checked={smoothEdges}
                      onChange={(e) => setSmoothEdges(e.target.checked)}
                    />
                    开启边缘羽化平滑过渡
                  </label>
                </>
              ) : (
                <>
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
                </>
              )}
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>原图信息</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {formatBytes(fileInfo.size)} ({fileInfo.width}×{fileInfo.height})
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>处理后预估大小</div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--accent-cyan)' }}>
                    {formatBytes(processedSize)} ({targetWidth}×{targetHeight})
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary" onClick={handleDownload} disabled={isProcessing || !processedUrl}>
                    <Download size={16} /> {activeMode === 'removeBg' ? '导出透明 PNG' : '导出下载'}
                  </button>
                </div>
              </div>

              {/* Image Preview Canvas with Checkerboard Transparency Grid */}
              <div
                style={{
                  flex: 1,
                  minHeight: '380px',
                  background: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 20px 20px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  padding: '16px',
                  border: '1px solid var(--border-color)',
                  position: 'relative',
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
                {activeMode === 'removeBg' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      background: 'rgba(0,0,0,0.6)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '0.6875rem',
                      color: '#fff',
                    }}
                  >
                    棋盘格背景表示透明通道
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
