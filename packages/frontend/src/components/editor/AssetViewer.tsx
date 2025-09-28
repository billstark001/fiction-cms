import * as styles from './styles.css';

interface AssetViewerProps {
  filePath: string;
  fileType: 'sqlite' | 'asset';
}

export default function AssetViewer({ filePath, fileType }: AssetViewerProps) {
  const getSvgIcon = () => {
    if (fileType === 'sqlite') {
      return (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className={styles.assetIcon}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
      );
    }

    return (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className={styles.assetIcon}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21,15 16,10 5,21"></polyline>
      </svg>
    );
  };

  const getTitle = () => {
    return fileType === 'sqlite' ? 'SQLite Editor' : 'Asset File';
  };

  const getDescription = () => {
    return fileType === 'sqlite'
      ? 'SQLite database editing features coming soon'
      : 'Binary assets cannot be edited as text';
  };

  return (
    <div className={styles.assetContainer}>
      {getSvgIcon()}
      <h3 className={styles.assetTitle}>{getTitle()}</h3>
      <p>{getDescription()}</p>
      <p className={styles.assetPath}>
        Path: <code className={styles.codeStyle}>{filePath}</code>
      </p>
    </div>
  );
}