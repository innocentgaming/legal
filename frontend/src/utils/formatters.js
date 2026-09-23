export function formatWordCount(count) {
  if (!count) return '0 words';
  return count.toLocaleString() + ' words';
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function truncateText(text, maxLen = 150) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

export function getCategoryBadgeColor(category) {
  switch (category) {
    case 'Indemnification':
      return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.35)', text: '#fca5a5' };
    case 'Limitation of Liability':
      return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)', text: '#fcd34d' };
    case 'Confidentiality':
      return { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.35)', text: '#93c5fd' };
    case 'Termination & Remedies':
      return { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.35)', text: '#f472b6' };
    case 'Intellectual Property':
      return { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.35)', text: '#c4b5fd' };
    case 'Governing Law & Disputes':
      return { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.35)', text: '#67e8f9' };
    default:
      return { bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.25)', text: '#cbd5e1' };
  }
}
