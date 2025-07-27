const downloadService = require('../services/downloadService');

async function downloadFile(req, res) {
  try {
    const { filename } = req.params;
    const filePath = await downloadService.getDownloadPath(filename);

    res.download(filePath);
  } catch (error) {
    console.error('Download failed:', error);
    res.status(500).json({ error: 'File download failed' });
  }
}

module.exports = { downloadFile };np