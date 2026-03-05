export default async function handler(req, res) {
  try {
    const response = await fetch('https://wecam-live-production.up.railway.app/health');
    const data = await response.json();
    res.status(200).json({ pinged: true, server: data });
  } catch (err) {
    res.status(500).json({ pinged: false, error: err.message });
  }
}
